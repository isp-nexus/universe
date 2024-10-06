/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Production environment key-value pairs.
 */

import type { PublicEnvironment } from "@isp.nexus/core"

/**
 * The production environment record for the ISP Nexus project.
 */
export default {
	ISP_NEXUS_APP_URL: "https://app.isp.nexus",
	ISP_NEXUS_COOKIE_DOMAIN: ".app.isp.nexus",
	NODE_ENV: "production",
} as const satisfies Partial<PublicEnvironment>
