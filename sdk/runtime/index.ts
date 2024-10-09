/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Node.js environment variable parsing.
 *
 *   Note that should only be imported by other Node.js modules.
 */

import { type StringKeyOf, pick } from "@isp.nexus/core"
import {
	EnvironmentKeys,
	EnvironmentName,
	EnvironmentNames,
	EnvironmentRecord,
	OptionalEnvironment,
	PrivateEnvironment,
	PrivateEnvironmentKeys,
	PublicEnvironment,
	PublicEnvironmentKeys,
	assertEnvironmentRecordPresent,
} from "@isp.nexus/core/env"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { packageOutPathBuilder, repoRootPathBuilder } from "@isp.nexus/sdk/reflection"
import { argv } from "node:process"
import { readLastGitCommit } from "./version-control.js"

const NODE_ENV = process.env.NODE_ENV || "development"

if (!EnvironmentNames.has(NODE_ENV)) {
	throw new Error(`Unknown environment name: ${NODE_ENV}`)
}

/**
 * Constant determining whether the current environment is production.
 *
 * @category Environment
 * @internal
 */
export const productionEnvironment = NODE_ENV === "production"

/**
 * Constant determining whether the current environment is _not_ production.
 *
 * @category Environment
 * @internal
 */
export const developmentEnvironment = !productionEnvironment

/**
 * The shared runtime environment record.
 */
const sharedEnvironmentRecord = {
	NEXUS_HTTP_CACHE_PATH: repoRootPathBuilder(".nexus", "http-cache"),
	ISP_NEXUS_WWW_URL: "https://isp.nexus",
	SENTRY_NODE_DSN: "https://316c0f529e59bd17c593d60edf880452@o4507179325915136.ingest.us.sentry.io/4507179328077824",
	ISP_NEXUS_APP_URL: "https://dev.isp.nexus:7777",
	ISP_NEXUS_COOKIE_DOMAIN: ".dev.isp.nexus",

	BUILD_COMMIT: readLastGitCommit() || "unknown",
	BUILD_DATE: new Date().toISOString(),
	NODE_ENV,
} as const satisfies Partial<PublicEnvironment>

for (const [key, value] of Object.entries(process.env)) {
	if (EnvironmentKeys.has(key) && value) {
		ConsoleLogger.info(`Override discovered for key \`${key}\`.`)
		;(sharedEnvironmentRecord as Partial<EnvironmentRecord>)[key] = value as any
	}
}

/**
 * Source from which to import the environment module.
 *
 * @internal
 */
export type EnvironmentModuleSource = EnvironmentName | "local"

/**
 * Resolved ES module type with a default export.
 *
 * @internal
 */
export interface ResolvedESModule<DefaultExport> {
	default: DefaultExport
}

/**
 * Type-helper to extracts the default export from an ES module.
 */
export type ExtractESModuleDefault<T> = T extends ResolvedESModule<infer DefaultExport> ? DefaultExport : never

/**
 * Plucks the default export from an ES module.
 */
export function pluckDefaultExport<DefaultExport>(module: ResolvedESModule<DefaultExport>): DefaultExport {
	return module.default
}

export function importEnvironmentModule(source: EnvironmentModuleSource): Promise<Partial<EnvironmentRecord>> {
	const filePath = packageOutPathBuilder("sdk", "runtime", `runtime.${source}.js`)

	return (
		import(filePath)
			// ---
			.then((module: ResolvedESModule<Partial<EnvironmentRecord>>) => pluckDefaultExport(module))
			.catch(() => {
				ConsoleLogger.warn(`Failed to import environment module from \`${filePath}\`.`)
				return {}
			})
	)
}

const [matchedEnvironmentRecord, localEnvironmentRecord] = await Promise.all([
	importEnvironmentModule(sharedEnvironmentRecord.NODE_ENV),
	importEnvironmentModule("local").catch(() => ({})),
])

const combinedRecord: Partial<EnvironmentRecord> = {
	...matchedEnvironmentRecord,
	...localEnvironmentRecord,
	...sharedEnvironmentRecord,
}

assertEnvironmentRecordPresent(combinedRecord)

/**
 * A record containing only private environment variables.
 */
export const $private: PrivateEnvironment = pick(combinedRecord, PrivateEnvironmentKeys)

/**
 * Whether to prefer JSON logging.
 */
export const $prefersJSONLogging = argv.includes("--json")

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
	if (record[key] === undefined) {
		throw new Error(message)
	}
}

/**
 * A record containing only public environment variables.
 */
export const $public: PublicEnvironment = pick(combinedRecord, PublicEnvironmentKeys)
