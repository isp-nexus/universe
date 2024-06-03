/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * Error thrown when a predicate fails.
 *
 * @see {@linkcode continueIf}
 * @see {@linkcode throwIf}
 */
export class PredicateError extends Error {
	override name = "PredicateError"
}

/**
 * Resolves promise if condition is truthy, otherwise throws an error.
 *
 * This is useful for early returns in async functions.
 *
 * @see {@linkcode throwIf} for the opposite behavior.
 */
export async function continueIf(predicate: unknown): Promise<void> {
	const value = Boolean(typeof predicate === "function" ? await predicate() : predicate)

	if (value) return

	throw new PredicateError("`continueIf` condition not met.")
}

/**
 * Resolves promise if condition is falsy, otherwise throws an error.
 *
 * This is useful for early returns in async functions.
 *
 * @see {@linkcode continueIf} for the opposite behavior.
 */
export async function throwIf(predicate: unknown): Promise<void> {
	const value = Boolean(typeof predicate === "function" ? await predicate() : predicate)

	if (!value) return

	throw new PredicateError("`throwIf` condition met.")
}
