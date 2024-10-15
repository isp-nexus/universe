/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { InferTupleMember } from "../sets.js"
import { PublicEnvironmentKeys } from "./public.js"
import { EnvironmentKeys, EnvironmentRecord } from "./required.js"

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
