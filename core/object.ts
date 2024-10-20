/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Utility functions for working with objects.
 */

import { JsonObject } from "type-fest"
import { isIterable } from "./collections.js"
import { SetLike } from "./sets.js"

/**
 * Type-utility for extracting the string keys of an object.
 *
 * @internal
 */
export type StringKeyOf<O> = Extract<keyof O, string>

/**
 * @param input Source object.
 * @param scalarEnum Unconstrained scalar enum whose values present in `input` will be used as keys,
 *   such as an enum-like object.
 *
 * @returns A subset of the source object with only properties present in `scalarEnum`.
 */
export function pick<O extends object, K extends string>(
	input: O,
	scalarEnum: Record<K, K>,
	transform?: (value: O[keyof O], key: keyof O, input: O) => any
): Pick<O, StringKeyOf<O>>

/**
 * @param input Source object.
 * @param setLike Set-like object whose members represent the subset of keys to pick.
 *
 * @returns A subset of the source object with only properties present in `scalarEnum`.
 */
export function pick<O extends object, K extends keyof O>(
	input: O,
	setLike: SetLike<K>,
	transform?: (value: O[keyof O], key: keyof O, input: O) => any
): Pick<O, K>
/**
 * @param input Source object.
 * @param scalarEnum Enum-like object whose members represent the subset of keys to pick.
 *
 * @returns A subset of the source object with only properties present in `scalarEnum`.
 */
export function pick<O extends object, K extends keyof O>(
	input: O,
	scalarEnum: Record<K, K>,
	transform?: (value: O[keyof O], key: keyof O, input: O) => any
): Pick<O, StringKeyOf<O>>
/**
 * @param input Source object.
 * @param constraints Unconstrained iterable of keys to pick, such as in array or Map.
 *
 * @returns A subset of the source object with only properties present in `constraints`.
 */
export function pick<O extends object, K extends keyof O = StringKeyOf<O>>(
	input: O,
	constraints: Iterable<K>,
	transform?: (value: O[keyof O], key: keyof O, input: O) => any
): Pick<O, K>

/**
 * @param input Source object.
 * @param constraints Enum-like object whose members represent the subset of keys to pick.
 *
 * @returns A subset of the source object with only properties present in `constraints`.
 */
export function pick<O extends object, K extends keyof O = StringKeyOf<O>>(
	input: O,
	constraints: Record<K, K>,
	transform?: (value: O[keyof O], key: keyof O, input: O) => any
): Pick<O, K>
/**
 * @param input Source object.
 * @param keys Unconstrained iterable of keys to pick, such as in array or Map.
 *
 * @returns A subset of the source object with only properties present in `keys`.
 */
export function pick<O extends object, K extends string>(
	input: O,
	keys: Iterable<K>,
	transform?: (value: O[keyof O], key: keyof O, input: O) => any
): Pick<O, StringKeyOf<O>>
/**
 * @param input Source object.
 * @param constraints Unconstrained iterable of keys to pick, such as in array or Map.
 *
 * @returns A subset of the source object with only properties present in `constraints`.
 */
export function pick<O extends object, K extends keyof O = StringKeyOf<O>>(
	input: O,
	constraints: Iterable<K> | Record<K, K> | SetLike<K>,
	transform?: (value: O[keyof O], key: keyof O, input: O) => any
): Pick<O, K> {
	const picked: Partial<Pick<O, keyof O>> = {}

	if (!input) return picked as any
	if (!constraints) return input as any

	const keys = isIterable(constraints) ? Array.from(constraints) : Object.values(constraints)

	for (const key of keys) {
		const value = (input as any)[key]
		picked[key as keyof O] = transform ? transform(value, key, input) : value
	}

	return picked as any
}

/**
 * Type-predicate for checking if a value appears to be a record, i.e. an object that is not an
 * array.
 *
 * @category Type Guard
 * @category Object
 */

export function isRecordLike(input: unknown): input is object {
	return typeof input === "object" && input !== null && !Array.isArray(input)
}

/**
 * Type-helper to remove nullability from an object's properties.
 *
 * @category Object
 */
export type NonNullableObject<T> = { [P in keyof T]-?: NonNullable<T[P]> } & NonNullable<T>

/**
 * Given an object, returns a new object with all nullable properties removed.
 *
 * This is useful for cleaning up objects before serializing them to JSON.
 *
 * @category Object
 */
export function omitNullable<T extends object>(input: T): NonNullableObject<T> {
	const result: Record<string, unknown> = {}

	for (const [key, currentValue] of Object.entries(input)) {
		if (isRecordLike(currentValue)) {
			const childResult = omitNullable(currentValue)

			if (Object.keys(childResult).length > 0) {
				result[key] = childResult
			}
		} else if (Array.isArray(currentValue)) {
			const arr = currentValue
				.map((entryValue) => (isRecordLike(entryValue) ? omitNullable(entryValue) : entryValue))
				.filter((val) => val != null)

			if (arr.length > 0) {
				result[key] = arr
			}
		} else if (currentValue !== null) {
			result[key] = currentValue
		}
	}

	return result as NonNullableObject<T>
}

/**
 * Given serialized JSON, attempt to parse it.
 */
export function tryParsingJSON<T = unknown>(input: unknown, fallback?: undefined): T | undefined
export function tryParsingJSON<T = unknown>(input: unknown, fallback: null): T | null
export function tryParsingJSON<T = unknown, F = null>(input: unknown, fallback?: F): T | F {
	if (typeof input !== "string") return (fallback ?? null) as F

	try {
		return JSON.parse(input)
	} catch {
		return (fallback ?? null) as F
	}
}

export type FlattenObjectKeys<T extends JsonObject, Key = keyof T> = Key extends string
	? T[Key] extends JsonObject
		? `${Key}.${FlattenObjectKeys<T[Key]>}`
		: `${Key}`
	: never

/**
 * Flattens an object into a single-level object with dot-separated keys.
 */
export function flattenObject<T extends JsonObject>(
	obj: T,
	prefix: string[] = [],
	current: Record<string, unknown> = {}
): Record<FlattenObjectKeys<T>, unknown> {
	prefix = prefix || []
	current = current || {}

	// Remember kids, null is also an object!
	if (typeof obj === "object" && obj !== null) {
		Object.keys(obj).forEach((key) => {
			;(flattenObject as any)(obj[key] as any, prefix.concat(key), current)
		})
	} else {
		current[prefix.join(".")] = obj
	}

	return current
}
