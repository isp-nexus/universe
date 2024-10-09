/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Convert a ShapeFile to GeoJSON.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { changeFileExtension, cleanDirectory, cleanFile, CommandHandler, takeReadStreamLines } from "@isp.nexus/sdk"
import {
	collectPendingMigrationFiles,
	prepareMigrationsTable,
	runMigration,
	spatialiteInitTemplate,
	writeMigrationFile,
} from "@isp.nexus/sdk/data"
import {
	csvImportCommand,
	inferSQLiteFieldTypes,
	pluckCSVColumnHeader,
	splitByFieldSeparator,
	tableSchemaFromInferences,
} from "@isp.nexus/sdk/data/csv"
import { inferSQLPaths, SQLiteFileExtension } from "@isp.nexus/sdk/reflection"
import { CommandBuilder } from "yargs"

export const command = "infer-csv-schema [source-file-path]"
export const describe = "Infer the SQL schema of a CSV file."

interface CommandArgs {
	"source-file-path": string
	"field-separator": string
	spatialite?: boolean
}

export const builder: CommandBuilder<CommandArgs, CommandArgs> = {
	"source-file-path": {
		describe: "The path to the CSV file or directory containing a `source.csv` file",
		type: "string",
		demandOption: true,
		alias: "i",
	},

	"field-separator": {
		describe: "The character used to separate fields, e.g. ',', '\\t' ';'",
		type: "string",
		default: ",",
		alias: "d",
	},

	spatialite: {
		describe: "Use SpatiaLite extensions.",
		type: "boolean",
		default: false,
		alias: "s",
	},
}

let migrationCount = 0

function incrementalTimestamp() {
	migrationCount++
	return migrationCount.toString().padStart(13, "0")
}

export const handler: CommandHandler<CommandArgs> = async (args) => {
	if (args.fieldSeparator.length !== 1) {
		throw ResourceError.from(400, "Field separator must be a single character.")
	}

	const fieldSeparatorCharacterCode = args.fieldSeparator.charCodeAt(0)

	const { sourceFilePath, migrationsDirectoryPath, dataSourcePath, tableName } = inferSQLPaths(args.sourceFilePath)

	ConsoleLogger.info(`Infering schema for ${sourceFilePath}...`)

	ConsoleLogger.info("Cleaning migrations directory...")

	await Promise.all([
		cleanDirectory(migrationsDirectoryPath),
		cleanFile(dataSourcePath),
		cleanFile(changeFileExtension(dataSourcePath, SQLiteFileExtension.Journal)),
		cleanFile(changeFileExtension(dataSourcePath, SQLiteFileExtension.WAL)),
	])

	await prepareMigrationsTable(dataSourcePath)

	if (args.spatialite) {
		ConsoleLogger.info("Using SpatiaLite extensions.")

		await writeMigrationFile({
			timestamp: incrementalTimestamp(),
			id: "init-spatialite",
			sql: spatialiteInitTemplate(),
			migrationsDirectoryPath,
		})
	}

	const lines: Buffer[] = []

	for await (const line of takeReadStreamLines(sourceFilePath, { lineLimit: 10 })) {
		lines.push(line)
	}

	if (lines.length < 2) {
		throw ResourceError.from(400, "CSV file must have at least two lines.")
	}

	const [headerLine, ...sampleLines] = lines
	const columnNames = pluckCSVColumnHeader(headerLine!, fieldSeparatorCharacterCode)
	const sampleFieldsByLine = sampleLines.map((line) => splitByFieldSeparator(line, fieldSeparatorCharacterCode))

	const columnInferences = inferSQLiteFieldTypes(columnNames, sampleFieldsByLine)

	await writeMigrationFile({
		id: `create_${tableName}`,
		timestamp: incrementalTimestamp(),
		sql: tableSchemaFromInferences(tableName, columnInferences),
		migrationsDirectoryPath,
	})

	await writeMigrationFile({
		id: `import_${tableName}`,
		timestamp: incrementalTimestamp(),
		migrationsDirectoryPath,
		sql: csvImportCommand({
			csvFilePath: sourceFilePath,
			columnInferences,
			tableName,
			fieldSeparator: args.fieldSeparator,
		}),
	})

	const migrationFiles = await collectPendingMigrationFiles({
		dataSourcePath,
		migrationsDirectoryPath,
	})

	for (const migrationFile of migrationFiles) {
		await runMigration(dataSourcePath, migrationFile)
	}
}
