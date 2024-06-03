/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ProviderID } from "@isp.nexus/fcc"
import { FIPSBlockGeoID } from "@isp.nexus/tiger"

/**
 * Request body for looking up an entity.
 *
 * @public
 */
export interface LookupProvidersRequestBody {
	blockID: FIPSBlockGeoID

	downSpeedMinimum?: number
	downSpeedMaximum?: number

	upSpeedMinimum?: number
	upSpeedMaximum?: number
}

/**
 * Response body for looking up an entity.
 *
 * @public
 */
export interface LookupProvidersResponseBody {
	providerIDs: ProviderID[]
}

export async function lookupProviders(_body: LookupProvidersRequestBody): Promise<LookupProvidersResponseBody> {
	throw new Error("Not implemented")
}

/**
 * Look up providers for a given entity.
 *
 * @category Providers
 * @public
 */
export type LookupProviders = typeof lookupProviders
