/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ConsoleLogger } from "@isp.nexus/core/logging"
import { createCLIProgressBar } from "@isp.nexus/sdk"
import * as path from "node:path"
import ts from "typescript"

/**
 * Create a TypeScript program from a tsconfig file.
 *
 * @internal
 */
export async function programFromConfig(configFileName: string): Promise<ts.Program> {
	const progressBar = await createCLIProgressBar(
		{
			displayName: "TypeScript",
			total: 3,
		},
		{
			stage: "Creating program",
		}
	)

	const result = ts.parseConfigFileTextToJson(configFileName, ts.sys.readFile(configFileName)!)

	if (result.error) {
		await progressBar.dispose()

		ConsoleLogger.error(`Error parsing config file: ${configFileName}`)
		ConsoleLogger.error(result.error.messageText)
		process.exit(1)
	}

	progressBar.increment({ stage: "Parsing config file" })

	const parsedConfig = ts.parseJsonConfigFileContent(
		result.config,
		ts.sys,
		path.dirname(configFileName),
		{},
		path.basename(configFileName)
	)

	const { out, outDir, outFile, declaration, declarationDir, declarationMap, ...compilerOptions } = parsedConfig.options

	compilerOptions.noEmit = true

	progressBar.increment({ stage: "Creating TS program" })

	const program = ts.createProgram({
		rootNames: parsedConfig.fileNames,
		options: compilerOptions,
		projectReferences: parsedConfig.projectReferences,
	})

	await progressBar.dispose()

	return program
}

/**
 * Predicate to determine if a file is a user file, i.e. not a default library file.
 *
 * @internal
 */
export function isUserFile(file: ts.SourceFile): boolean {
	return !file.hasNoDefaultLib
}
