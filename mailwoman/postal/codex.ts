/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Postal address encoding and decoding utilities.
 */

import { simpleSHA3 } from "@isp.nexus/core"
import {
	CountryISO2,
	expandH3Cell,
	GeoPoint,
	H3Cell,
	H3CellShort,
	shortCellToPoint,
	shortenH3Cell,
} from "@isp.nexus/spatial"
import { AdminLevel1Code } from "@isp.nexus/tiger"
import { Tagged } from "type-fest"
import { SanitizedPostalAddress } from "./sanitize.js"

export interface ParsedPostalAddressID {
	prefix: AdminLevel1Code
	cell: H3Cell
	point: GeoPoint
	hash: string
}

/**
 * A ID representing an encoded postal address.
 *
 * Delimited by a period, the first part is the encoded header, and the second part is the encoded
 * payload.
 *
 * @type string
 * @title Postal Address ID
 */
export type PostalAddressID = Tagged<string, "PostalAddressID">

export interface CreatePostalAddressIDOptions {
	sanitizedPostalAddress: SanitizedPostalAddress
	prefix?: AdminLevel1Code | CountryISO2 | "ZZ"
}

/**
 * Create a token representing a postal address.
 *
 * This is used to match addresses in a database without storing every component.
 */
export function createPostalAddressID(
	input: H3Cell | GeoPoint,
	{ prefix = "ZZ", sanitizedPostalAddress }: CreatePostalAddressIDOptions
): PostalAddressID {
	const shortCell = typeof input === "string" ? shortenH3Cell(input as H3Cell) : input.toH3ShortCell().toUpperCase()

	const hash = simpleSHA3([prefix, shortCell, sanitizedPostalAddress], 16).slice(0, 6)

	const postalAddressID = [prefix, shortCell, hash].join(".")

	return postalAddressID as PostalAddressID
}

/**
 * Parse a postal address token into a header.
 */
export function parsePostalAddressID(id: PostalAddressID): ParsedPostalAddressID
export function parsePostalAddressID(id: PostalAddressID | null | undefined): ParsedPostalAddressID | null
export function parsePostalAddressID(id: PostalAddressID | null | undefined): ParsedPostalAddressID | null {
	if (!id) return null

	const [prefix, shortCell, hash] = id.split(".") as [AdminLevel1Code, H3CellShort, string]

	const cell = expandH3Cell(shortCell)

	return {
		prefix,
		cell,
		point: shortCellToPoint(shortCell),
		hash,
	}
}

/**
 * Type-predicate to determine if a string is formatted as a `PostalAddressID`.
 */
export function isPostalAddressID(input: string): input is PostalAddressID {
	if (!input) return false

	return /^[0-9A-Z]{2,3}\.[0-9a-f]{10,15}\.[0-9a-f]{12}$/.test(input)
}
