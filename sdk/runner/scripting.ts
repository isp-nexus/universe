/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Utilities for running scripts conditionally.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { ConsoleLogger, stringifyLoggedObject } from "@isp.nexus/core/logging"
import esMain from "es-main"
import { which } from "zx"

/**
 * Logs an error that occurred while running a script.
 */
export function logScriptError(error: unknown): void {
	ConsoleLogger.error("An error occurred while running the script.")

	const normalizedError = error instanceof ResourceError ? error : ResourceError.wrap(error)

	ConsoleLogger.error(normalizedError)

	if (normalizedError.cause instanceof Error && normalizedError.cause.stack) {
		ConsoleLogger.error("Stack via cause:\n" + normalizedError.cause.stack)
	} else if (normalizedError.stack) {
		ConsoleLogger.error("Stack via cause:\n" + normalizedError.stack)
	}
}

/**
 * A script callback function to invoke.
 *
 * @internal
 */
export type ScriptCallback = (...args: any[]) => unknown | Promise<unknown>

/**
 * Cleans up services and exits the script cleanly.
 *
 * @internal
 */
export function postScriptCleanup(signal: NodeJS.Signals = "SIGTERM", exitCode = 0): Promise<void> {
	ConsoleLogger.debug(`\n[${signal}] Shutting down...`)

	const timeout = setTimeout(() => {
		ConsoleLogger.error("Script did not exit in a timely manner.")

		ServiceRepository.abortController.abort(signal)

		const services = ServiceRepository.inspect()
		ConsoleLogger.warn(services, `${services.length} did not dispose.`)

		process.exit(1)
	}, 15_000)

	return ServiceRepository.dispose()
		.catch(logScriptError)
		.finally(() => {
			clearTimeout(timeout)
			process.exit(exitCode)
		})
}

/**
 * Runs a script callback and handles cleanup.
 *
 * @internal
 */
export function runScript(scriptCallback: ScriptCallback): Promise<void> {
	process.on("SIGINT", postScriptCleanup)
	process.on("SIGTERM", postScriptCleanup)

	return Promise.resolve()
		.then(() => scriptCallback())
		.catch(logScriptError)
		.then(() => postScriptCleanup())
		.catch(() => postScriptCleanup("SIGTERM", 1))
}

/**
 * Given a module's import.meta object, resolves if the module was run as a NPM script.
 *
 * ```ts
 * runIfScript(import.meta, async () => {...})
 * ```
 *
 * This is useful for conditionally running scripts without too much boilerplate.
 *
 * @internal
 */
export async function runIfScript(meta: ImportMeta, scriptCallback: ScriptCallback): Promise<void> {
	if (!esMain(meta)) return

	const { $public } = await import("@isp.nexus/sdk/runtime")

	ConsoleLogger.info(
		stringifyLoggedObject($public, {
			description: "Public Environment",
			showValues: true,
		})
	)

	return runScript(scriptCallback)
}

/**
 * Asserts that a given shell command is present in the PATH.
 *
 * @param command - The command to check for, e.g. "git", "node", etc.
 * @param options - Options to pass to ZX's `which` function.
 * @throws ResourceError if the command is not found.
 */
export function assertShellResolvesPath(command: string, options?: which.Options): Promise<void> {
	return which(command, options)
		.then(() => void 0)
		.catch(() => {
			return Promise.reject(ResourceError.from(412, "Pelias command not found in PATH"))
		})
}
