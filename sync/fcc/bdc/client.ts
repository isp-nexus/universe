/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { APIClient, APIClientConfig, assertOptionalKeyPresent } from "@isp.nexus/core"
import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { $private } from "@isp.nexus/sdk/runtime"

/**
 * Options for creating a FCC Broadband Data Collection API client.
 */
export interface CreateBDCClientOptions {
	username: string
	apiKey: string
}

/**
 * Broadband Data Collection API client service.
 *
 * @internal
 */
export const $BCDClient = ServiceRepository.register((abortController) => {
	assertOptionalKeyPresent($private, "FCC_MAP_API_KEY")
	assertOptionalKeyPresent($private, "FCC_MAP_USERNAME")

	const clientConfig = {
		displayName: "BDC",
		requestsPerMinute: 10,
		axios: {
			signal: abortController.signal,
			baseURL: "https://broadbandmap.fcc.gov/api/public",
			headers: {
				username: $private.FCC_MAP_USERNAME,
				hash_value: $private.FCC_MAP_API_KEY,
			},
		},
	} as const satisfies APIClientConfig

	type BroadbandDataCollectionClientConfig = typeof clientConfig & { __brand?: any }

	return new APIClient<BroadbandDataCollectionClientConfig>(clientConfig)
})
