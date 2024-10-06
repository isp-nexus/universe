/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   API response utilities.
 */

import { AxiosError, HttpStatusCode, isAxiosError } from "axios"
import { ResourceError } from "../errors/schema.js"
import { ConsoleLogger } from "../logging/index.js"

/**
 * A response container, wrapping the actual response body.
 */
export interface ResponseContainer<Body> {
	data: Body
}

export type ResponseLike<Body> = ResponseContainer<Body> | Body

/**
 * Type-helper to pluck the response body, possibly from within an Axios response.
 *
 * This is useful when normalizing a new Axios response and a cached local response.
 *
 * @internal
 */
export type ExtractResponseData<T> = T extends ResponseContainer<infer Body> ? Body : T

function isResponseContainer<Body>(responseContainer: ResponseLike<Body>): responseContainer is ResponseContainer<Body>
function isResponseContainer<Body>(body: Body): body is Body
function isResponseContainer<Body>(input: ResponseLike<Body>): input is ResponseContainer<Body> {
	return typeof input === "object" && input !== null && "data" in input
}

/**
 * Helper function to pluck the response body from an Axios response.
 */
function pluckResponseBody<Body>(responseContainer: ResponseContainer<Body>): Body
function pluckResponseBody<Body>(rawBody: Body): Body
function pluckResponseBody<Body>(input: ResponseContainer<Body> | Body): Body {
	if (isResponseContainer(input)) return input.data

	return input
}

/**
 * Type-helper to recursively pluck the `data` property from a response body.
 *
 * This is useful when an API nests the actual response body within a `data` property.
 *
 * @internal
 */
export type ExtractResponseBodyData<Body> = Body extends {
	data: infer Data
}
	? ExtractResponseBodyData<Data>
	: Body

/**
 * Helper function to recursively pluck the `data` property from a response body.
 *
 * This is useful when an API nests the actual response body within a `data` property.
 *
 * @internal
 */
export function pluckResponseData<Body>(responseContainer: ResponseContainer<Body>): ExtractResponseBodyData<Body>
export function pluckResponseData<Body>(input: ResponseContainer<Body> | Body): ExtractResponseBodyData<Body> {
	const body = pluckResponseBody(input)

	if (isResponseContainer(body)) return pluckResponseData(body)

	return body as ExtractResponseBodyData<Body>
}

export function checkConnectivity(
	connectivityURL: URL | string = "https://connectivitycheck.gstatic.com/generate_204"
): Promise<boolean> {
	return fetch(connectivityURL, {
		method: "HEAD",
	})
		.then((response) => response.ok)
		.catch(() => false)
}

/**
 * Delegate Axios errors to an appropriate error handler.
 *
 * @internal
 */
export async function delegateAxiosError(error: unknown): Promise<unknown> {
	{
		if (!isAxiosError(error)) return Promise.reject(error)

		const { response, code: networkErrorCode } = error

		if (networkErrorCode === "ENOTFOUND") {
			const internetReachable = await checkConnectivity()

			if (!internetReachable)
				throw ResourceError.from(
					500,
					"Could not reach host. Are we connected to the internet?",
					"axios",
					"network",
					"unreachable"
				)
		}

		if (!response) throw ResourceError.from(500, "Internal Server Error", "axios", "response", "missing")

		if (response.status === HttpStatusCode.Unauthorized) {
			throw ResourceError.from(401, "Unauthorized")
		}

		if (!networkErrorCode) {
			throw ResourceError.from(500, "Internal Server Error", "axios", "code", "missing")
		}

		switch (networkErrorCode) {
			case AxiosError.ERR_NETWORK:
				throw ResourceError.from(503, "Service Unavailable")
			case AxiosError.ERR_CANCELED:
			case AxiosError.ECONNABORTED:
			case AxiosError.ETIMEDOUT:
				return Promise.resolve()
			default:
				ConsoleLogger.warn(`Unhandled network error: ${networkErrorCode}`)
		}

		return Promise.reject(error)
	}
}
