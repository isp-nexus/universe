/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { InferTupleMember, tuple } from "../sets.js"

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
