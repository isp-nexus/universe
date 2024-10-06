/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { Tagged } from "type-fest"
import { AdminLevel1Code, FIPSStateCode } from "./state.js"

//#region Tagged FIPS types

/**
 * A 4-digit number assigned by the Census to uniquely identify a block.
 *
 * ```txt
 * (State Code)━━┳┓   ┏┳┳┳┳┳━━(Tract Code)
 *               482012231001050
 *                 ┗╋┛      ┗┻┻┻━(Block Code)
 *            (County Code)
 * ```
 *
 * @category Census
 * @category FIPS
 * @type string
 * @pattern ^\d{4}$
 * @minLength 4
 * @maxLength 4
 * @title FIPS Block Code
 * @see {@linkcode FIPSBlockGroupCode} for a less specific level.
 * @see {@linkcode FIPSBlockGeoID} for the full GeoID.
 */
export type FIPSBlockCode = Tagged<string, "FIPSBlockCode">

/**
 * A 15-digit number assigned by the Census to uniquely identify a block.
 *
 * ```txt
 * (State Code)━━┳┓   ┏┳┳┳┳┳━━(Tract Code)
 *               482012231001050
 *                 ┗╋┛      ┗┻┻┻━(Block Code)
 *            (County Code)
 * ```
 *
 * @category Census
 * @category FIPS
 * @type string
 * @pattern ^\d{15}$
 * @minLength 15
 * @maxLength 15
 * @title FIPS Block Geo ID
 * @see {@linkcode FIPSBlockCode} for the 4-digit version.
 */
export type FIPSBlockGeoID = Tagged<string, "FIPSBlockGeoID">

/**
 * A 1-digit number assigned by the Census to uniquely identify a block group.
 *
 * ```txt
 * (State Code)━━┳┓   ┏┳┳┳┳┳━━(Tract Code)
 *               060133740002###
 *                 ┗╋┛      ┗━(Block Group Code)
 *            (County Code)
 * ```
 *
 * @category Census
 * @category FIPS
 * @type string
 * @pattern ^\d{1}$
 * @minLength 1
 * @maxLength 1
 * @title FIPS Block Group Code
 * @see {@linkcode FIPSBlockCode} for a more specific level.
 * @see {@linkcode FIPSTractCode} for a less specific level.
 */
export type FIPSBlockGroupCode = Tagged<string, "FIPSBlockGroupCode">

/**
 * A 6-digit number assigned by the Census to uniquely identify a tract.
 *
 * ```txt
 * (State Code)━━┳┓   ┏┳┳┳┳┳━━(Tract Code)
 *               06013374000####
 *                 ┗╋┛
 *            (County Code)
 * ```
 *
 * @category Census
 * @category FIPS
 * @type string
 * @pattern ^\d{6}$
 * @minLength 6
 * @maxLength 6
 * @title FIPS Tract Code
 * @see {@linkcode FIPSBlockGroupCode} for a more specific level.
 * @see {@linkcode FIPSCountySubDivisionCode} for a less specific level.
 */
export type FIPSTractCode = Tagged<string, "FIPSTractCode">

/**
 * An 11-digit number assigned by the Census to uniquely identify a tract.
 *
 * ```txt
 * (State Code)━━┳┓   ┏┳┳┳┳┳━━(Tract Code)
 *               06013374000####
 *                 ┗╋┛
 *            (County Code)
 * ```
 *
 * @category Census
 * @category FIPS
 * @type string
 * @pattern ^\d{6}$
 * @minLength 6
 * @maxLength 6
 * @title FIPS Tract Geo ID
 * @see {@linkcode FIPSBlockCode} for the 4-digit version.
 */
export type FIPSTractGeoID = Tagged<string, "FIPSTractGeoID">

/**
 * A 5-digit number assigned by the Census to uniquely identify a county sub-division.
 *
 * ```txt
 * (State Code)━━┳┓   ┏┳┳┳┳━━(County Sub-Division Code)
 *               0601337400#####
 *                 ┗╋┛
 *            (County Code)
 * ```
 *
 * @category Census
 * @category FIPS
 * @type string
 * @pattern ^\d{5}$
 * @minLength 5
 * @maxLength 5
 * @title FIPS County Sub-Division Code
 * @see {@linkcode FIPSTractCode} for a more specific level.
 * @see {@linkcode FIPSCountyCode} for a less specific level.
 */
export type FIPSCountySubDivisionCode = Tagged<string, "FIPSCountySubDivisionCode">

/**
 * A 3-digit number assigned by the Census to uniquely identify a county.
 *
 * ```txt
 * (State Code)━━┳┓
 *               06013##########
 *                 ┗┻┻━(County Code)
 * ```
 *
 * @category Census
 * @category FIPS
 * @type string
 * @pattern ^\d{3}$
 * @minLength 3
 * @maxLength 3
 * @title FIPS County Code
 * @see {@linkcode FIPSCountySubDivisionCode} for a more specific level.
 * @see {@linkcode AdminLevel1Code} for a less specific level.
 */
export type FIPSCountyCode = Tagged<string, "FIPSCountyCode">

/**
 * A 5-digit number assigned by the Census to uniquely identify a place.
 *
 * ```txt
 * (State Code)━━┳┓
 *               4835000########
 *                 ┗┻┻┻┻━(Place Code)
 * ```
 *
 * @category Census
 * @category FIPS
 * @type string
 * @minLength 5
 * @maxLength 5
 * @pattern ^\d{5}$
 * @title FIPS Place Code
 */
export type FIPSPlaceCode = Tagged<string, "FIPSPlaceCode">

/**
 * A 2-digit number assigned by the Census to uniquely identify a congressional district.
 *
 * ```txt
 * (State Code)━━┳┓
 *               0902···········
 *                 ┗┻━(Congressional District Code)
 * ```
 *
 * @category Census
 * @category FIPS
 * @type string
 * @pattern ^\d{2}$
 * @minLength 2
 * @maxLength 2
 * @title FIPS Congressional District Code
 * @see {@linkcode AdminLevel1Code} for a less specific level.
 * @see {@linkcode FIPSPlaceCode} for a more specific level.
 */
export type FIPSCongressionalDistrictCode = Tagged<string, "FIPSConressionalDistrictCode">

//#endregion

//#region GeoID Parsing Setup

/**
 * A part of a GeoID to it's respective name.
 *
 * @internal
 */
export enum GeoIDPart {
	/**
	 * The state code part of a GeoID.
	 *
	 * Sometimes considered the administrative area level 1 code.
	 */
	State = "state_code",
	/**
	 * The county code part of a GeoID.
	 *
	 * Sometimes considered the administrative area level 2 code.
	 */
	County = "county_code",
	/**
	 * The county subdivision code part of a GeoID.
	 *
	 * Sometimes considered the administrative area level 3 code.
	 */
	CountySubDivision = "county_sub_division_code",
	/**
	 * The congressional district code part of a GeoID.
	 */
	CongressionalDistrict = "congressional_district_code",
	/**
	 * A place as defined by the Census, such as a city or town.
	 */
	Place = "place_code",
	/**
	 * The tract code part of a GeoID. The third most granular part.
	 */
	Tract = "tract_code",
	/**
	 * The block group code part of a GeoID. The second most granular part.
	 */
	BlockGroup = "block_group_code",
	/**
	 * The block code part of a GeoID. The most granular part.
	 */
	Block = "block_code",
}

/**
 * Mapping of GeoID parts to their respective FIPS codes types.
 *
 * @internal
 */
export type GeoIDPartMapping = {
	[GeoIDPart.State]: FIPSStateCode
	[GeoIDPart.County]: FIPSCountyCode
	[GeoIDPart.CountySubDivision]: FIPSCountySubDivisionCode
	[GeoIDPart.CongressionalDistrict]: FIPSCongressionalDistrictCode
	[GeoIDPart.Place]: FIPSPlaceCode
	[GeoIDPart.Tract]: FIPSTractCode
	[GeoIDPart.BlockGroup]: FIPSBlockGroupCode
	[GeoIDPart.Block]: FIPSBlockCode
}

/**
 * Record of GeoID parts and their respective lengths.
 *
 * Note that the length of a GeoID is the sum of the lengths of its parts.
 *
 * @internal
 */
export const GeoIDPartLength = {
	[GeoIDPart.State]: 2,
	[GeoIDPart.County]: 3,
	[GeoIDPart.CountySubDivision]: 5,
	[GeoIDPart.CongressionalDistrict]: 2,
	[GeoIDPart.Place]: 5,
	[GeoIDPart.Tract]: 6,
	[GeoIDPart.BlockGroup]: 1,
	[GeoIDPart.Block]: 4,
} as const satisfies Record<GeoIDPart, number>

/**
 * A GeoID parsed to the block level. The most granular level.
 *
 * @title Parsed GeoID Block Level
 * @public
 * @requires {@linkcode AdminLevel1Code}
 */
export interface ParsedGeoIDBlockLevel {
	[GeoIDPart.State]: FIPSStateCode
	[GeoIDPart.County]: FIPSCountyCode
	[GeoIDPart.CountySubDivision]: FIPSCountySubDivisionCode
	[GeoIDPart.Tract]: FIPSTractCode
	[GeoIDPart.Place]: FIPSPlaceCode
	[GeoIDPart.BlockGroup]: FIPSBlockGroupCode
	[GeoIDPart.Block]: FIPSBlockCode
	[GeoIDPart.BlockGroup]: FIPSBlockGroupCode
	[GeoIDPart.CongressionalDistrict]: FIPSCongressionalDistrictCode
}

/**
 * A GeoID parsed to the block group level. The second most granular level.
 *
 * @internal
 */
export type ParsedGeoIDBlockGroupLevel = {
	[GeoIDPart.State]: AdminLevel1Code
	[GeoIDPart.County]: FIPSCountyCode
	[GeoIDPart.CountySubDivision]: FIPSCountySubDivisionCode
	[GeoIDPart.Tract]: FIPSTractCode
	[GeoIDPart.BlockGroup]: FIPSBlockGroupCode
	[GeoIDPart.Block]: undefined
}

/**
 * A GeoID parsed to the tract level. The third most granular level.
 *
 * @internal
 */
export type ParsedGeoIDTractLevel = {
	[GeoIDPart.State]: AdminLevel1Code
	[GeoIDPart.County]: FIPSCountyCode
	[GeoIDPart.CountySubDivision]: FIPSCountySubDivisionCode
	[GeoIDPart.Tract]: FIPSTractCode
	[GeoIDPart.BlockGroup]: undefined
	[GeoIDPart.Block]: undefined
}

/**
 * A GeoID parsed to a partial level.
 *
 * @internal
 */
export type ParsedGeoIDPartial = { [P in GeoIDPart]?: string }

/**
 * A GeoID parsed to the county-subdivision level. The fourth most granular level.
 *
 * @internal
 */
export type ParsedGeoIDCountySubDivisionLevel = {
	[GeoIDPart.State]: AdminLevel1Code
	[GeoIDPart.County]: FIPSCountyCode
	[GeoIDPart.CountySubDivision]: FIPSCountySubDivisionCode
	[GeoIDPart.Tract]: undefined
	[GeoIDPart.BlockGroup]: undefined
	[GeoIDPart.Block]: undefined
}

/**
 * A GeoID parsed to the county level. The fifth most granular level.
 *
 * @internal
 */
export type ParsedGeoIDCountyLevel = {
	[GeoIDPart.State]: AdminLevel1Code
	[GeoIDPart.County]: FIPSCountyCode
	[GeoIDPart.CountySubDivision]: undefined
	[GeoIDPart.Tract]: undefined
	[GeoIDPart.BlockGroup]: undefined
	[GeoIDPart.Block]: undefined
}

/**
 * A GeoID parsed to the state level. The least granular level.
 *
 * @internal
 */
export type ParsedGeoIDStateLevel = {
	[GeoIDPart.State]: AdminLevel1Code
	[GeoIDPart.County]: undefined
	[GeoIDPart.CountySubDivision]: undefined
	[GeoIDPart.Tract]: undefined
	[GeoIDPart.BlockGroup]: undefined
	[GeoIDPart.Block]: undefined
}

/**
 * A GeoID parsed to a specific level.
 *
 * @internal
 */
export type ParsedGeoID =
	| ParsedGeoIDBlockLevel
	| ParsedGeoIDBlockGroupLevel
	| ParsedGeoIDTractLevel
	| ParsedGeoIDCountySubDivisionLevel
	| ParsedGeoIDCountyLevel
	| ParsedGeoIDStateLevel

export class GeoIDParsingError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "GeoIDParsingError"
	}
}

//#endregion

//#region GeoID Input Matchers

export class GeoIDInputMatcher<T extends GeoIDPart[]> {
	public pattern: RegExp

	public components: T

	/**
	 * The specific length of a valid GeoID input.
	 */
	public length: number

	constructor(...geoIDComponents: T) {
		this.components = geoIDComponents
		this.length = 0

		const matchedGroups = this.components.map((component) => {
			const groupLength = GeoIDPartLength[component]
			this.length += groupLength

			return `(\\d{${groupLength}})`
		})

		this.pattern = new RegExp("^" + matchedGroups.join(""))
	}

	public parse<R extends ParsedGeoIDPartial>(input: string) {
		const match = input.match(this.pattern)

		if (!match) return null

		const result = {} as R

		for (let i = 0; i < this.components.length; i++) {
			result[this.components[i]!] = match[i + 1]!
		}

		return result as R
	}

	public test(input: string) {
		return this.pattern.test(input)
	}
}

/**
 * Record of GeoID input matchers, i.e. a pattern and parser for each grouping of GeoID components.
 *
 * @internal
 * @see {@linkcode GeoIDComponentMatchers} for the component-level matchers.
 */
export const GeoIDInputMatchers = {
	[GeoIDPart.Block]: new GeoIDInputMatcher(
		// ---
		GeoIDPart.State,
		GeoIDPart.County,
		GeoIDPart.Tract,
		GeoIDPart.Block
	),
	[GeoIDPart.BlockGroup]: new GeoIDInputMatcher(
		// ---
		GeoIDPart.State,
		GeoIDPart.County,
		GeoIDPart.Tract,
		GeoIDPart.BlockGroup
	),
	[GeoIDPart.Tract]: new GeoIDInputMatcher(
		// ---
		GeoIDPart.State,
		GeoIDPart.County,
		GeoIDPart.Tract
	),
	[GeoIDPart.Place]: new GeoIDInputMatcher(
		// ---
		GeoIDPart.State,
		GeoIDPart.County,
		GeoIDPart.Place
	),
	[GeoIDPart.CountySubDivision]: new GeoIDInputMatcher(
		// ---
		GeoIDPart.State,
		GeoIDPart.County,
		GeoIDPart.CountySubDivision
	),

	[GeoIDPart.County]: new GeoIDInputMatcher(
		// ---
		GeoIDPart.State,
		GeoIDPart.County
	),
	[GeoIDPart.CongressionalDistrict]: new GeoIDInputMatcher(
		// ---
		GeoIDPart.State,
		GeoIDPart.CongressionalDistrict
	),
	[GeoIDPart.State]: new GeoIDInputMatcher(GeoIDPart.State),
} as const satisfies Record<GeoIDPart, GeoIDInputMatcher<any>>

/**
 * A record of GeoID component matchers, i.e. a pattern and parser for each GeoID component.
 *
 * @internal
 * @see {@linkcode GeoIDInputMatchers} for the input-level matchers.
 */
const GeoIDComponentMatchers = Object.fromEntries(
	Object.values(GeoIDPart).map((value) => {
		return [value, new GeoIDInputMatcher(value)]
	})
) as Record<GeoIDPart, GeoIDInputMatcher<any>>

/**
 * Type-predicate for checking if a value appears to be a valid GeoID component.
 */
export function isGeoIDComponent<T extends GeoIDPart>(component: T, input: unknown): input is GeoIDPartMapping[T] {
	if (!input) return false
	if (typeof input !== "string") return false

	const matcher = GeoIDComponentMatchers[component]

	return matcher.test(input)
}

//#endregion

//#region GeoID Parsing

/**
 * GeoID input matchers sorted by length in descending order, such that the most specific matchers
 * are first.
 */
const OrderedGeoIDInputMatchers = Object.values(GeoIDInputMatchers).sort((a, b) => b.length - a.length)

/**
 * Given a block GeoID, parse it into its components.
 *
 * @category Census
 * @category FIPS
 */
export function parseFIPSBlockGeoID(input: FIPSBlockGeoID): ParsedGeoIDBlockLevel {
	const parsedBlock = GeoIDInputMatchers[GeoIDPart.Block].parse(input)!
	const { congressional_district_code } = GeoIDInputMatchers[GeoIDPart.CongressionalDistrict].parse(input)!
	const { county_sub_division_code } = GeoIDInputMatchers[GeoIDPart.CountySubDivision].parse(input)!

	const block_group_code = parsedBlock.block_code!.slice(0, 1) as FIPSBlockGroupCode

	const parsed: { [P in keyof ParsedGeoIDBlockLevel]?: string } = {
		...parsedBlock,
		congressional_district_code,
		county_sub_division_code,
		block_group_code,
	}

	return parsed as ParsedGeoIDBlockLevel
}

/**
 * Given a tract GeoID, parse it into its components.
 *
 * @category Census
 * @category FIPS
 */
export function parseFIPSTractGeoID(input: FIPSTractGeoID): ParsedGeoIDTractLevel {
	const parsedTract = GeoIDInputMatchers[GeoIDPart.Tract].parse<ParsedGeoIDTractLevel>(input)!
	const { county_sub_division_code } = GeoIDInputMatchers[GeoIDPart.CountySubDivision].parse(input)!

	const parsed: { [P in keyof ParsedGeoIDTractLevel]?: string } = {
		...parsedTract,
		[GeoIDPart.CountySubDivision]: county_sub_division_code!,
	}

	return parsed as ParsedGeoIDTractLevel
}

/**
 * Given a GeoID, parse it into its components.
 *
 * @category Census
 * @category FIPS
 */
export function parseGeoID(input: FIPSBlockGeoID): ParsedGeoIDBlockLevel
export function parseGeoID(input: FIPSBlockGroupCode): ParsedGeoIDBlockGroupLevel
export function parseGeoID(input: FIPSTractCode): ParsedGeoIDTractLevel
export function parseGeoID(input: FIPSCountySubDivisionCode): ParsedGeoIDCountySubDivisionLevel
export function parseGeoID(input: FIPSCountyCode): ParsedGeoIDCountyLevel
export function parseGeoID(input: AdminLevel1Code): ParsedGeoIDStateLevel
export function parseGeoID(input: unknown): ParsedGeoID | null
export function parseGeoID(input: unknown): ParsedGeoID | null {
	if (!input) return null

	if (typeof input === "number") input = input.toString()
	if (typeof input !== "string") return null

	if (input.length === GeoIDInputMatchers[GeoIDPart.Block].length) {
		return parseFIPSBlockGeoID(input as FIPSBlockGeoID)
	}

	if (input.length === GeoIDInputMatchers[GeoIDPart.Tract].length) {
		return parseFIPSTractGeoID(input as FIPSTractGeoID)
	}

	for (const matcher of OrderedGeoIDInputMatchers) {
		// Do we even have a chance of matching?
		if (matcher.length !== input.length) continue

		const match = matcher.parse(input) as ParsedGeoID | null

		if (!match) continue

		Object.assign(match, {
			toJSON: () => match,
		})

		return match as any
	}

	return null
}

//#endregion

//#region GeoID Formatting

/**
 * Format a parsed block GeoID back into a string.
 *
 * @category Census
 * @category FIPS
 */
export function formatGeoID(input: ParsedGeoIDBlockLevel): FIPSBlockGeoID
/**
 * Format a parsed GeoID back into a string.
 *
 * @category Census
 * @category FIPS
 */
export function formatGeoID(input: ParsedGeoIDPartial): string
export function formatGeoID(input: unknown): string | null {
	if (!input || typeof input !== "object") return null

	const {
		// ---
		block_code,
		block_group_code,
		tract_code,
		state_code,
		county_sub_division_code,
		county_code,
	} = input as ParsedGeoIDPartial

	if (block_code) {
		return `${state_code}${county_code}${tract_code}${block_code}`
	}

	if (block_group_code) {
		return `${state_code}${county_code}${tract_code}${block_group_code}`
	}

	if (tract_code) {
		return `${state_code}${county_code}${tract_code}`
	}

	if (county_sub_division_code) {
		return `${state_code}${county_code}${county_sub_division_code}`
	}

	if (county_code) {
		return `${state_code}${county_code}`
	}

	if (state_code) return state_code

	return null
}

//#endregion
