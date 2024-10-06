/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Environment variables used in this monorepo.
 *
 *   Note that unlike the Node-specific module, this module is allowed to be imported by any other in
 *   the monorepo.
 */

import { InferTupleMember, tuple } from "./sets.js"

/**
 * Standard Node.js runtime environment values.
 *
 * @default "development"
 */
export const EnvironmentNames = tuple("development", "production")

/**
 * A tuple of all of the recognized environment names.
 *
 * @category Environment
 */
export type EnvironmentName = InferTupleMember<typeof EnvironmentNames>

/**
 * A generic environment record without any specific keys.
 *
 * @category Environment
 * @internal
 */
export type EnvironmentRecordInput = {
	[envKey: string]: string | undefined
}

/**
 * Type-predicate for determining if a given object seems to be an environment record.
 *
 * @category Environment
 * @internal
 */
export function isEnvironmentRecordInput(input: unknown): input is EnvironmentRecordInput {
	return typeof input === "object" && input !== null
}

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

//#region Required Environment Variables

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

//#endregion

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
	 * Connection string to the ISP Nexus database.
	 *
	 * @private
	 * @category ISP Nexus
	 * @format url
	 */
	OPEN_ISP_DATABASE_URL: string

	/**
	 * FCC Map API key.
	 *
	 * @private
	 */
	FCC_MAP_API_KEY: string

	/**
	 * FCC Map username.
	 *
	 * @private
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
	AWS_REGION: true,
	AWS_ACCESS_KEY_ID: true,
	AWS_SECRET_ACCESS_KEY: true,
	AZURE_PERSONAL_ACCESS_TOKEN: true,
	NODE_ENV: true,
	BUILD_COMMIT: true,
	BUILD_DATE: true,
	AIM_JWT_SECRET: true,
	SENTRY_NODE_DSN: true,
	SENTRY_AUTH_TOKEN: true,
	OPEN_ISP_DATABASE_URL: true,
	FCC_MAP_API_KEY: true,
	FCC_MAP_USERNAME: true,
	DATA_SOURCE_PATH: true,
	SDK_GOOGLE_MAPS_API_KEY: true,
	SPATIALITE_EXTENSION_PATH: true,
	INFO_BIP_API_KEY: true,
	INFO_BIP_BASE_URL: true,
	SINCH_PROJECT_ID: true,
	SINCH_APP_ID: true,
	SINCH_ACCESS_KEY_ID: true,
	SINCH_KEY_SECRET: true,
	OPENAI_API_KEY: true,
	OPENAI_ORGANIZATION_ID: true,
	OPENAI_PROJECT_ID: true,
})

//#endregion

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

//#region Public Environment

/**
 * Environment keys safe to reveal to the public.
 *
 * @category Environment
 * @internal
 * @see {@linkcode EnvironmentRecordPublic}
 * @see {@linkcode PublicEnvironment}
 */
export const PublicEnvironmentKeys = EnvironmentKeys.intersection(
	tuple([
		"BUILD_COMMIT",
		"BUILD_DATE",
		"ISP_NEXUS_APP_URL",
		"ISP_NEXUS_COOKIE_DOMAIN",
		"ISP_NEXUS_WWW_URL",
		"NODE_ENV",
		"SENTRY_NODE_DSN",
	] as const satisfies readonly EnvironmentKeys[])
)

/**
 * Public environment keys.
 *
 * @internal
 */
export type PublicEnvironmentKey = InferTupleMember<typeof PublicEnvironmentKeys>

/**
 * Subset environment safe to reveal to the public.
 *
 * @internal
 */
export type PublicEnvironment = Pick<EnvironmentRecord, PublicEnvironmentKey>

//#region Private Environment

/**
 * Environment keys private to the application.
 *
 * @category Environment
 * @see {@linkcode PrivateEnvironment}
 */
export const PrivateEnvironmentKeys = EnvironmentKeys.difference(PublicEnvironmentKeys)
/**
 * Private environment keys.
 *
 * @internal
 */
export type PrivateEnvironmentKey = InferTupleMember<typeof PrivateEnvironmentKeys>

/**
 * Subset environment kept private.
 *
 * @internal
 */
export type PrivateEnvironment = Pick<EnvironmentRecord, PrivateEnvironmentKey>

//#endregion

//#region Mono-Repo Environment

/**
 * Packages used in the ISP Nexus mono-repo.
 *
 * @internal
 */
export const ISPNexusPackages = tuple(
	// ---
	"core",
	"spatial",
	"tiger",
	"fcc",
	"mailwoman",
	"cartographer",
	"sdk",
	"sync",
	"api",
	"vaxis",
	"schema"
)

/**
 * Valid package names for ISP Nexus.
 *
 * @internal
 */
export type ISPNexusPackage = InferTupleMember<typeof ISPNexusPackages>

/**
 * Type-signature for a package-scoped function.
 *
 * This is used to ensure that the function is only called with a valid package name, while avoiding
 * the ceremony of carrying around the package name as a typed parameter.
 *
 * @internal
 */
export type ISPNexusPackageFn<PackageName extends ISPNexusPackage = ISPNexusPackage, Result = unknown> = (
	packageName: PackageName
) => Promise<Result>

//#endregion
