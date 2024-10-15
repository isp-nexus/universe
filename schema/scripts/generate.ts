/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ISPNexusSchemaURL, JSONSchemaID } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { TJS, programFromConfig } from "@isp.nexus/schema/sdk"
import { createCLIProgressBar, runScript } from "@isp.nexus/sdk"
import { cleanGeneratedArtifacts, createETag, writeLocalJSONFile, writeLocalTextFile } from "@isp.nexus/sdk/files"
import { ISPNexusPackage, ISPNexusPackages } from "@isp.nexus/sdk/runtime/packages"
import { ISPNexusPackagePath, packagePathBuilder, repoRootPathBuilder } from "@isp.nexus/sdk/runtime/repo-paths"
import { JSONSchema7 } from "json-schema"
import YAML from "json-to-pretty-yaml"
import { basename } from "node:path"
import ts from "typescript"

type DocTagMap = Map<string, ts.SymbolDisplayPart[]>

type SignatureLike = ts.Type &
	Pick<ts.Signature, "getJsDocTags"> & {
		/**
		 * The JSDoc tags associated with the signature.
		 */
		docTagMap: DocTagMap
	}

function isSignatureLike(input: unknown): input is SignatureLike {
	return Boolean(input && typeof input === "object" && "getJsDocTags" in input)
}

function pluckDeclarations(input: unknown): null | ts.Declaration[] {
	const symbol = input as ts.Symbol
	if (!symbol) return null
	if (typeof symbol !== "object") return null
	if (!Array.isArray(symbol.declarations) || !symbol.declarations.length) return null

	return symbol.declarations
}

/**
 * Given a signature type, maps out the JSDoc tags.
 *
 * Note that JSDoc tags may appear multiple times in a signature. The key is defined by the tag
 * name. The values are an array of JSDoc tag info.
 */
function createDocTagMap<T extends SignatureLike>(signature: T): DocTagMap {
	const docTags: DocTagMap = new Map()

	for (const tag of signature.getJsDocTags()) {
		const tagName = tag.name
		const tagInfo = tag.text

		if (!docTags.has(tagName)) {
			docTags.set(tagName, [])
		}

		if (Array.isArray(tagInfo) && tagInfo.length) {
			docTags.get(tagName)!.push(...tagInfo)
		}
	}

	return docTags
}

const generatorOptions = {
	ref: true,
	noExtraProps: true,
	aliasRef: true,
	excludePrivate: true,
	skipLibCheck: true,
	required: true,
} as const satisfies Partial<TJS.GeneratorOptions>

const logger = ConsoleLogger.withPrefix("schema")

await runScript(async () => {
	const taskBar = await createCLIProgressBar(
		{ total: ISPNexusPackages.size + 3 },
		{
			stage: "Cleaning generated artifacts...",
		}
	)

	await cleanGeneratedArtifacts("schema")

	taskBar.increment({ stage: "Creating program..." })

	const writtenSchemas = new Map<string, JSONSchemaID>()
	const schemaETags = new Map<string, string>()
	const SchemaCache = new Map<string, TJS.Definition>()
	const SymbolsByPackageName = new Map(
		ISPNexusPackages.map((packageName) => [packageName, []] as [ISPNexusPackage, string[]])
	)

	const SymbolNameSignatureMap = new Map<string, SignatureLike>()

	const program = await programFromConfig(repoRootPathBuilder("tsconfig.schema.json").toString())
	taskBar.increment({ stage: "Building generator..." })

	taskBar.update({ stage: "Building generator..." })
	const generator = TJS.buildGenerator(program, generatorOptions)!
	taskBar.increment()

	const userSymbols = new Map(Array.from(generator.userSymbols).sort((a, b) => a[0].localeCompare(b[0])))

	taskBar.update({ stage: `Reading ${userSymbols.size} symbols...` })
	const processBar = await createCLIProgressBar({ total: userSymbols.size, displayName: "Symbols Processing" })

	const processDeclaration = (symbolName: string, symbol: ts.Symbol | ts.Type | ts.Signature) => {
		const declarations = pluckDeclarations(symbol)

		if (!declarations) return

		let node: ts.Node = declarations[0]!
		while (node?.parent) {
			node = node.parent
		}

		const sourceFile = node.getSourceFile()
		const matchingPackageName = ISPNexusPackages.find((packageName) => {
			return sourceFile.fileName.startsWith(ISPNexusPackagePath[packageName])
		})

		if (!matchingPackageName) return

		if (!isSignatureLike(symbol)) {
			logger.info(`Non-signature symbol: ${symbolName}`)
			return
		}

		const docTags = createDocTagMap(symbol)

		const internalTag = docTags.has("internal")
		const publicTag = docTags.has("public")

		if (internalTag) {
			logger.debug(`[${matchingPackageName}] Internal symbol: ${symbolName}`)
			return
		}

		if (publicTag) {
			logger.debug(`[${matchingPackageName}] Public symbol: ${symbolName}`)
		} else {
			logger.debug(`[${matchingPackageName}] Private symbol: ${symbolName}`)
			return
		}

		symbol.docTagMap = docTags
		SymbolNameSignatureMap.set(symbolName, symbol)
		SymbolsByPackageName.get(matchingPackageName)!.push(symbolName)
	}

	const performGeneration = async (packageName: ISPNexusPackage, symbolName: string) => {
		generationBar.update({ symbolName })
		const symbol = SymbolNameSignatureMap.get(symbolName)

		if (!symbol) {
			logger.info(Array.from(SymbolNameSignatureMap.keys()), "Known symbols")
			throw ResourceError.from(404, `Symbol not found: ${symbolName}`)
		}

		const requiresTags = symbol.docTagMap.get("requires") || []

		for (const requireTag of requiresTags) {
			if (requireTag.kind !== "linkText") continue
			const requiredSymbolName = requireTag.text.trim()

			await performGeneration(packageName, requiredSymbolName)
		}

		if (writtenSchemas.has(symbolName)) return

		const { definitions, $schema, title, description, ...props } = generator.getSchemaForSymbol(symbolName, true, false)

		const schemaID = JSONSchemaID(symbolName)
		const schemaURL = new URL(schemaID.pathname + ".json", ISPNexusSchemaURL)
		const $id = schemaURL.href

		taskBar.update({ stage: `Generating ${schemaID.name} schema` })

		const timestamp = new Date().toISOString().replace(/:/gu, "-")

		const schema = {
			$schema,
			$id,
			title,
			description,
			$comment: `Generated (${timestamp}) Do not edit this file directly.`,
			definitions,
			...props,
		} as const satisfies JSONSchema7

		const schemaRef = {
			$ref: $id,
		} as const satisfies JSONSchema7

		SchemaCache.set(symbolName, schemaRef)

		if (symbol.docTagMap.has("public")) {
			generator.setSchemaOverride(symbolName, schemaRef)
		}

		for (const def of Object.keys(definitions || {})) {
			const schemaDefinitionRef = {
				$ref: $id + "#/definitions/" + def,
			} as const satisfies JSONSchema7

			SchemaCache.set(def, schemaDefinitionRef)
			// const defSymbol = SymbolNameSignatureMap.get(def)

			// if (defSymbol && defSymbol.docTagMap.has("public")) {
			generator.setSchemaOverride(def, schemaDefinitionRef)
			// }
		}

		writtenSchemas.set(symbolName, schemaID)
		// resolver.addSchema(schema, $id)

		const serializedJSON = JSON.stringify(
			{
				...schema,
				properties: {
					$schema: {
						type: "string",
					},
					...schema.properties,
				},
			} satisfies JSONSchema7,
			null,
			"\t"
		)
		const jsonETag = createETag(serializedJSON)
		const serializedYAML = YAML.stringify(schema)
		const yamlETag = createETag(serializedYAML)

		const declarationFile = [
			`/* eslint-disable */`,
			`// prettier-ignore`,
			"",
			`/**`,
			` *
 *   ${schemaID.name}`,
			" * @generated",
			` */`,
			`export = ${serializedJSON} as const`,
		].join("\n")

		schemaETags.set(schemaID.name, jsonETag)
		schemaETags.set(schemaID.name + ".json", jsonETag)
		schemaETags.set(schemaID.name + ".yaml", yamlETag)

		await Promise.all([
			writeLocalTextFile(
				// ---
				serializedJSON,
				packagePathBuilder("schema", "generated", basename(schemaID.pathname))
			),
			writeLocalTextFile(
				// ---
				serializedJSON,
				packagePathBuilder("schema", "generated", basename(schemaID.pathname + ".json"))
			),
			writeLocalTextFile(
				// ---
				declarationFile,
				packagePathBuilder("schema", "generated", basename(schemaID.pathname + ".json.d.ts"))
			),
			writeLocalTextFile(
				// ---
				serializedYAML,
				packagePathBuilder("schema", "generated", basename(schemaID.pathname + ".yaml"))
			),
		])

		generationBar.increment()
	}

	for (const [symbolName, symbol] of userSymbols) {
		processDeclaration(symbolName, symbol)
		processBar.increment()
	}

	const generationBar = await createCLIProgressBar(
		{ total: SymbolNameSignatureMap.size, displayName: "Schema Generation" },
		{ symbolName: "Preparing..." }
	)

	for (const packageName of ISPNexusPackages) {
		const symbolNames = SymbolsByPackageName.get(packageName)!

		for (const symbolName of symbolNames) {
			if (SchemaCache.has(symbolName)) continue

			await performGeneration(packageName, symbolName)
		}

		taskBar.increment()
	}

	taskBar.dispose()

	const sortedSchemas = Array.from(writtenSchemas.values()).sort((a, b) => a.name.localeCompare(b.name))
	const index: Record<string, string> = {}
	const cfPagesHeaderLines: string[] = [
		"# Cloudflare Pages Header Configuration",
		"# This file is generated by the schema generation script.",
		"",
		"/*",
		"\tAccess-Control-Allow-Origin: *",
		`\tCache-Control: public, max-age=31536000, immutable`,
		"",
	]

	for (const schemaID of sortedSchemas) {
		logger.info(schemaID.name)

		index[schemaID.name] = schemaID.pathname
		const jsonETag = schemaETags.get(schemaID.name)!
		const yamlETag = schemaETags.get(schemaID.name + ".yaml")!

		cfPagesHeaderLines.push(
			`${schemaID.pathname}`,
			`\tContent-Type: application/json`,
			`\tETag: ${jsonETag}`,
			"",
			`${schemaID.pathname}.json`,
			`\tContent-Type: application/json`,
			`\tETag: ${jsonETag}`,
			"",
			`${schemaID.pathname}.yaml`,
			`\tContent-Type: application/yaml`,
			`\tETag: ${yamlETag}`
		)
	}

	await Promise.all([
		writeLocalJSONFile(index, "schema", "generated", "index.json"),
		writeLocalTextFile(cfPagesHeaderLines.join("\n"), "schema", "generated", "_headers"),
	])
})
