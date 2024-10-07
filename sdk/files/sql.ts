/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { indent } from "@isp.nexus/core/templates"
import { format as formatSQL } from "sql-formatter"

const SQLITE_DOT_COMMAND_PATTERN = "(\\.[a-zA-Z0-9+]\\s?)"
const SQLITE_DOT_COMMAND_PATTERN_COMMENT = `-- ${SQLITE_DOT_COMMAND_PATTERN}`

/**
 * Format SQL for SQLite.
 */
export function formatSQLite(input: string): string {
	// Note that our formatter doesn't handle SQLite "dot commands" well.
	const normalizedInput = indent(input, 0)
		// So we comment them out...
		.replace(new RegExp("^" + SQLITE_DOT_COMMAND_PATTERN, "gm"), "-- $1")

	const formattedOutput = formatSQL(normalizedInput, {
		language: "sqlite",
		useTabs: true,
		dataTypeCase: "upper",
		newlineBeforeSemicolon: true,
	})

	// ...and uncomment them.
	return formattedOutput.replace(new RegExp(SQLITE_DOT_COMMAND_PATTERN_COMMENT, "gm"), "$1")
}
