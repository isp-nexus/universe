/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { Tagged } from "type-fest"
import { DirectionalToAbbreviationMap } from "./directional.js"
import { StreetSuffixAbbreviationRecord } from "./suffix.js"

/**
 * A formatted postal address, ready for tokenization and lookup.
 *
 * @category Postal
 * @type string
 * @title Sanitized Postal Address
 */
export type SanitizedPostalAddress = Tagged<string, "SanitizedPostalAddress">

/**
 * Given a human-provided formatted address, attempt to normalize the contents for easier
 * tokenization.
 *
 * @category Postal
 */
export function sanitizePostalAddress(input: unknown): SanitizedPostalAddress {
	if (!input || typeof input !== "string") {
		throw ResourceError.from(400, `Could not sanitize address: ${input}`, "postal", "formatting", "invalid-address")
	}

	let sanitizedAddress = input
		// Convert the address to uppercase, for easier parsing.
		.toUpperCase()
		// Remove the country, if it's the USA, as it's redundant.
		.replace(/,?\sUSA/, "")
		// Remove any PO Box numbers, as they're not useful for geocoding.
		.replace(/PO BOX (\d+)/g, "")
		// Replace forward slashes with backslashes.
		.replaceAll("\\", "/")
		// Reduce multiple slashes.
		.replaceAll("//", "/")
		// Reduce multiple spaces.
		.replaceAll(/\s{2,}/g, " ")
		// Remove any non-alphanumeric characters
		.replace(/[^\w/]+/g, " ")
		// Trim excess whitespace.
		.trim()

	for (const [streetSuffix, suffixes] of Object.entries(StreetSuffixAbbreviationRecord)) {
		const preferredSuffixAbbreviation = suffixes[0]
		const variations = [streetSuffix, ...suffixes.slice(1)]

		for (const variant of variations) {
			const pattern = new RegExp(`\\b${variant}\\b`)
			// Note that we only want to replace the first occurrence of the street suffix.
			if (pattern.test(sanitizedAddress)) {
				sanitizedAddress = sanitizedAddress.replace(pattern, preferredSuffixAbbreviation)
				break
			}
		}
	}

	for (const [directional, preferredDirectionalAbbreviation] of DirectionalToAbbreviationMap) {
		sanitizedAddress = sanitizedAddress.replace(
			new RegExp(`\\b${directional}\\b`, "g"),
			preferredDirectionalAbbreviation
		)
	}

	if (!sanitizedAddress) {
		throw ResourceError.from(400, `Could not sanitize address: ${input}`, "postal", "formatting", "invalid-address")
	}

	return sanitizedAddress as SanitizedPostalAddress
}
