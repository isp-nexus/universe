/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { StringKeyOf } from "type-fest"
import { tuple } from "../sets.js"
import { EnvironmentName } from "./definitions.js"

//#region Optional Environment Variables

/**
 * A record containing all of the optional environment variables for Open ISP.
 *
 * @category Environment
 * @internal
 * @see {@linkcode OptionalEnvironmentKey}
 */
export interface OptionalEnvironment {
	/**
	 * Personal access token used when accessing Azure services.
	 *
	 * @private
	 */
	AZURE_PERSONAL_ACCESS_TOKEN: string
	/**
	 * API key used when accessing Google Maps from our internal SDK.
	 *
	 * @private
	 * @category Google
	 */
	SDK_GOOGLE_MAPS_API_KEY: string

	/**
	 * Primary region to use when accessing AWS services.
	 *
	 * @private
	 */
	AWS_REGION: string

	/**
	 * AWS access key ID.
	 *
	 * @private
	 */
	AWS_ACCESS_KEY_ID: string

	/**
	 * AWS secret access key.
	 *
	 * @private
	 */
	AWS_SECRET_ACCESS_KEY: string

	/**
	 * Parsed Node.js environment.
	 *
	 * @public
	 * @see {@linkcode EnvironmentNames}
	 */
	NODE_ENV: EnvironmentName

	/**
	 * A reference to the current Git commit.
	 *
	 * @public
	 */
	BUILD_COMMIT: string

	/**
	 * The current build date.
	 *
	 * @format date
	 *
	 * @public
	 */
	BUILD_DATE: string

	/**
	 * Secret used when encoding and decoding JWT access tokens.
	 *
	 * @private
	 * @category Authentication
	 * @category AIM
	 */
	AIM_JWT_SECRET: string

	/**
	 * Sentry DSN for the Node.js runtime.
	 *
	 * @category Sentry
	 * @type string
	 * @public
	 * @format url
	 */
	SENTRY_NODE_DSN: `https://${string}.ingest.us.sentry.io/${string}`

	/**
	 * Authentication token used to access Sentry.
	 *
	 * @private
	 */
	SENTRY_AUTH_TOKEN: string

	/**
	 * Path to a request/response cache. This is used to reduce the number of requests made to
	 * external services.
	 *
	 * @private
	 * @category ISP Nexus
	 */
	NEXUS_HTTP_CACHE_PATH: string

	/**
	 * Directory path to Pelias data configured by `pelias.json` and fetched via Docker Compose.
	 *
	 * @private
	 * @category Geocoding
	 */
	PELIAS_DATA_PATH: string

	/**
	 * URL to the libpostal service, which providing address parsing.
	 *
	 * @private
	 * @category Geocoding
	 * @format url
	 */
	GO_POSTAL_SERVICE_URL: string

	/**
	 * FCC Map API key.
	 *
	 * @private
	 * @category FCC
	 */
	FCC_MAP_API_KEY: string

	/**
	 * FCC Map username.
	 *
	 * @private
	 * @category FCC
	 */
	FCC_MAP_USERNAME: string

	/**
	 * Absolute base path to a data directory.
	 *
	 * @private
	 */
	DATA_SOURCE_PATH: string

	/**
	 * Absolute base path to the Spatialite extension.
	 *
	 * @private
	 */
	SPATIALITE_EXTENSION_PATH: string

	/**
	 * Infobip API key.
	 *
	 * @private
	 * @category AIM
	 */
	INFO_BIP_API_KEY: string

	/**
	 * Infobip Base URL.
	 *
	 * @private
	 * @category AIM
	 * @format url
	 */
	INFO_BIP_BASE_URL: string

	/**
	 * Sinch Project ID.
	 *
	 * @private
	 * @category Sinch
	 */
	SINCH_PROJECT_ID: string

	/**
	 * Sinch App ID.
	 *
	 * @private
	 * @category Sinch
	 */
	SINCH_APP_ID: string

	/**
	 * Sinch Access Key ID.
	 *
	 * @private
	 * @category Sinch
	 */
	SINCH_ACCESS_KEY_ID: string
	/**
	 * Sinch Key Secret.
	 *
	 * @private
	 * @category Sinch
	 */
	SINCH_KEY_SECRET: string

	/**
	 * OpenAI API key.
	 *
	 * @private
	 */
	OPENAI_API_KEY: string

	/**
	 * OpenAI organization ID.
	 */
	OPENAI_ORGANIZATION_ID: string

	/**
	 * OpenAI project ID.
	 */
	OPENAI_PROJECT_ID: string
}

/**
 * Optional environment keys.
 *
 * @category Environment
 * @internal
 */
export type OptionalEnvironmentKey = keyof OptionalEnvironment

/**
 * A tuple of all of the optional environment keys.
 *
 * @internal
 */
export const OptionalEnvironmentKey = tuple<OptionalEnvironment>({
	AIM_JWT_SECRET: true,
	AWS_ACCESS_KEY_ID: true,
	AWS_REGION: true,
	AWS_SECRET_ACCESS_KEY: true,
	AZURE_PERSONAL_ACCESS_TOKEN: true,
	BUILD_COMMIT: true,
	BUILD_DATE: true,
	DATA_SOURCE_PATH: true,
	FCC_MAP_API_KEY: true,
	FCC_MAP_USERNAME: true,
	INFO_BIP_API_KEY: true,
	INFO_BIP_BASE_URL: true,
	NEXUS_HTTP_CACHE_PATH: true,
	NODE_ENV: true,
	OPENAI_API_KEY: true,
	OPENAI_ORGANIZATION_ID: true,
	OPENAI_PROJECT_ID: true,
	PELIAS_DATA_PATH: true,
	GO_POSTAL_SERVICE_URL: true,
	SDK_GOOGLE_MAPS_API_KEY: true,
	SENTRY_AUTH_TOKEN: true,
	SENTRY_NODE_DSN: true,
	SINCH_ACCESS_KEY_ID: true,
	SINCH_APP_ID: true,
	SINCH_KEY_SECRET: true,
	SINCH_PROJECT_ID: true,
	SPATIALITE_EXTENSION_PATH: true,
})

//#endregion

/**
 * Runtime assertion that an optional key is present.
 *
 * This is useful for ensuring that optional environment variables are present before use, while
 * still allowing us to omit them for un-related tasks.
 */
export function assertOptionalKeyPresent<
	E extends Partial<OptionalEnvironment>,
	K extends StringKeyOf<OptionalEnvironment>,
>(
	record: E,
	key: K,
	message = `Optional environment key \`${key}\` assertion failed.`
): asserts record is E & Record<K, NonNullable<E[K]>> {
	if (!Object.hasOwn(record, key)) {
		throw new Error(message)
	}
}
