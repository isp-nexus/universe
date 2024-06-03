/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import type { StatusCodes } from "http-status-codes"

/**
 * Type-helper to extract the status code from a `ResourceError`.
 */
export type ExtractResourceErrorStatusCode<T> = T extends ResourceError<infer S> ? S : never

const kResourceError = "_kResourceError"

/**
 * An entity registered with the Federal Communications Commission (FCC) that provides
 * telecommunications services.
 */
export class ResourceError<S extends StatusCodes = StatusCodes> extends Error {
	static DefaultStatus = 500
	static DefaultMessage = "An unknown error occurred."

	// public readonly $schema = $ResourceError.pathname

	public [kResourceError] = true

	static override [Symbol.hasInstance](input: unknown): input is ResourceError {
		if (!input) return false
		if (typeof input !== "object") return false

		if (kResourceError in input) return true

		return false
	}

	static from<S extends StatusCodes = StatusCodes>(
		statusCode: S,
		message: string,
		...urnSegments: string[]
	): ResourceError<S> {
		return new ResourceError(statusCode, urnSegments.length ? urnSegments.join(":") : "unknown", message)
	}

	/**
	 * Given an error, wraps it in a ResourceError instance.
	 */
	static wrap<E extends Error>(
		error: E,
		message?: string,
		...urnSegments: string[]
	): E extends ResourceError<infer ActualStatusCode> ? ResourceError<ActualStatusCode> : ResourceError
	/**
	 * Given a possible instance of `Error`, wraps it in a `ResourceError` instance.
	 *
	 * Note that if the error is already an instance of `ResourceError`, it will be returned as-is.
	 */
	static wrap<S extends StatusCodes>(error: unknown, message?: string, ...urnSegments: string[]): ResourceError<S>

	/**
	 * Given a possible instance of `Error`, wraps it in a `ResourceError` instance.
	 *
	 * Note that if the error is already an instance of `ResourceError`, it will be returned as-is.
	 */

	static wrap(error: unknown, message: string, ...urnSegments: string[]) {
		if (error instanceof ResourceError) {
			return error as ResourceError
		}

		let status = this.DefaultStatus

		if (error instanceof Error) {
			message ||= error.message || this.DefaultMessage

			if ("status" in error) {
				switch (typeof error.status) {
					case "number":
						status = error.status
						break
					case "string":
						status = parseInt(error.status, 10) || this.DefaultStatus
						break
				}
			}
		} else {
			message ||= this.DefaultMessage
		}

		const wrapper = this.from(status, message, ...urnSegments)
		wrapper.cause = error

		return wrapper
	}

	public get [Symbol.toStringTag]() {
		return `ResourceError<${this.name}>`
	}

	/**
	 * @title HTTP status code.
	 *
	 * A numeric status code conforming to the HTTP standard.
	 */
	status: S
	/**
	 * @title Error message.
	 *
	 * A human-readable error message explaining the error.
	 */
	override message!: string

	/**
	 * @title URN identifier.
	 *
	 * A unique identifier for the error, used to reference it in logs and other systems.
	 *
	 * @format uri
	 */
	override name: string

	constructor(status: S = 500 as S, urn: string, message = "An unknown error occurred.") {
		super(message)

		this.message = message
		this.name = urn || [status, "nexus", "isp"].join(":")
		this.status = status
	}

	public toJSON() {
		return {
			name: this.name,
			status: this.status,
			message: this.message,
		}
	}

	public override toString(): string {
		const messageSegments: string[] = [`[${this.status}] (${this.name}) ${this.message}`]

		if (this.cause instanceof Error && this.cause.message && this.cause !== this) {
			messageSegments.push(`\nCaused by: ${this.cause.message}`)
		}

		return messageSegments.join("\n")
	}
}

/**
 * @title Resource Error
 * @public
 *
 * An error response from a resource, such as an API, database, or file.
 */
export type ResourceErrorSchema = Pick<ResourceError, "status" | "message" | "name">
