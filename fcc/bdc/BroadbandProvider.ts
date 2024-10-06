/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   FCC Broadband Data Collection Provider common types.
 */

import { JSONSchemaID, TemporalProperties } from "@isp.nexus/core"
import { Tagged } from "type-fest"
import { AdminLevel1Code } from "../../tiger/state.js"
import { FRN } from "../entity/frn.js"
import { BroadbandTechnologyCode } from "./technologies.js"

/**
 * A 6-digit number assigned by the FCC to uniquely identify a broadband provider.
 *
 * @category FCC
 * @category Form 499
 * @type number
 * @title Provider ID
 */
export type ProviderID = Tagged<number, "ProviderID">

/**
 * Pattern for validating a provider ID.
 *
 * @internal
 */
export const PROVIDER_INPUT_PATTERN = /^\d{6}$/

/**
 * Type-predicate for checking if a value appears to be a valid provider ID.
 *
 * @category FCC
 * @category Form 499
 * @internal
 */
export function isProviderID(input: unknown): input is ProviderID {
	switch (typeof input) {
		case "string":
		case "number":
			return PROVIDER_INPUT_PATTERN.test(input.toString())
	}

	return false
}

export const $BroadbandProvider = JSONSchemaID("BroadbandProvider")
export type $BroadbandProvider = typeof $BroadbandProvider

/**
 * A broadband provider registered with the FCC, identified by a unique 6-digit provider ID.
 *
 * @title Broadband Provider
 * @public
 */
export interface BroadbandProvider extends TemporalProperties {
	/**
	 * The unique 6-digit ID assigned by the FCC that identifies each service provider.
	 *
	 * @type number
	 * @title Broadband Provider ID
	 * @see {@linkcode ProviderID}
	 */
	id: ProviderID

	/**
	 * FCC Registration Numbers (FRNs) associated with the provider.
	 *
	 * @TJS-type array
	 * @TJS-items.type number
	 * @title Associated FRNs
	 */
	frns: Set<FRN>

	/**
	 * Specific divisions of the provider, keyed by FRN.
	 *
	 * @title Divisions by FRN
	 * @TJS-type object
	 * @TJS-additionalProperties.type string
	 */
	divisionsByFRN: { [K in FRN]?: string }

	/**
	 * Doing Business As (DBA) names associated with the provider, keyed by FRN.
	 *
	 * @title Doing Business As by FRN
	 * @TJS-type object
	 * @TJS-additionalProperties.type string
	 */
	doingBusinessAsByFRN: { [K in FRN]?: string }

	/**
	 * Categorical tags associated with the provider.
	 *
	 * @TJS-type array
	 * @TJS-items.type string
	 * @title Associated FRNs
	 */
	tags?: Set<string>

	/**
	 * Technology codes associated with the provider.
	 *
	 * @TJS-type array
	 * @TJS-items.type number
	 * @title Technology Codes
	 * @see {@linkcode BroadbandTechnologyCode}
	 */
	technologyCodes: Set<BroadbandTechnologyCode>

	/**
	 * The name of the entity's holding company
	 *
	 * @title Holding Company
	 * @TJS-examples ["Comcast Corporation", "Verizon Communications", "AT&T Inc."]
	 */
	holdingCompany: string

	/**
	 * The claimed number of broadband servicable locations for the provider.
	 *
	 * @title Claimed Record Count
	 */
	claimedRecordCount?: number

	/**
	 * The number of broadband servicable locations for the provider in a specific state.
	 *
	 * @title Claimed Record Count by State
	 * @TJS-type object
	 * @TJS-additionalProperties.type number
	 */
	claimedRecordCountByStateCode?: { [S in AdminLevel1Code]?: number }
}
