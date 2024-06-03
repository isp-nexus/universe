/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file USPS cardinal directions and their abbreviations.
 */

/**
 * The 8 directional abbreviations accepted by the USPS.
 *
 * Note that the USPS prefers directional abbreviations over their fully-spelled out names.
 *
 * @category Postal
 * @title Directional Abbreviation
 * @public
 * @see {@linkcode DirectionalName} for the full names.
 */
export enum DirectionalAbbreviation {
	NORTH = "N",
	EAST = "E",
	SOUTH = "S",
	WEST = "W",
	NORTHEAST = "NE",
	NORTHWEST = "NW",
	SOUTHEAST = "SE",
	SOUTHWEST = "SW",
}

/**
 * The 8 directional names accepted by the USPS.
 *
 * Note that the USPS prefers directional abbreviations over their fully-spelled out names.
 *
 * @category Postal
 * @title Directional Name
 * @public
 * @see {@linkcode DirectionalAbbreviation} for the abbreviations.
 */
export const DirectionalNames = [
	"NORTH",
	"EAST",
	"SOUTH",
	"WEST",
	"NORTH EAST",
	"NORTH WEST",
	"SOUTH EAST",
	"SOUTH WEST",
] as const satisfies readonly string[]

export type DirectionalName = (typeof DirectionalNames)[number]

export const DirectionalNameVariations = [
	...DirectionalNames,

	// Without spaces...
	"NORTHEAST",
	"NORTHWEST",
	"SOUTHEAST",
	"SOUTHWEST",

	// Title-case...
	"North",
	"East",
	"South",
	"West",
	"North East",
	"North West",
	"South East",
	"South West",

	// Lower-case...
	"north east",
	"north west",
	"south east",
	"south west",
] as const satisfies readonly string[]

export type DirectionalAbbreviationVariation = (typeof DirectionalNameVariations)[number]

/**
 * A record mapping directional abbreviations to their full names.
 *
 * @internal
 * @title Directional Abbreviation Record
 */
const DirectionalAbbreviationRecord = {
	N: "NORTH",
	E: "EAST",
	S: "SOUTH",
	W: "WEST",
	NE: "NORTH EAST",
	NW: "NORTH WEST",
	SE: "SOUTH EAST",
	SW: "SOUTH WEST",
} as const satisfies Record<DirectionalAbbreviation, DirectionalName>

type DirectionalAbbreviationRecord = typeof DirectionalAbbreviationRecord

/**
 * A record mapping directional names to their abbreviations.
 *
 * @internal
 */
const DirectionAbbreviationRecord = {
	NORTH: DirectionalAbbreviation.NORTH,
	EAST: DirectionalAbbreviation.EAST,
	SOUTH: DirectionalAbbreviation.SOUTH,
	WEST: DirectionalAbbreviation.WEST,

	NORTHEAST: DirectionalAbbreviation.NORTHEAST,
	NORTHWEST: DirectionalAbbreviation.NORTHWEST,
	SOUTHEAST: DirectionalAbbreviation.SOUTHEAST,
	SOUTHWEST: DirectionalAbbreviation.SOUTHWEST,

	"NORTH EAST": DirectionalAbbreviation.NORTHEAST,
	"NORTH WEST": DirectionalAbbreviation.NORTHWEST,
	"SOUTH EAST": DirectionalAbbreviation.SOUTHEAST,
	"SOUTH WEST": DirectionalAbbreviation.SOUTHWEST,

	"north east": DirectionalAbbreviation.NORTHEAST,
	"north west": DirectionalAbbreviation.NORTHWEST,
	"south east": DirectionalAbbreviation.SOUTHEAST,
	"south west": DirectionalAbbreviation.SOUTHWEST,

	// Title-case...
	North: DirectionalAbbreviation.NORTH,
	East: DirectionalAbbreviation.EAST,
	South: DirectionalAbbreviation.SOUTH,
	West: DirectionalAbbreviation.WEST,

	"North East": DirectionalAbbreviation.NORTHEAST,
	"North West": DirectionalAbbreviation.NORTHWEST,
	"South East": DirectionalAbbreviation.SOUTHEAST,
	"South West": DirectionalAbbreviation.SOUTHWEST,
} as const satisfies Record<DirectionalAbbreviationVariation, DirectionalAbbreviation>

type DirectionAbbreviationRecord = typeof DirectionAbbreviationRecord

/**
 * A type that represents all possible directional abbreviations.
 *
 * @internal
 */
type DirectionalVariation = keyof DirectionAbbreviationRecord

/**
 * A mapping of directional abbreviations to their respective names.
 *
 * @internal
 */
const AbbreviationToDirectional: ReadonlyMap<string, DirectionalName> = new Map(
	Object.entries(DirectionalAbbreviationRecord)
)

/**
 * A mapping of directionals to their respective abbreviations.
 *
 * @internal
 * @see {@link https://pe.usps.com/text/pub28/28c2_003.htm USPS Address Unit Designators}
 */
export const DirectionalToAbbreviationMap: ReadonlyMap<string, DirectionalAbbreviation> = new Map(
	Object.entries(DirectionAbbreviationRecord)
)

/**
 * Given a directional abbreviation, returns the corresponding direction.
 *
 * @internal
 */
export function pluckDirectionalName<C extends DirectionalAbbreviation | Lowercase<DirectionalAbbreviation>>(
	directionalAbbreviation: C
): DirectionalAbbreviationRecord[Uppercase<C>]
/**
 * Given a possible directional abbreviation or name, attempt to return the corresponding direction.
 *
 * @internal
 */
export function pluckDirectionalName(input: unknown): DirectionalName | null
export function pluckDirectionalName(input: unknown): DirectionalName | null {
	if (!input || typeof input !== "string") return null

	return (
		// Can we find a matching direction with the verbatim input?
		AbbreviationToDirectional.get(input) ||
		// Can we find a match by normalizing the input?
		AbbreviationToDirectional.get(input.trim().toUpperCase()) ||
		null
	)
}

/**
 * Given a directional name, returns the corresponding abbreviation.
 *
 * @internal
 */
export function lookupDirectionalAbbreviation<D extends DirectionalVariation>(
	cardinalDirection: D
): DirectionAbbreviationRecord[D]
/**
 * Given a possible cardinal direction, attempt to return the corresponding abbreviation.
 */
export function lookupDirectionalAbbreviation(input: unknown): DirectionalAbbreviation | null
export function lookupDirectionalAbbreviation(input: unknown): DirectionalAbbreviation | null {
	if (!input || typeof input !== "string") return null

	return (
		// Can we find a matching abbreviation with the verbatim input?
		DirectionalToAbbreviationMap.get(input) ||
		// Can we find a match by normalizing the input?
		DirectionalToAbbreviationMap.get(input.trim().toUpperCase()) ||
		null
	)
}

/**
 * Result of a directional lookup.
 *
 * @internal
 * @see {@linkcode lookupDirectional} for usage.
 */
export type DirectionalMatch<C extends DirectionalAbbreviation = DirectionalAbbreviation> = {
	/**
	 * The matched directional name.
	 */
	directional: DirectionalAbbreviationRecord[C]
	/**
	 * The corresponding directional abbreviation.
	 */
	abbreviation: C
}

/**
 * Given a directional abbreviation, lookup it's corresponding directional name.
 */
export function lookupDirectional<A extends DirectionalAbbreviation>(directionalAbbreviation: A): DirectionalMatch<A>

/**
 * Given a directional abbreviation, lookup it's corresponding directional name.
 */
export function lookupDirectional<A extends DirectionalAbbreviation>(directionalAbbreviation: A): DirectionalMatch<A>
/**
 * Given a directional name, lookup it's corresponding directional abbreviation.
 */
export function lookupDirectional<D extends DirectionalVariation>(
	directionalName: D
): DirectionalMatch<DirectionAbbreviationRecord[D]>
export function lookupDirectional(input: unknown): DirectionalMatch | null
export function lookupDirectional(input: unknown): DirectionalMatch | null {
	if (!input || typeof input !== "string") return null

	// Attempt to match the input as a cardinal abbreviation.
	const abbreviation = lookupDirectionalAbbreviation(input)

	if (abbreviation) {
		return {
			directional: DirectionalAbbreviationRecord[abbreviation],
			abbreviation,
		}
	}

	// Attempt to match the input as a cardinal direction.
	const directional = pluckDirectionalName(input)

	if (directional) {
		return {
			directional,
			abbreviation: DirectionalToAbbreviationMap.get(directional)!,
		}
	}

	return null
}
