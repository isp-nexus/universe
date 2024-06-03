/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { cacheResponse } from "../caching.js"
import { applyAccessControlAllowOrigin } from "../cors.js"
import { parseRangeHeader } from "../ranges.js"
import { WorkerRoute } from "../routing.js"
import { assertR2KeyMatch, assertR2ObjectBody } from "../storage.js"

//#region Database Retrieval
const DB_ROUTE_PATTERN = "/db/:databaseName([a-z0-9_\\-]+).:fileExtension([a-z0-9]+)"

export const DatabaseRetrieveRoute = WorkerRoute.GET(DB_ROUTE_PATTERN, async ({ request, params, env, ctx }) => {
	const { databaseName, fileExtension } = params

	if (!databaseName) throw ResourceError.from(400, "Missing database name")
	if (!fileExtension) throw ResourceError.from(400, "Missing file extension")

	if (request.method === "HEAD") {
		const response = new Response(null, {
			headers: {
				"X-Nexus-Request": databaseName,
				"Accept-Ranges": "bytes",
			},
		})

		applyAccessControlAllowOrigin(request, response)

		return response
	}

	const rangeHeader = parseRangeHeader(request.headers.get("Range"))

	if (!rangeHeader) {
		throw ResourceError.from(400, "Missing Range header")
	}

	const { offset, length } = rangeHeader

	console.info(`Accessing database ${databaseName}.${fileExtension}`)

	const assetPath = `db/${databaseName}.${fileExtension}`

	const r2ObjectBody = await env.NEXUS_ASSETS_BUCKET.get(assetPath, {
		range: { offset, length },
		// onlyIf: { etagMatches: etag },
	})

	assertR2KeyMatch(r2ObjectBody)
	assertR2ObjectBody(r2ObjectBody)

	const rangeData = await r2ObjectBody.arrayBuffer()

	rangeData.byteLength
	const response = new Response(rangeData, {
		status: 206, // Partial Content
		headers: [
			// ["Etag", r2ObjectBody.etag],
			["Content-Type", r2ObjectBody.httpMetadata?.contentType],
			["Cache-Control", r2ObjectBody.httpMetadata?.cacheControl],
			["Content-Range", `bytes ${offset}-${rangeData.byteLength}/${r2ObjectBody.size}`],
			["Expires", r2ObjectBody.httpMetadata?.cacheExpiry?.toISOString()],
		].filter((entry): entry is [string, string] => !!entry[1]),
	})

	applyAccessControlAllowOrigin(request, response)

	if (!Date.now()) {
		cacheResponse(response, { request, ctx })
	}

	return response
})

//#endregion
