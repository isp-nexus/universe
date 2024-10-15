/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   ISP Nexus SDK reflection REPL
 *
 *   This script is used to inject Nexus modules into Node.js's interactive REPL environment, allowing
 *   developers to interact with the SDK's modules without having to import them manually.
 */

import type { ISPNexusPackage } from "@isp.nexus/sdk/monorepo"

interface PackageJSONLike {
	name: string
	version: string
	license: string

	exports?: Record<string, string>

	dependencies?: Record<string, string>
	devDependencies?: Record<string, string>
	peerDependencies?: Record<string, string>
}

type NexusREPL = {
	[P in ISPNexusPackage]: Record<string, unknown>
}

console.log(">>> [sdk/runtime/repl.entrypoint.ts]")
if (!process.env["REPL_ID"]) {
	process.env["REPL_ID"] = crypto.randomUUID()

	console.log("\n🚀 Starting ISP Nexus REPL environment...\n")

	const { pivot } = await import("@isp.nexus/core")
	const { readLocalJSONFile } = await import("@isp.nexus/sdk/files")
	const { ISPNexusPackages } = await import("@isp.nexus/sdk/monorepo")

	const packageJSONRecord = await pivot(ISPNexusPackages, (packageName) => {
		return readLocalJSONFile<PackageJSONLike>(packageName, "package.json")
	})

	const nexus: NexusREPL = {} as NexusREPL
	const loadedModuleNames: ISPNexusPackage[] = []

	for (const unprefixedPackageName of ISPNexusPackages) {
		const packageJSON = packageJSONRecord[unprefixedPackageName]
		if (!packageJSON.exports) continue

		let exportName: string

		if (Object.hasOwn(packageJSON.exports, "./repl") && unprefixedPackageName !== "sdk") {
			exportName = `${packageJSON.name}/repl`
		} else if (Object.hasOwn(packageJSON.exports, ".")) {
			exportName = packageJSON.name
		} else {
			continue
		}

		console.log(`📦 Loading ${exportName}...`)
		const mod = await import(exportName).catch((error) => {
			console.error(`Failed to load ${exportName}: ${error}`)
			return null
		})

		if (!mod || typeof mod !== "object") {
			console.warn(`${exportName} appears to be empty or not an object.`)
		}

		nexus[unprefixedPackageName] = mod
	}

	Object.assign(nexus, {
		[Symbol.for("nodejs.util.inspect.custom")]: () => {
			return Object.fromEntries(loadedModuleNames.map((name) => [name, Object.keys(nexus[name])]))
		},
	})

	Object.assign(globalThis, { nexus })

	console.log("\n✨ ISP Nexus loaded into REPL environment.")
	console.log("\n✨ Type `nexus` to see available modules.\n")
}
