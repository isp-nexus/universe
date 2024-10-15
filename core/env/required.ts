/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { InferTupleMember, tuple } from "../sets.js"
import { OptionalEnvironment, OptionalEnvironmentKey } from "./optional.js"

/**
 * A record containing all of the required environment variables for . Absence of any of these
 * variables will result in a startup error.
 *
 * @internal
 * @see {@linkcode RequiredEnvironmentKey}
 */
export interface RequiredEnvironment {
	/**
	 * URL to the ISP Nexus app server.
	 *
	 * @category Nexus
	 * @format url
	 * @public
	 */
	ISP_NEXUS_APP_URL: string

	/**
	 * URL to the ISP Nexus website.
	 *
	 * @category Nexus
	 * @public
	 * @format url
	 */
	ISP_NEXUS_WWW_URL: string

	/**
	 * Domain used to setting AIM cookies.
	 *
	 * @category AIM
	 * @public
	 */
	ISP_NEXUS_COOKIE_DOMAIN: string
}

/**
 * Required environment keys.
 */
export type RequiredEnvironmentKey = keyof RequiredEnvironment

/**
 * A tuple of all of the required environment keys.
 */
export const RequiredEnvironmentKeys = tuple<RequiredEnvironment>({
	ISP_NEXUS_COOKIE_DOMAIN: true,
	ISP_NEXUS_APP_URL: true,
	ISP_NEXUS_WWW_URL: true,
})

/**
 * Asserts that the given input contains all of the required environment keys.
 */
export function assertEnvironmentRecordPresent(input: Partial<EnvironmentRecord>): asserts input is EnvironmentRecord {
	for (const key of RequiredEnvironmentKeys) {
		if (!Object.hasOwn(input, key)) {
			console.warn(Object.keys(input), `Keys found before looking for ${key}`)

			throw new Error(`Missing required environment key "${key}"`)
		}
	}
}

/**
 * A record containing all of the environment variables for ISP Nexus.
 *
 * @internal
 */
export type EnvironmentRecord = RequiredEnvironment & Partial<OptionalEnvironment>

/**
 * ISP Nexus recognized environment keys.
 *
 * @internal
 */
export const EnvironmentKeys = tuple(...RequiredEnvironmentKeys, ...OptionalEnvironmentKey)

/**
 * All recognized environment keys.
 *
 * @category Environment
 * @internal
 */
export type EnvironmentKeys = InferTupleMember<typeof EnvironmentKeys>
