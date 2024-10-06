/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Google Place ID utilities.
 */

import { Tagged } from "type-fest"

/**
 * A Place ID uniquely identifies a place in the Google Places database and on Google Maps.
 *
 * The length of the identifier may vary. Generally, the identifier is a 27-character string,
 * however, more specific places may have longer identifiers.
 *
 * Place IDs appear to be base64-encoded strings, delimited by underscores and dashes.
 *
 * Note that Place IDs do change. Consider a them stale after a few days.
 *
 * @category Google
 * @category Geocoding
 * @type string
 * @minLength 1
 * @pattern ^[A-Za-z0-9_-]+$
 * @title Google Place ID
 */
export type GooglePlaceID = Tagged<string, "GooglePlaceID">

/**
 * Pattern for validating a Google Place ID.
 */
export const GOOGLE_PLACE_ID_PATTERN = /^[A-Za-z0-9_-]+$/

/**
 * Type-predicate for checking if a value appears to be a valid Google Place ID.
 *
 * @category Google
 * @category Geocoding
 * @internal
 */
export function isGooglePlaceID(input: string): input is GooglePlaceID {
	return GOOGLE_PLACE_ID_PATTERN.test(input.toString())
}
