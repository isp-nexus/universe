/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { CloudflareWorkerPMTiles } from "../protomaps/index.js"
import { WorkerRoute } from "../routing.js"

export const HomeRoute = WorkerRoute.GET("/", () => {
	return new Response(
		JSON.stringify(
			{
				id: "nexus-api",
				timestamp: new Date().toISOString(),
				count: CloudflareWorkerPMTiles.SharedResolvedValueCache.counter,
			},
			null,
			"\t"
		),
		{
			headers: {
				"Content-Type": "application/json",
			},
		}
	)
})

export const HealthCheckRoute = WorkerRoute.GET("/heartbeat", () => {
	return new Response("OK", {
		headers: {
			"Content-Type": "text/plain",
		},
	})
})
