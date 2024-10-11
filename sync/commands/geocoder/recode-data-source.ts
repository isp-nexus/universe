/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Recode Data Source
 */

import { pick } from "@isp.nexus/core"
import { ConsoleLogger, printJSONAsTable } from "@isp.nexus/core/logging"
import { castToPostalAddressFeature, PostalAddressPart } from "@isp.nexus/mailwoman"
import { $GoogleGeocoder } from "@isp.nexus/mailwoman/sdk"
import { CommandHandler, NexusDataSource, StrictArgKeys } from "@isp.nexus/sdk"
import { resolve } from "path"
import { PathBuilder } from "path-ts"
import { CommandBuilder } from "yargs"

//---
export const command = "recode-data-source <database-path> <schema-name> <table-name>"
export const describe = "Geocode an SQLite database which contains faulty data."

interface CommandArgs {
	"database-path": PathBuilder
	"schema-name": string
	"table-name": string
	"formatted-address-column-name"?: string
	"latitude-column-name"?: string
	"longitude-column-name"?: string
	"row-index-column-name"?: string
	"batch-size": number
}

export const builder: CommandBuilder<CommandArgs, CommandArgs> = {
	"database-path": {
		describe: "Path to SQLite database.",
		type: "string",
		alias: ["db", "database"],
		coerce: (value: string) => {
			return PathBuilder.from(resolve(value))
		},
	},
	"schema-name": {
		describe: "Name of the schema to attach. This will effect any views.",
		type: "string",
		alias: ["schema", "attach-as"],
	},
	"table-name": {
		describe: "Name of the table to geocode.",
		type: "string",
		alias: ["t"],
	},
	"formatted-address-column-name": {
		describe: "Name of the column containing the formatted address.",
		type: "string",
		alias: ["address"],
	},
	"latitude-column-name": {
		describe: "Name of the column containing the latitude.",
		type: "string",
		alias: ["lat", "latitude", "y"],
	},
	"longitude-column-name": {
		describe: "Name of the column containing the longitude.",
		type: "string",
		alias: ["lon", "longitude", "x"],
	},

	"row-index-column-name": {
		describe: "Name of the column containing the referencing row index.",
		type: "string",
		default: "idx",
		alias: ["row-index", "row-id"],
	},

	"batch-size": {
		describe: "Number of records to geocode at a time.",
		default: 50,
		type: "number",
		alias: ["batch", "b"],
	},
}

type CommandArgKeys = StrictArgKeys<CommandArgs>

export const handler: CommandHandler<CommandArgs> = async (args) => {
	const geocoder = await $GoogleGeocoder

	const {
		// ---
		databasePath,
		schemaName,
		tableName,
		batchSize,
		formattedAddressColumnName,
		latitudeColumnName,
		longitudeColumnName,
	} = args

	ConsoleLogger.info(
		printJSONAsTable({
			databasePath,
			schemaName,
			tableName,
			formattedAddressColumnName,
			latitudeColumnName,
			longitudeColumnName,
			batchSize,
		})
	)

	const columns = pick(args, [
		// ---
		"formattedAddressColumnName",
		"latitudeColumnName",
		"longitudeColumnName",
		"rowIndexColumnName",
	] as const satisfies CommandArgKeys[])

	type Column = typeof columns
	type ColumnAlias = keyof Column
	type GeoRow = Record<ColumnAlias, string | number | null>

	const selections = Object.entries(columns)
		.filter(([_, column]) => column)
		.map(([alias, column]) => `${column} as '${alias}'`)
		.join(", ")

	const dataSource = await new NexusDataSource({
		displayName: "Recode Data Source",
		storagePath: ":memory:",
	}).ready()

	await dataSource.attach(databasePath, schemaName)
	const scopedTableName = `'${schemaName}'.'${tableName}'`

	async function* takeGeoRow(): AsyncGenerator<GeoRow[]> {
		let cursor = 0
		let currentRows: any[] = []

		do {
			currentRows = await dataSource.query(/* sql */ `
			SELECT ${selections} FROM ${scopedTableName} LIMIT ${batchSize} OFFSET ${cursor};
		`)

			yield currentRows

			cursor += batchSize
		} while (currentRows.length)
	}

	for await (const records of takeGeoRow()) {
		ConsoleLogger.info(`Geocoding ${records.length} records...`)

		const geocodedRecords = await Promise.all(
			records.map(async (record) => {
				const idx = record.rowIndexColumnName as number

				const criteria = record.formattedAddressColumnName
					? record.formattedAddressColumnName
					: latitudeColumnName && longitudeColumnName
						? [record.latitudeColumnName, record.longitudeColumnName]
						: null

				if (!criteria) {
					ConsoleLogger.warn(`No criteria found for record ${idx}.`)
					return null
				}

				const postalAddress = await geocoder
					.geocode(criteria)
					.then((results) => results[0] || null)
					.catch(() => null)

				if (!postalAddress) {
					ConsoleLogger.warn(`No matches found for record ${idx}.`)
					return null
				}

				const placeID = postalAddress[PostalAddressPart.GooglePlaceID]
				const placeDetails = placeID ? await geocoder.placeDetails(placeID) : null

				return {
					idx,
					postalAddress,
					placeDetails,
				}
			})
		)

		for (const result of geocodedRecords) {
			if (!result) continue
			const { idx, postalAddress, placeDetails } = result

			const feature = castToPostalAddressFeature(postalAddress)

			feature.id = idx
			Object.assign(feature.properties, placeDetails)

			// ConsoleLogger.info(printGeoFeatureAsTable(feature), "GeoJSON")
		}
	}

	await dataSource.dispose()
}
