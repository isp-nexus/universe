/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * Type-predicate for identifying PO Box addresses.
 *
 * @category Postal
 * @category PO Box
 */
export function isPOBox(input: unknown): boolean {
	return typeof input === "string" && /^PO BOX [\d-]+$/.test(input)
}

/**
 * Normalizes the given PO Box address to a standard USPS format.
 *
 * @category Postal
 * @category PO Box
 */
export function normalizePOBox(input: string): string {
	return input.replace(/(P\.?\s?O\.?\s?BOX)/, "PO BOX")
}
