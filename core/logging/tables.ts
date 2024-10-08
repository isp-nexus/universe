/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import * as Colorette from "colorette"
import jsonColorizer from "json-colorizer"
import { table, TableUserConfig } from "table"

/**
 * Options for formatting a JSON object as a table.
 *
 * @category Logging
 */
export interface TableFormatOptions extends TableUserConfig {
	alphabetize?: boolean
}

export type TableDataEntry = [string | number, ...any]

/**
 * Convert a JSON object to a loggable table.
 *
 * @category Logging
 */
export function printJSONAsTable(json: object, options?: TableFormatOptions) {
	const entries = Object.entries(json)

	return printEntriesAsTable(entries, options)
}

/**
 * Convert a map of key-value pairs to a loggable table.
 *
 * @category Logging
 */
export function printEntriesAsTable(
	dataRow: Iterable<TableDataEntry>,
	{ alphabetize, ...options }: TableFormatOptions = {}
) {
	let formattedRows: any[][] = []

	for (const cells of dataRow) {
		if (cells.length === 0) continue

		const formattedRow: any[] = []

		if (cells.length === 1) {
			formattedRow.push(Colorette.bold(Colorette.bgRed(cells[0])))
			formattedRows.push(formattedRow)
			continue
		}

		if (cells.length === 2 && (typeof cells[1] === "undefined" || cells[1] === null)) {
			continue
		}

		formattedRow.push(Colorette.magenta(cells[0]))

		for (const cell of cells.slice(1)) {
			if (typeof cell === "undefined" || cell === null) continue

			if (Array.isArray(cell)) {
				formattedRow.push(Colorette.yellow(cell.join(", ")))
			} else if (typeof cell === "object") {
				formattedRow.push(jsonColorizer.colorize(cell))
			} else {
				formattedRow.push(Colorette.yellow(cell))
			}
		}

		formattedRows.push(formattedRow)
	}

	// Table must have a consistent number of cells...
	const maxCells = Math.max(...formattedRows.map((row) => row.length))
	formattedRows = formattedRows.map((row) => {
		if (row.length < maxCells) {
			return [...row, ...new Array(maxCells - row.length).fill("")]
		}

		return row
	})

	if (alphabetize) {
		formattedRows = formattedRows.sort(([a], [b]) => a.localeCompare(b))
	}

	return "\n" + table(formattedRows, options)
}
