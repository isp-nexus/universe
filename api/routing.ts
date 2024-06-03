/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { URLPatternPathParameters, URLRoutePattern } from "@isp.nexus/core/routing"
import { retrieveCachedResponse } from "./caching.js"
import { applyAccessControlAllowOrigin } from "./cors.js"

/**
 * Environment bindings associated with the API service.
 */
export interface NexusAPIEnv {
	NEXUS_ASSETS_BUCKET: R2Bucket
	PMTILES_PATH: string
}

/**
 * Context object for a route handler.
 */
export interface RouteContext<Env = any, Pattern extends string = string> {
	ctx: ExecutionContext
	url: URL
	request: Request
	env: Env
	params: URLPatternPathParameters<Pattern>
}

/**
 * Route handler, responsible for processing a request and returning a response.
 */
export type RouteHandler<Env = NexusAPIEnv, Pattern extends string = string> = (
	ctx: RouteContext<Env, Pattern>
) => Response | Promise<Response>

/**
 * Allowed HTTP methods for route delegation.
 */
export type HTTPMethod = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH"

/**
 * Allowed HTTP methods for route delegation.
 */
const DefaultAllowedMethods: ReadonlySet<HTTPMethod> = new Set(["GET", "HEAD", "OPTIONS"])

/**
 * Create a route handler.
 */
export class WorkerRoute<Pattern extends string = string, Env = NexusAPIEnv> {
	constructor(
		public readonly pattern: URLRoutePattern<Pattern>,
		public readonly handler: RouteHandler<Env, Pattern>,
		public readonly methods: ReadonlySet<HTTPMethod>
	) {}

	static GET<Pattern extends string = string, Env = NexusAPIEnv>(
		pattern: Pattern,
		handler: RouteHandler<Env, Pattern>
	) {
		return new WorkerRoute<Pattern, Env>(URLRoutePattern.from(pattern), handler, DefaultAllowedMethods)
	}
}

/**
 * Delegate a request to the appropriate route handler.
 */
export async function delegateRequest(context: RouteContext, routes: Iterable<WorkerRoute>): Promise<Response> {
	const method = context.request.method as HTTPMethod

	for (const { pattern, handler, methods } of routes) {
		if (!methods.has(method)) continue

		const params = pattern.matchParams(context.url)
		if (!params) continue

		const cachedResponse = await retrieveCachedResponse(context.request)

		if (cachedResponse) {
			const clone = new Response(cachedResponse.body, cachedResponse)
			applyAccessControlAllowOrigin(context.request, clone)
			return clone
		}

		return handler({
			...context,
			params,
		})
	}

	return new Response(`URL path ${context.url.pathname} does not match any known route`, { status: 404 })
}
