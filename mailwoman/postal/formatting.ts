/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { PostalAddress, PostalAddressPart } from "./PostalAddress.js"

/**
 * The primary address parts to include in a formatted address. Typically, the first line of an
 * address.
 */
export const PrimaryAddressParts = [
	PostalAddressPart.StreetNumber,
	PostalAddressPart.DirectionalAbbreviation,
	PostalAddressPart.StreetName,
	PostalAddressPart.StreetSuffixAbbreviation,
	PostalAddressPart.PostalFloor,
] as const satisfies PostalAddressPart[]

export type PrimaryAddressParts = (typeof PrimaryAddressParts)[number]

/**
 * The secondary address parts to include in a formatted address. Typically, the second line of an
 * address.
 */
export const SecondaryAddressParts = [
	PostalAddressPart.Locality,
	PostalAddressPart.AdminLevel1,
	PostalAddressPart.PostalCode,
] as const satisfies PostalAddressPart[]

export type SecondaryAddressParts = (typeof SecondaryAddressParts)[number]

/**
 * The parts of a postal address that can be formatted into a human-readable string.
 */
export const FormattedAddressParts = [
	[PostalAddressPart.POBox],
	PrimaryAddressParts,
	SecondaryAddressParts,
] as const satisfies PostalAddressPart[][]

/**
 * Given a `PostalAddress`, format the address into a human-readable string, suitable for printing
 * on a shipping label.
 */
export function formatAddressFromParts(
	input: Partial<PostalAddress>,
	formatter: PostalAddressPart[][] = FormattedAddressParts
): string {
	const formattedAddress = formatter
		.map((lineParts) => lineParts.map((part) => input[part]))
		.map((line) => line.filter(Boolean).join(" "))
		.filter(Boolean)
		.join(", ")

	if (!formattedAddress) {
		throw ResourceError.from(400, `Failed to format address from components: ${JSON.stringify(input)}`)
	}

	return formattedAddress
}

/**
 * Formats a list of address lines into a single, comma-delimited string.
 *
 * This function is used to format the address lines for FCC Form 499 filings.
 *
 * @internal
 */
export function sortAddressLines(deliveryAddress: Partial<PostalAddress>, ...addressLines: Array<string | undefined>) {
	const lines = addressLines
		.filter(Boolean)
		.map((line) => line!.toUpperCase())
		.sort((a, b) => {
			if (a.startsWith("PO BOX")) return -1
			if (a.match(/^\d/)) return 1

			return a.localeCompare(b)
		})

	const partiallyFormattedAddress = [
		// ---
		...lines,
		deliveryAddress.locality,
		[deliveryAddress[PostalAddressPart.AdminLevel1], deliveryAddress[PostalAddressPart.PostalCode]].join(" "),
	]
		.filter(Boolean)
		.join(", ")

	return partiallyFormattedAddress
}
