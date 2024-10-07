/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { smartSnakeCase } from "@isp.nexus/core"
import * as path from "node:path"
import { LineDelimitedCharacter } from "../files/newline-delimited.js"

/**
 * Function signature for parsing a CSV line.
 *
 * @internal
 */
export type CSVLineParserFn = (delimitedLine: Buffer | string, fieldSeparatorCharacterCode?: number) => string[]

/**
 * Given a raw CSV field, normalize it for comparison.
 */
export function normalizeRawCSVField(rawCSVField: string): string | null {
	const normalizedField = rawCSVField
		.replace(/null/i, "") // Remove literal nulls
		.replace(/n\/a/i, "") // Remove literal N/A
		.replace(/\s+/g, " ") // Normalize duplicate whitespace
		.replace(/^-$/, "") // Remove single hyphens
		.trim() // Trim whitespace

	return normalizedField || null
}

/**
 * Given a delimited line, split it into fields using the specified separator.
 *
 * Unlike `String.prototype.split`, this function correctly handles fields that contain the
 * separator character within double quotes.
 */
export const splitByFieldSeparator: CSVLineParserFn = (
	delimitedLine,
	separatorCharacter = LineDelimitedCharacter.Comma
) => {
	if (typeof delimitedLine === "string") {
		delimitedLine = Buffer.from(delimitedLine)
	}

	const contentDelimiters: number[] = []
	let doubleQuoteCount = 0

	// First, we traverse the line to find the field delimiters...
	for (let byteIndex = 0; byteIndex < delimitedLine.byteLength; byteIndex++) {
		const byte = delimitedLine[byteIndex]

		if (byte === LineDelimitedCharacter.DoubleQuote) {
			doubleQuoteCount++
		}

		if (byte === separatorCharacter && doubleQuoteCount % 2 === 0) {
			contentDelimiters.push(byteIndex)
		}
	}

	// Now, we slice the line into fields.
	const slices: Buffer[] = []
	let sliceStart = 0

	for (let delimiterIndex = 0; delimiterIndex < contentDelimiters.length; delimiterIndex++) {
		const sliceEnd = contentDelimiters[delimiterIndex]!

		slices.push(delimitedLine.subarray(sliceStart, sliceEnd))
		sliceStart = sliceEnd + 1
	}

	// Finally, our last slice is the remainder of the line.
	slices.push(delimitedLine.subarray(sliceStart))

	return slices.map((slice) => slice.toString())
}

/**
 * Given a CSV header line, return an array of field names.
 */
export const pluckCSVColumnHeader: CSVLineParserFn = (
	csvHeaderLineContent,
	fieldSeparatorCharacterCode = LineDelimitedCharacter.Comma
) => {
	if (typeof csvHeaderLineContent === "string") {
		csvHeaderLineContent = Buffer.from(csvHeaderLineContent)
	}

	const headerFields = splitByFieldSeparator(csvHeaderLineContent, fieldSeparatorCharacterCode).map(smartSnakeCase)

	const headerFieldCountMap = new Map<string, number>()
	const uniqueHeaderFields = new Set<string>()

	for (const field of headerFields) {
		if (uniqueHeaderFields.has(field)) {
			const headerCount = (headerFieldCountMap.get(field) ?? 1) + 1
			headerFieldCountMap.set(field, headerCount)

			const uniquecolumnName = `${field}_${headerCount}`
			uniqueHeaderFields.add(uniquecolumnName)
		} else {
			uniqueHeaderFields.add(field)
		}
	}

	return Array.from(uniqueHeaderFields)
}

export type SQLiteColumnTypeViaCSV = "TEXT" | "INTEGER" | "REAL"
export type SQLiteColumnFormatViaCSV = "date" | "time" | "datetime" | "email" | "phone" | "url"
export interface SQLiteColumnInference {
	columnName: string
	type: SQLiteColumnTypeViaCSV
	nullable?: boolean
	caseSensitive?: boolean
	format?: SQLiteColumnFormatViaCSV | null
}

/**
 * Given several samples of CSV field content, infer the SQLite field type.
 *
 * @internal
 * @see {@linkcode inferSQLiteFieldTypes} for inferring the types of multiple columns.
 */
export function inferSQLiteFieldType(
	/**
	 * The name of the column being inferred.
	 */
	columnName: string,
	/**
	 * An array of field content samples, which will be used to infer the type of the field.
	 */
	fieldContentSamples: string[]
): SQLiteColumnInference {
	const normalizedSamples = fieldContentSamples.map(normalizeRawCSVField)

	let nullCount = 0
	let caseSensitivityCount = 0
	let format: SQLiteColumnFormatViaCSV | null = null

	if (/phone|fax/.test(columnName)) {
		format = "phone"
	} else if (/email/.test(columnName)) {
		format = "email"
	}
	if (/url/.test(columnName)) {
		format = "url"
	} else if (/date/.test(columnName)) {
		format = "date"
	}

	const inferenceCounts = {
		TEXT: 0,
		INTEGER: 0,
		REAL: 0,
	} satisfies Record<SQLiteColumnTypeViaCSV, number>

	normalizedSamples.forEach((sample) => {
		if (sample === null) {
			nullCount++
			return
		}

		if (format) {
			inferenceCounts.TEXT++
			return
		}

		if (/^-?\d+$/.test(sample)) {
			inferenceCounts.INTEGER++
			return
		}

		if (/^-?\d+\.\d+$/.test(sample)) {
			inferenceCounts.REAL++
			return
		}

		inferenceCounts.TEXT++
		caseSensitivityCount += sample !== sample.toLowerCase() ? 1 : 0
	})

	// Now, we use a means-based approach to determine the type.
	const totalSamples = normalizedSamples.length

	const nullable = nullCount / totalSamples >= 0.5

	if (inferenceCounts.REAL / totalSamples >= 0.5) {
		return {
			columnName,
			type: "REAL",
			nullable,
		}
	}

	if (inferenceCounts.INTEGER / totalSamples >= 0.5) {
		return {
			columnName,
			type: "INTEGER",
			nullable,
		}
	}

	return {
		columnName,
		type: "TEXT",
		nullable,
		caseSensitive: caseSensitivityCount / totalSamples >= 0.5,
		format,
	}
}

/**
 * Given a set of column names and field content samples, infer the SQLite field types.
 */
export function inferSQLiteFieldTypes(columnNames: string[], fieldContentSamples: string[][]) {
	const inferences = columnNames.map((columnName, i) => {
		return inferSQLiteFieldType(columnName, fieldContentSamples.map((fields) => fields[i]!).flat())
	})

	return inferences
}

/**
 * Creates a SQLite table schema from a set of column inferences.
 */
export function tableSchemaFromInferences(tableName: string, columnInferences: SQLiteColumnInference[]): string {
	const columnDefinitions = columnInferences.map((inference) => {
		const columnDefinition = `'${inference.columnName}' ${inference.type}`

		return columnDefinition
	})

	return /* sql */ `

		CREATE TABLE IF NOT EXISTS '${tableName}' (
			${columnDefinitions.join(", \n\t")}
		);
	`
}

export interface CSVImportCommandOptions {
	/**
	 * The path to the CSV file to import.
	 */
	csvFilePath: string

	/**
	 * Table name to import the CSV data into.
	 */
	tableName: string

	/**
	 * Column inferences for the CSV file.
	 */
	columnInferences: SQLiteColumnInference[]

	/**
	 * Number of lines to skip before importing data.
	 *
	 * @default 1
	 */
	skip?: number

	/**
	 * The character used to separate fields, e.g. ',', '\t' ';'
	 *
	 * @default ","
	 */
	fieldSeparator?: string
}

/**
 * Given a CSV file path, creates commands to import the CSV contents into a SQLite database.
 */
export function csvImportCommand({
	csvFilePath,
	columnInferences,
	tableName,
	skip = 1,
	fieldSeparator = ",",
}: CSVImportCommandOptions): string {
	const normalizedCSVFilePath = "./" + path.basename(csvFilePath)

	let sql = /* sql */ `
		-- Import CSV data into SQLite table.
		.mode csv
		.separator "${fieldSeparator}"

		.import --csv --skip ${skip} "${normalizedCSVFilePath}" ${tableName}

		-- Nullify empty strings.
	`

	for (const columnInference of columnInferences) {
		sql += /* sql */ `
			UPDATE ${tableName}
			SET ${columnInference.columnName} = NULL
			WHERE ${columnInference.columnName} = '';
		`
	}

	return sql
}
