/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file FCC FRN utilities.
 */

import { Tagged } from "type-fest"

/**
 * Also known as a CORES ID, this is a unique identifier for the entity in the FCC's CORES system.
 *
 * @type number
 * @title FCC Registration Number
 * @TJS-examples ["0005937974", "0018506568", "0001551530"]
 */
export type FRN = Tagged<number, "FRN">

/**
 * Predicate to check if a string is a valid FCC Registration Number (FRN).
 *
 * @internal
 */
export function isFRN(input: string | number | null | undefined): input is FRN {
	if (!input) return false

	const normalizedInput = typeof input === "string" ? parseInt(input, 10) : input

	if (isNaN(normalizedInput)) return false
	if (normalizedInput < 0) return false
	if (!isFinite(normalizedInput)) return false

	return true
}
