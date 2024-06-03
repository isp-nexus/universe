/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * Patterns for parsing numbers in street addresses.
 *
 * @category Postal
 */
export const StreetNumberPatterns = {
	/**
	 * Real numbers, such as integers on a street address.
	 */
	Real: /^\d+$/,
	/**
	 * Fractions, such as 1/2 or 3/4.
	 */
	Fractional: /[\d]+\/[\d]+/,
	/**
	 * Rational numbers, such as 1.5 or 3.25.
	 */
	Rational: /[\d]+\.[\d]+/,

	/**
	 * Pattern for parsing street number ranges, such as a range of house numbers.
	 */
	HouseRange: /^(\d+)-(\d+)$/,
} as const

/**
 * Tuple for outputting the parsed street number range.
 *
 * @category Postal
 */
export type HouseNumberRange = [rangeStart: number, rangeEnd: number]

/**
 * Attempts to parses the given house number string to determine if it is a range or floor number.
 */
export function parseHouseNumberRange(streetNumber: string | null | undefined): HouseNumberRange | null {
	if (!streetNumber) return null

	const [, firstMatch = "", secondMatch = ""] = streetNumber.match(StreetNumberPatterns.HouseRange) || []

	const rangeFirst = parseInt(firstMatch, 10)
	const rangeLast = parseInt(secondMatch, 10)

	if (isNaN(rangeFirst) || isNaN(rangeLast)) return null

	return [rangeFirst, rangeLast]
}
