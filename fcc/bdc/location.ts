/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { Tagged } from "type-fest"

export const BROADBAND_SERVICABLE_LOCATION_INPUT_PATTERN = /^[\d]{10}$/

/**
 * Unique ID for the Fabric location.
 *
 * The BSL ID remains persistent version to version when newer evidence indicates the position of
 * the serviceable location or the presence of a serviceable location on a single location parcel is
 * not significantly changed as compared to the prior version.
 *
 * - While IDs persist across Fabric versions does not mean that the latitude and longitude are
 *   unchanged.
 *
 * -An ID will remain consistent across versions when a different building is selected on a single
 * parcel.
 *
 * @type number
 * @title Broadband Servicable Location ID
 * @pattern ^[\d]{10}$
 */
export type BroadbandServicableLocationID = Tagged<number, "BroadbandServicableLocationID">

/**
 * Type-predicate for checking if a value appears to be a valid Broadband Servicable Location ID.
 *
 * @internal
 */
export function isBroadbandServicableLocationID(input: unknown): input is BroadbandServicableLocationID {
	switch (typeof input) {
		case "string":
		case "number":
			return BROADBAND_SERVICABLE_LOCATION_INPUT_PATTERN.test(input.toString())
	}

	return false
}
