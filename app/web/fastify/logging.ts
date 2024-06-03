/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { isLoggableReference } from "@isp.nexus/core/logging"
import type { onRequestHookHandler } from "fastify"
import { FastifyHTTPS } from "./interfaces.js"

/**
 * Logs the response of a request.
 *
 * @category Fastify
 * @category Logging
 * @category Request
 */
export const requestLogHandler: onRequestHookHandler = (req, _reply, done) => {
	const { query, params } = req

	const [pathname] = req.url.split("?")

	req.log.info(
		{
			query: isLoggableReference(query) ? query : undefined,
			params: isLoggableReference(params) ? params : undefined,
		},
		`📥 Request [${pathname}]`
	)

	done()
}

/**
 * Logs the response of a request.
 *
 * @category Fastify
 * @category Logging
 * @category Response
 */
export const responseLogHandler: onRequestHookHandler = (req, reply, done) => {
	const { statusMessage } = reply.raw

	const [pathname] = req.url.split("?")

	req.log.info(`📤 Response (${statusMessage}) [${pathname}]`)

	done()
}

/**
 * Handles an internal Fastify error, normalizing it into a `ResourceError`.
 *
 * @category Fastify
 * @category Error
 */
export const handleInternalError: FastifyHTTPS["errorHandler"] = (fastifyError, req, reply) => {
	let parsedError: ResourceError

	if (fastifyError instanceof ResourceError) {
		parsedError = fastifyError
	} else {
		parsedError = new ResourceError(
			fastifyError.statusCode ?? 500,
			`fastify:errors:${fastifyError.code || "unknown"}`,
			fastifyError.message
		)

		parsedError.cause = fastifyError
	}

	const { status } = parsedError

	if (status >= 500) {
		req.log.error(
			[
				// ---
				`📨 [${req.method} ${req.url}] 🔥 ${status}`,
				parsedError.message,
				parsedError.stack,
			]
				.filter(Boolean)
				.join(" ")
		)
	} else {
		req.log.info(
			[
				// ---
				`🔥 ${status} error returned.`,
				`📨 [${req.method} ${req.url}]`,
			].join(" ")
		)
	}

	reply
		// ---
		.code(status)
		.type("application/json")
		.send(JSON.stringify(parsedError.toJSON(), null, 2))
}
