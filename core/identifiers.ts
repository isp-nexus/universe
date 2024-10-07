/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Utilities for working with identifiers, such as UUIDs.
 */

import { camelCase, capitalCase, snakeCase } from "change-case"
import jsSHA3Mod from "jssha/sha3"
import { CamelCase, SnakeCase, Tagged } from "type-fest"
import * as UUID from "uuid"
import uuidByString from "uuid-by-string"

const jsSHA3 = jsSHA3Mod as unknown as (typeof import("jssha/sha3"))["default"]

/**
 * @internal
 */
export type SHA3Seed = string | number | boolean | null | Date | undefined
/**
 * @internal
 */
export type SHA3Input = Record<string | number, SHA3Seed> | SHA3Seed[]

export function normalizeSHASeeds(input: SHA3Input): string[] {
	const seeds = Array.isArray(input) ? input : Object.values(input)

	const normalizedSeeds = seeds.map((seed) => seed?.toString().trim()).filter(Boolean) as string[]

	if (normalizedSeeds.length === 0) {
		throw new Error("Cannot generate a SHA3 hash without input.")
	}

	return normalizedSeeds
}

export function simpleSHA3(seeds: SHA3Input, byteLength = 32): string {
	const sha3 = new jsSHA3("SHAKE128", "TEXT")
	const normalizedSeeds = normalizeSHASeeds(seeds)

	for (const seed of normalizedSeeds) {
		sha3.update(seed)
	}

	const hash = sha3.getHash("HEX", {
		outputLen: byteLength,
	})

	return hash.toUpperCase()
}

export enum ModelIDLength {
	Short = 8,
}

/**
 * Converts a name to snake_case, unless the name is already in all caps.
 */
export function smartSnakeCase<T extends string>(name: T): T extends Uppercase<T> ? T : SnakeCase<T> {
	const normalizedName = name
		// Remove periods after capital letters, e.g. "U.S.A." -> "USA"
		.replace(/([A-Z])(\.+)/g, "$1")
		.trim()

	if (normalizedName.toUpperCase() === normalizedName) {
		return (
			name
				// Replace all non-word characters with underscores...
				.replace(/\W{1,}/g, "_")
				// ...and then replace all sequences of underscores with a single underscore.
				.replace(/_{2,}/g, "_") as any
		)
	}

	return snakeCase(normalizedName) as any
}

/**
 * Converts a name to camelCase, unless the name is already in all caps.
 */
export function smartCamelCase<T extends string>(name: T): T extends Uppercase<T> ? T : CamelCase<T> {
	if (name.toUpperCase() === name) return name as any

	return camelCase(name) as any
}

/**
 * Predicate to determine if a given string is uniformly cased, i.e. all uppercase or all lowercase.
 */
export function isUniformlyCased(input: string | null): boolean {
	return Boolean(input && (input === input.toUpperCase() || input === input.toLowerCase()))
}

/**
 * Capitalizes a string, unless the string is uniformly cased, or an email address.
 */
export function smartCapitalCase(input: string): string {
	if (input.includes("@")) return input
	if (isUniformlyCased(input)) return input

	return capitalCase(input)
}

/**
 * A UUID string, used for identifying entities.
 *
 * @category Identifier
 * @type string
 * @title UUID
 * @format uuid
 */
export type UUIDLiteral = Tagged<string, "UUID">

/**
 * Generate a UUID v5.
 *
 * @category Identifier
 */
export function uuidV5(...seeds: Array<string | null | undefined>): string {
	const seed = seeds.filter(Boolean).join("").trim()

	if (!seed) {
		throw new Error("Cannot generate a UUID v5 without a seed.")
	}

	try {
		return uuidByString(seed, 5)
	} catch (_error) {
		throw new Error(`Failed to generate a UUID v5 from seed (${seed})`)
	}
}

/**
 * Generate a UUID v7.
 *
 * @category Identifier
 */
export function uuidV7(): string {
	return formatUUID(UUID.v7({}, new Uint8Array(16)))
}

export function isUUIDBytes(input: unknown): input is Uint8Array {
	return Boolean(input instanceof Uint8Array && input.length === 16)
}

/**
 * Attempts to parse a UUID from a string or returns a new UUID.
 *
 * @category Identifier
 */
export function createOrParseUUIDv7(input: unknown): string {
	if (typeof input === "string") {
		return formatUUID(UUID.parse(input))
	}

	if (isUUIDBytes(input)) return formatUUID(input)

	return uuidV7()
}

/**
 * Format a UUID as a string.
 *
 * @category Identifier
 */
export function formatUUID(input: string | ArrayLike<number> | null | undefined): string {
	if (!input) return UUID.NIL

	if (typeof input === "string") return input
	if (isUUIDBytes(input)) return UUID.stringify(input)

	return UUID.NIL
}

/**
 * A placeholder UUID for empty values.
 */
export const NIL_UUID: string = UUID.NIL

/**
 * Type-predicate to check if a string is a valid UUID.
 *
 * @category UUID
 */
export function isUUID(input: string): input is UUIDLiteral {
	return UUID.validate(input)
}
