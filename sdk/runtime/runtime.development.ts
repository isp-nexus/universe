/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file Development environment key-value pairs.
 */

import type { PublicEnvironment } from "@isp.nexus/core"

/**
 * The development environment record for the ISP Nexus project.
 */
export default {
	ISP_NEXUS_APP_URL: "https://dev.isp.nexus:7777",
	ISP_NEXUS_COOKIE_DOMAIN: ".dev.isp.nexus",
	NODE_ENV: "development",
} as const satisfies Partial<PublicEnvironment>
