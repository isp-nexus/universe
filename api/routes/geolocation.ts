/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { applyAccessControlAllowOrigin } from "../cors.js"
import { WorkerRoute } from "../routing.js"

export const GeolocateRoute = WorkerRoute.GET("/geolocate", ({ request }) => {
	if (!request.cf) throw ResourceError.from(424, "Cannot geolocate without Cloudflare data.")
	const cf = request.cf as IncomingRequestCfProperties

	const geolocation: IncomingRequestCfPropertiesGeographicInformation = {
		latitude: cf.latitude,
		longitude: cf.longitude,
		city: cf.city,
		country: cf.country,
		region: cf.region,
		regionCode: cf.regionCode,
		continent: cf.continent,
		postalCode: cf.postalCode,
		timezone: cf.timezone,
	}

	const response = new Response(JSON.stringify(geolocation, null, "\t"), {
		headers: {
			"Content-Type": "application/json",
			"Cached-Control": `public, max-age=${60 * 60}`,
		},
	})

	applyAccessControlAllowOrigin(request, response)

	return response
})
