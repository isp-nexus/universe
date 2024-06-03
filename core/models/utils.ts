/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { JsonPrimitive } from "type-fest"
import { isIterable } from "../collections.js"
import { StringKeyOf, pick } from "../object.js"

/**
 * JSON serialize objects (not including arrays) and classes.
 *
 * @ignore
 * @internal
 */
type ExtractJSONProperties<T extends object> = {
	[Key in keyof T]: ExtractJSON<T[Key]>
}

/**
 * JSON serialize type.
 *
 * @ignore
 * @internal
 */
export type ExtractJSON<T> = T extends JsonPrimitive
	? T
	: // Any object with toJSON is special case
		T extends { toJSON(): infer J }
		? J
		: // : T extends GeoPointInput
			// 	? T
			T extends Iterable<infer U>
			? U[]
			: T extends object
				? ExtractJSONProperties<T>
				: never

/**
 * Pick JSON properties from an object.
 *
 * @ignore
 * @internal
 */
export type PickJSON<T, K extends keyof T> = { [P in K]: ExtractJSON<T[P]> }

export function pickJSON<O extends object, K extends keyof O = StringKeyOf<O>>(
	input: O,
	constraints: Iterable<K>
): PickJSON<O, K> {
	const modelSubset = pick(input, constraints, (value) => {
		if (!value) return value

		if (typeof value === "object" && "toJSON" in value && typeof value.toJSON === "function") {
			return value.toJSON()
		}

		if (typeof value === "string") return value
		if (isIterable(value)) return Array.from(value)

		return value
	})

	if ("$schema" in input) {
		Object.assign(modelSubset, { $schema: input.$schema })
	}

	return modelSubset as any
}
