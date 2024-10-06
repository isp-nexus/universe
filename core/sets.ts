/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Utility functions for working with sets.
 */

/**
 * A type representing a Set compatible object.
 *
 * @category Polyfill
 * @internal
 */
export interface SetLike<T> {
	/**
	 * The number of elements in the set.
	 *
	 * @internal
	 */
	size: number

	/**
	 * Returns `true` if the set contains the specified element.
	 *
	 * @internal
	 */
	has(value: unknown): boolean

	/**
	 * Returns an iterable of the set's elements.
	 *
	 * @internal
	 */
	keys(): IterableIterator<T>
}

/**
 * @internal
 */
export interface ExperimentalSetMethods<T> {
	/**
	 * Takes a set and returns a new set containing elements in this set but not in the given set.
	 *
	 * @category Polyfill
	 */
	difference<U extends string | number>(other: SetLike<U>): Set<Exclude<T, U>>
	difference<U>(other: SetLike<U>): Set<T>

	/**
	 * Returns a new set containing the elements that are present in both this set and the other set.
	 *
	 * @category Polyfill
	 */
	intersection<U>(other: SetLike<U>): Set<T & U>

	/**
	 * Takes a set and returns a new set containing elements which are in either this set or the given
	 * set, but not in both.
	 *
	 * @category Polyfill
	 */
	symmetricDifference<U>(other: SetLike<U>): Set<T | U>

	/**
	 * Returns a new set containing elements which are in either or both of this set and the given
	 * set.
	 *
	 * @category Polyfill
	 */
	union<U>(other: SetLike<U>): Set<T | U>
}

/**
 * @internal
 */
export type WithExperimentalSetMethods<T> = T extends SetLike<infer U> ? T & ExperimentalSetMethods<U> : never

import "core-js/full/set/difference.js"
import "core-js/full/set/intersection.js"
import "core-js/full/set/symmetric-difference.js"
import "core-js/full/set/union.js"

/**
 * Type-predicate for checking if a value is a Set-like object.
 */
export function isSetLike<T>(value: unknown): value is SetLike<T> {
	if (!value || typeof value !== "object") return false

	return "size" in value && "has" in value && "keys" in value
}

/**
 * Type-helper for extracting the value type from a constant set.
 */
export type InferTupleMember<T extends SetLike<unknown>> = T extends SetLike<infer U> ? U : never

/**
 * Set constructor that only accepts string values.
 */
export class SetTuple<T extends string> extends Set<T> {
	// has(value: T): true
	override has(value: T | null | undefined | string): value is T {
		return super.has(value as any)
	}

	override toJSON(): T[] {
		return Array.from(this)
	}

	/**
	 * Maps the set to an array of values, transformed by the given callback.
	 */
	public map<C extends (value: T) => unknown>(callback: C): ReturnType<C>[] {
		return Array.from(this, callback) as ReturnType<C>[]
	}

	/**
	 * Iterates over the set, calling the given async callback for each value.
	 *
	 * This is useful when you need to perform an async operation for each value in the set, while
	 * ensuring that the operations are performed in series.
	 */
	public async series<C extends (value: T) => Promise<unknown>>(callback: C): Promise<void> {
		for (const value of this) {
			await callback(value)
		}
	}

	/**
	 * Returns the value of the first element in the array where predicate is true, and undefined
	 * otherwise.
	 */
	public find<C extends (value: T) => boolean>(predicate: C): T | undefined {
		for (const value of this) {
			if (predicate(value)) return value
		}
	}
}

/**
 * Creates a readonly tuple-like set of values.
 *
 * This is useful for creating a set of string literals.
 *
 * @internal
 */
export function tuple<T extends object>(fromObjectKeys: {
	[K in keyof T]: boolean
}): SetTuple<Extract<keyof T, string>>
export function tuple<T extends string>(values: Iterable<T>): SetTuple<T>
export function tuple<T extends string>(...values: T[]): SetTuple<T>
export function tuple<T extends string>(...args: unknown[]): SetTuple<T> {
	if (args.length === 1) {
		const [firstValue] = args

		if (!firstValue) {
			throw new TypeError("Expected an object or an array of values.")
		}

		if (Array.isArray(firstValue)) {
			return new SetTuple(firstValue)
		}

		if (typeof firstValue === "object") {
			return new SetTuple(Object.keys(firstValue) as T[])
		}
	}

	return new SetTuple(args as T[])
}

/**
 * JSON-seralizable set.
 */
export class JSONSet<T> extends Set<T> {
	/**
	 * @internal
	 */
	override toJSON(): T[] {
		return Array.from(this)
	}
}
