/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { TRPCRoutePrefix } from "./constants.js"
import type { AppRouter } from "./server.js"

export interface ISPNexusClientOptions {
	batchLinkURL: string
}

/**
 * Create a TRPC client for the ISP Nexus API.
 */
export function createISPNexusClient({ batchLinkURL }: ISPNexusClientOptions) {
	const trpc = createTRPCClient<AppRouter>({
		links: [
			httpBatchLink({
				url: new URL(TRPCRoutePrefix, batchLinkURL).href,
			}),
		],
	})

	return trpc
}
