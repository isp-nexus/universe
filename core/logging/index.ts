/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { LoggerExtras, pino } from "pino"
import { PrivateEnvironmentKeys } from "../env.js"

/**
 * Options for creating a Pino logger, compatible with Fastify.
 *
 * @category Logger
 * @internal
 */
export type ILoggerOptions = pino.LoggerOptions

/**
 * Default options for creating a Pino logger.
 *
 * @category Logger
 */
export const DEFAULT_PINO_LOGGER_OPTIONS: ILoggerOptions = {
	enabled: true,
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
			ignore: "pid,hostname",
			translateTime: "SYS:HH:MM:ss",
		},
	},
	redact: [...PrivateEnvironmentKeys, "req.headers.authorization", "query.token"] as string[],
	serializers: {
		// Omit request ID from logs.
		reqId: (_reqId) => undefined,
	},
} as const satisfies ILoggerOptions

/**
 * Logger with browser methods, as well as async disposability.
 *
 * @internal
 */
export interface IRuntimeLogger<Prefixes extends string[] = string[]> extends pino.BaseLogger, LoggerExtras {
	/**
	 * The prefixes for the logger.
	 */
	prefixes: Prefixes

	withPrefix: <ChildPrefixes extends string[]>(
		...prefixes: ChildPrefixes
	) => IRuntimeLogger<[...Prefixes, ...ChildPrefixes]>

	[Symbol.asyncDispose](): Promise<void>
}

export function pluckOrCreatePrefixedLogger<T extends IRuntimeLogger<any>>(logger: T): T
export function pluckOrCreatePrefixedLogger<T extends string>(prefix: T): IRuntimeLogger<[T]>
export function pluckOrCreatePrefixedLogger<T extends IRuntimeLogger<any> | string>(input: T): IRuntimeLogger
export function pluckOrCreatePrefixedLogger<T extends IRuntimeLogger<any> | string>(input: T): IRuntimeLogger {
	return typeof input === "string" ? ConsoleLogger.withPrefix(input) : input
}

const prefixToLabel = (prefix: string) => `[${prefix}]`
const prefixesToLabel = (...prefixes: string[]) =>
	prefixes
		// ---
		.filter(Boolean)
		.map(prefixToLabel)
		.join(" ") + " "

function asyncDispose(this: LoggerExtras<any>) {
	return Promise.resolve(this.flush())
}

/**
 * Creates a child logger with a prefix, sharing the same options as the parent
 *
 * @internal
 */
export type PrefixedChildLoggerFn<Prefixes extends string[]> = (...prefixes: Prefixes) => IRuntimeLogger<Prefixes>

/**
 * Creates a disposable logger.
 *
 * @category Logger
 */
export function createRuntimeLogger(options?: pino.LoggerOptions): IRuntimeLogger {
	// First, we create the Pino instance...
	const baseLogger = pino({
		...DEFAULT_PINO_LOGGER_OPTIONS,
		...options,
	})

	function withPrefix<ParentPrefixes extends string[], ChildPrefixes extends string[]>(
		this: IRuntimeLogger<ParentPrefixes>,
		...childPrefixes: ChildPrefixes
	) {
		const [childPrefix1 = "", ...childPrefixesRest] = childPrefixes

		const child = this.child(
			{},
			{
				msgPrefix: prefixesToLabel(
					// parentPrefixes.length === 0 ? bold(childPrefix1) : childPrefix1,
					childPrefix1,
					...childPrefixesRest
				),
			}
		) as IRuntimeLogger<[...ParentPrefixes, ...ChildPrefixes]>

		Object.assign(child, {
			[Symbol.asyncDispose]: asyncDispose,
			prefixes: [childPrefix1, ...childPrefixesRest],
			withPrefix,
		})

		return child
	}

	// ...then we add the async disposability.
	const logger: IRuntimeLogger = Object.assign(baseLogger, {
		prefixes: [],
		[Symbol.asyncDispose]: asyncDispose,
		withPrefix,
	})

	// Finally, exposing the logger as a branded type.
	return logger
}

/**
 * Plucks the log level from the environment.
 */
export function pluckLogLevel(): pino.Level {
	if (typeof process !== "object" || !process.env) return "info"

	return (process.env.NEXUS_LOG_LEVEL as pino.Level) || "info"
}

/**
 * Default logger, outputting to the console.
 *
 * @see {@linkcode createRuntimeLogger} for creating a custom logger.
 */
export const ConsoleLogger: IRuntimeLogger = createRuntimeLogger({
	level: pluckLogLevel(),
})

/**
 * Determines if the input is a loggable reference, i.e. an object with properties.
 *
 * @category Logger
 */
export function isLoggableReference(input: unknown): input is object {
	return Boolean(input && typeof input === "object" && Object.keys(input).length)
}

/**
 * Casts an object to an array of log-friendly entries.
 *
 * @category Object
 * @category Logger
 */
export function castToLoggableEntries<T extends Record<string, unknown>>(input: T) {
	return Object.entries(input)
		.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
		.filter(([_key, value]) => value && typeof value === "string") as [keyof T, string][]
}

/**
 * Options for pretty-printing a logged object.
 *
 * @category Logger
 * @internal
 */
export interface StringifyLoggedObjectOptions {
	description: string
	showValues?: boolean
}

/**
 * Pretty-prints the public environment variables.
 *
 * @category Object
 * @category Logger
 */
export function stringifyLoggedObject(
	input: Record<string, any>,
	{ description, showValues }: StringifyLoggedObjectOptions
): string {
	const lines = castToLoggableEntries(input).map(([key, value]) => {
		const printedValue = showValues ? value : new Array(value.length).fill("*").join("")

		return `${key}: ${printedValue}`
	})

	return description + "\n\n" + lines.join("\n") + "\n"
}
