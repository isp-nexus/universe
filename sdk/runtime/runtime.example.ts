/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file Injected environment key-value pairs.
 */

import type { EnvironmentRecord } from "@isp.nexus/core"

/**
 * Locally injected environment key-value pairs.
 *
 * Note: This file is not included in the repository.
 */
export default {
	// Put your environment variables here.
} as const satisfies Partial<EnvironmentRecord>
