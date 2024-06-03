/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import type { StateName } from "@isp.nexus/tiger"
import type { SnakeCase } from "type-fest/source/snake-case.js"

/**
 * Snake_case identifier for a US State or Territory. Used by the FCC API.
 */
export type FCC_StateID = SnakeCase<Lowercase<StateName>>
