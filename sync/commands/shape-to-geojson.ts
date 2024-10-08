/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Convert a ShapeFile to GeoJSON.
 */

import { ConsoleLogger } from "@isp.nexus/core/logging"
import { CommandHandler } from "@isp.nexus/sdk"
import * as path from "node:path"
import { CommandBuilder } from "yargs"
import { $ } from "zx"

export const command = "geojson-seq <shape-file-path> [output-file-path]"
export const describe = "Convert a ShapeFile to GeoJSON."

interface CommandArgs {
	"shape-file-path": string
	"output-file-path"?: string
	sql?: string
}

export const builder: CommandBuilder<CommandArgs, CommandArgs> = {
	"shape-file-path": {
		describe: "The path to the ShapeFile.",
		type: "string",
		demandOption: true,
		alias: "i",
	},
	"output-file-path": {
		describe: "The path to the output GeoJSON file.",
		type: "string",
		alias: "o",
	},
	sql: {
		describe: "The SQL query to run on the ShapeFile.",
		type: "string",
	},
}

export const handler: CommandHandler<CommandArgs> = async (args) => {
	const { shapeFilePath, sql } = args
	const parsedPath = path.parse(shapeFilePath)
	const workingDirectory = parsedPath.dir
	const outputFilePath = args.outputFilePath || "/vsistdout/"

	$.cwd = workingDirectory

	if (args.outputFilePath) {
		ConsoleLogger.info(`Converting ${shapeFilePath} to New-line delimited GeoJSON...`)
	}

	const child = $`ogr2ogr \\
		-f GeoJSONSeq \\
		${outputFilePath} \\
		-t_srs EPSG:4326 \\
		-nlt MULTIPOLYGON \\
		${parsedPath.base}  \\
		-lco ID_FIELD=GEOID \\
		${sql ? ["-sql", sql] : []}`

	child.stdout.on("data", (data) => process.stdout.write(data.toString()))
	child.stderr.on("data", (data) => process.stderr.write(data.toString()))

	await child

	if (args.outputFilePath) {
		ConsoleLogger.info(`Wrote GeoJSON to ${path.join(workingDirectory, outputFilePath)}`)
	}
}
