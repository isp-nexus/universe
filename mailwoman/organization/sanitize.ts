/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { Tagged } from "type-fest"

const doingBusinessAsPattern = /\s(d\/b\/a|dba|doing business as)\s/i
/**
 * @internal
 */
export function formatOrganizationName(input: string | null | undefined) {
	if (!input) return null

	return input
		.replace(/[^\d|\w|\s]/g, "")
		.replace(/\sinc$/i, " Inc.")
		.replace(/\scorp$/i, " Corp.")
		.replace(/\sco$/i, " Co.")
		.replace(/\sllc$/i, " LLC")
		.replace(/\sltd$/i, " Ltd.")
		.replace(/\slp$/i, " LP")
		.replace(/\splc$/i, " PLC")
		.replace(/\sag$/i, " AG")
		.replace(/\ssa$/i, " SA")
		.replace(/\ssarl$/i, " Sarl")
		.replace(/\sgmbh$/i, " GmbH")
		.replace(/\sbv$/i, " BV")
		.replace(/\snv$/i, " NV")
		.replace(/\spt$/i, " PT")
		.replace(/\spty$/i, " Pty")
		.replace(/\sas$/i, " AS")
		.replace(/\sasa$/i, " ASA")
		.replace(/\sbhd$/i, " BHD")
		.replace(/\scc$/i, " CC")
		.replace(/\scv$/i, " CV")
		.replace(/\skg$/i, " KG")
		.replace(/\soy$/i, " OY")
		.replace(/\soyj$/i, " OYJ")
		.replace(/\sspa$/i, " SPA")
		.replace(/\sscs$/i, " SCS")
		.replace(doingBusinessAsPattern, " DBA ")
}

/**
 * A formatted organization name, ready for tokenization and lookup.
 *
 * @category Organization
 * @type string
 * @title Sanitized Organization Name
 */
export type SanitizedOrganizationName = Tagged<string, "SanitizedOrganizationName">

const designations = [
	"AB",
	"AS",
	"ASA",
	"BHD",
	"BVBA",
	"CC",
	"CV",
	"KG",
	"NV",
	"OY",
	"OYJ",
	"PT",
	"PTY",
	"SCA",
	"SCS",
	"SDN BHD",
	"SDN",
	"SL",
	"SPA",
	"SPRL",
	"AG",
	"BV",
	"CO",
	"CORP",
	"GMBH",
	"INC",
	"LLC",
	"LP",
	"LTD",
	"PLC",
	"SA",
	"SARL",
]

/**
 * A regular expression pattern that matches common designations found in organization names, with
 * at least a space before the designation.
 */
const designationPattern = new RegExp(`\\s(${designations.join("|")})$`, "g")

/**
 * Given a organization name, attempt to normalize the contents for easier tokenization.
 *
 * @category Organization
 */
export function sanitizeOrganizationName(input: string): SanitizedOrganizationName {
	const sanitized = input
		// Convert the name to uppercase, for easier parsing.
		.toUpperCase()
		// Remove non-alphanumeric characters.
		.replace(/[^A-Z0-9\s]/g, "")
		// Remove designations, such as company, corporation, etc.
		.replaceAll(designationPattern, "")
		// Reduce multiple spaces.
		.replaceAll(/\s{2,}/g, " ")
		// Break off the DBA portion of the name.
		.split(doingBusinessAsPattern)[0]!
		// Trim excess whitespace.
		.trim()

	if (!sanitized) {
		throw ResourceError.from(
			400,
			`Could not sanitize organization name: ${input}`,
			"organization",
			"sanitize",
			"invalid-org-name"
		)
	}

	return sanitized as SanitizedOrganizationName
}
