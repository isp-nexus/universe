/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { InferTupleMember, tuple } from "../sets.js"
import { EnvironmentKeys, EnvironmentRecord } from "./required.js"

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
