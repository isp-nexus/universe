/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   A Cloudflare Worker that serves PMTiles archives.
 */

import type { ExportedHandler } from "@cloudflare/workers-types"
import { ResourceError } from "@isp.nexus/core/errors"
import { applyAccessControlAllowOrigin } from "./cors.js"
import { DatabaseRetrieveRoute } from "./routes/db.js"
import { GeolocateRoute } from "./routes/geolocation.js"
import { HealthCheckRoute, HomeRoute } from "./routes/healthcheck.js"
import { BroadbandProviderTileMetadataRoute, BroadbandProviderTileRoute } from "./routes/provider.js"
import { TIGERTileMetadataRoute, TIGERTileRoute } from "./routes/tiger.js"
import { TileMetadataRoute, TileRoute } from "./routes/tile.js"
import { delegateRequest, NexusAPIEnv, RouteContext } from "./routing.js"

const handler: ExportedHandler<NexusAPIEnv> = {
	fetch: (request, env, ctx) => {
		const url = new URL(request.url)

		const routeContext: RouteContext = { request, url, env, ctx, params: {} }

		return delegateRequest(routeContext, [
			DatabaseRetrieveRoute,
			TIGERTileMetadataRoute,
			TIGERTileRoute,
			TileMetadataRoute,
			TileRoute,
			BroadbandProviderTileRoute,
			BroadbandProviderTileMetadataRoute,
			GeolocateRoute,
			HomeRoute,
			HealthCheckRoute,
		]).catch((error) => {
			if (error instanceof ResourceError) {
				const response = new Response(JSON.stringify(error.toJSON(), null, "\t"), {
					status: error.status,
					headers: {
						"Content-Type": "application/json",
					},
				})

				applyAccessControlAllowOrigin(request, response)

				return response
			}

			console.error(error)
			const response = new Response("Nexus Internal Server Error", { status: 500 })
			applyAccessControlAllowOrigin(request, response)

			return response
		})
	},
}

export default handler
