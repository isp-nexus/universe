/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { APIClient, APIClientConfig, assertOptionalKeyPresent, pluckResponseData } from "@isp.nexus/core"
import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { $private } from "@isp.nexus/sdk/runtime"
import {
	calculateAddressSimilarity,
	convertParsedAddressCollectionToRecord,
	OpenVenuesAddressCollection,
	OpenVenuesAddressRecord,
} from "./address.js"
/**
 * Libpostal REST API client service.
 *
 * @singleton
 */
export const $GoPostalClient = ServiceRepository.register(({ abortController }) => {
	assertOptionalKeyPresent($private, "GO_POSTAL_SERVICE_URL")

	return new APIClient({
		displayName: "Pelias (libpostal)",
		axios: {
			signal: abortController.signal,
			baseURL: $private.GO_POSTAL_SERVICE_URL,
		},
	} satisfies APIClientConfig as APIClientConfig)
})

/**
 * Given a formatted address, parse it into a structured postal address.
 *
 * @param input A reasonably well-formatted address string.
 */
export async function parseAddress(input: string): Promise<OpenVenuesAddressRecord> {
	return $GoPostalClient.then((client) =>
		client
			.fetch<OpenVenuesAddressCollection>({
				url: "/parse",
				params: {
					address: input,
				},
			})
			.then(pluckResponseData)
			.then(convertParsedAddressCollectionToRecord)
	)
}

export async function compareAddresses(leftInput: string, rightInput: string): Promise<any> {
	const [parsedLeft, parsedRight] = await Promise.all([parseAddress(leftInput), parseAddress(rightInput)])

	return {
		parsedLeft,
		parsedRight,
		measure: calculateAddressSimilarity(parsedLeft, parsedRight),
	}
}

// export async function compareMedianAddresses(...inputs: string[]): Promise<OpenVenuesAddressCollection[]> {
// 	const parsedRecords = await Promise.all(inputs.map(parseAddress))
// }
