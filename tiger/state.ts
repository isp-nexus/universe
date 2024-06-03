/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { GeoFeature, MultiPolygonLiteral } from "@isp.nexus/spatial"
import { GeoIDPart } from "./geoid.js"
import { TIGERTabulatedBlockProperties } from "./tabulation-block.js"

//#region FIPS Codes

/**
 * FIPS codes for US States.
 *
 * @category FIPS
 * @category States
 * @category Census
 * @see {@linkcode FIPSTerritoryCode} for territories.
 * @see {@linkcode AdminLevel1Code} for a combined set of states and territories.
 */
export enum FIPSStateCode {
	/** @title Alabama */
	AL = "01",

	/** @title Alaska */
	AK = "02",

	/** @title Arizona */
	AZ = "04",

	/** @title Arkansas */
	AR = "05",

	/** @title California */
	CA = "06",

	/** @title Colorado */
	CO = "08",

	/** @title Connecticut */
	CT = "09",

	/** @title Delaware */
	DE = "10",

	/** @title District Of Columbia */
	DC = "11",

	/** @title Florida */
	FL = "12",

	/** @title Georgia */
	GA = "13",

	/** @title Hawaii */
	HI = "15",

	/** @title Idaho */
	ID = "16",

	/** @title Illinois */
	IL = "17",

	/** @title Indiana */
	IN = "18",

	/** @title Iowa */
	IA = "19",

	/** @title Kansas */
	KS = "20",

	/** @title Kentucky */
	KY = "21",

	/** @title Louisiana */
	LA = "22",

	/** @title Maine */
	ME = "23",

	/** @title Maryland */
	MD = "24",

	/** @title Massachusetts */
	MA = "25",

	/** @title Michigan */
	MI = "26",

	/** @title Minnesota */
	MN = "27",

	/** @title Mississippi */
	MS = "28",

	/** @title Missouri */
	MO = "29",

	/** @title Montana */
	MT = "30",

	/** @title Nebraska */
	NE = "31",

	/** @title Nevada */
	NV = "32",

	/** @title New Hampshire */
	NH = "33",

	/** @title New Jersey */
	NJ = "34",

	/** @title New Mexico */
	NM = "35",

	/** @title New York */
	NY = "36",

	/** @title North Carolina */
	NC = "37",

	/** @title North Dakota */
	ND = "38",

	/** @title Ohio */
	OH = "39",

	/** @title Oklahoma */
	OK = "40",

	/** @title Oregon */
	OR = "41",

	/** @title Pennsylvania */
	PA = "42",

	/** @title Rhode Island */
	RI = "44",

	/** @title South Carolina */
	SC = "45",

	/** @title South Dakota */
	SD = "46",

	/** @title Tennessee */
	TN = "47",

	/** @title Texas */
	TX = "48",

	/** @title Utah */
	UT = "49",

	/** @title Vermont */
	VT = "50",

	/** @title Virginia */
	VA = "51",

	/** @title Washington */
	WA = "53",

	/** @title West Virginia */
	WV = "54",

	/** @title Wisconsin */
	WI = "55",

	/** @title Wyoming */
	WY = "56",
}

/**
 * FIPS codes for US Territories.
 *
 * @category FIPS
 * @category Territories
 * @category Census
 * @minLength 2
 * @maxLength 2
 * @see {@linkcode FIPSStateCode} for states.
 * @see {@linkcode AdminLevel1Code} for a combined set of states and territories.
 */
export enum FIPSTerritoryCode {
	/**
	 * @title Johnston Atoll
	 */
	JA = "74",

	/** @title American Samoa */
	AS = "60",

	/** @title Guam */
	GU = "66",

	/** @title Northern Mariana Islands */
	MP = "69",

	/** @title Puerto Rico */
	PR = "72",

	/** @title Virgin Islands */
	VI = "78",
}

/**
 * A combined set of FIPS codes for US States and Territories.
 *
 * @category FIPS
 * @category States
 * @category Territories
 * @category Census
 * @minLength 2
 * @maxLength 2
 * @public
 * @see {@linkcode FIPSStateCode} for states.
 * @see {@linkcode FIPSTerritoryCode} for territories.
 */
export const AdminLevel1Code = {
	...FIPSStateCode,
	...FIPSTerritoryCode,
} as const

export type AdminLevel1Code = FIPSStateCode | FIPSTerritoryCode

const FIPSStateCodeToAbbreviation = Object.fromEntries(
	Object.entries(FIPSStateCode).map(([name, code]) => [code, name])
) as Record<FIPSStateCode, StateAbbreviation>

const FIPSTerritoryCodeToAbbreviation = Object.fromEntries(
	Object.entries(FIPSTerritoryCode).map(([name, code]) => [code, name])
) as Record<FIPSTerritoryCode, TerritoryAbbreviation>

/**
 * A combined set of FIPS codes for US States and Territories.
 *
 * Maps FIPS codes to their respective two-letter abbreviations.
 */
export const AdminLevel1CodeToAbbreviation = {
	...FIPSStateCodeToAbbreviation,
	...FIPSTerritoryCodeToAbbreviation,
} as Record<AdminLevel1Code, AdminLevel1Abbreviation>

/**
 * Type-predicate to determine if a given string is a valid state FIPS code.
 */
export function isStateFIPSCode(code: string | null | undefined): code is FIPSStateCode {
	if (!code || typeof code !== "string") return false

	return Object.hasOwn(FIPSStateCodeToAbbreviation, code)
}

/**
 * Type-predicate to determine if a given string is a valid territory FIPS code.
 */
export function isTerritoryFIPSCode(code: string | null | undefined): code is FIPSTerritoryCode {
	if (!code || typeof code !== "string") return false

	return Object.hasOwn(FIPSTerritoryCodeToAbbreviation, code)
}

/**
 * Type-predicate to determine if a given string is a valid state-level FIPS code.
 *
 * This includes both states and territories.
 */
export function isAdminLevel1FIPSCode(code: string | null | undefined): code is AdminLevel1Code {
	return isStateFIPSCode(code) || isTerritoryFIPSCode(code)
}

//#endregion

//#region State Abbreviation

/**
 * Two-letter abbreviations of a US states.
 *
 * @minLength 2
 * @maxLength 2
 * @public
 */
export enum StateAbbreviation {
	"Alaska" = "AK",
	"Alabama" = "AL",
	"Arkansas" = "AR",
	"Arizona" = "AZ",
	"California" = "CA",
	"Colorado" = "CO",
	"Connecticut" = "CT",
	"District of Columbia" = "DC",
	"Delaware" = "DE",
	"Florida" = "FL",
	"Georgia" = "GA",
	"Hawaii" = "HI",
	"Iowa" = "IA",
	"Idaho" = "ID",
	"Illinois" = "IL",
	"Indiana" = "IN",
	"Kansas" = "KS",
	"Kentucky" = "KY",
	"Louisiana" = "LA",
	"Massachusetts" = "MA",
	"Maryland" = "MD",
	"Maine" = "ME",
	"Michigan" = "MI",
	"Minnesota" = "MN",
	"Missouri" = "MO",
	"Mississippi" = "MS",
	"Montana" = "MT",
	"North Carolina" = "NC",
	"North Dakota" = "ND",
	"Nebraska" = "NE",
	"New Hampshire" = "NH",
	"New Jersey" = "NJ",
	"New Mexico" = "NM",
	"Nevada" = "NV",
	"New York" = "NY",
	"Ohio" = "OH",
	"Oklahoma" = "OK",
	"Oregon" = "OR",
	"Pennsylvania" = "PA",
	"Rhode Island" = "RI",
	"South Carolina" = "SC",
	"South Dakota" = "SD",
	"Tennessee" = "TN",
	"Texas" = "TX",
	"Utah" = "UT",
	"Virginia" = "VA",
	"Vermont" = "VT",
	"Washington" = "WA",
	"Wisconsin" = "WI",
	"West Virginia" = "WV",
	"Wyoming" = "WY",
}

export enum TerritoryAbbreviation {
	"American Samoa" = "AS",
	"Johnston Atoll" = "JA",
	"Guam" = "GU",
	"Virgin Islands" = "VI",
	"Northern Mariana Islands" = "MP",
	"Puerto Rico" = "PR",
}

/**
 * Two-letter abbreviations of a US states and territories.
 *
 * @minLength 2
 * @maxLength 2
 * @public
 */
export type AdminLevel1Abbreviation = StateAbbreviation | TerritoryAbbreviation

export const AdminLevel1Abbreviation = {
	...StateAbbreviation,
	...TerritoryAbbreviation,
} as const

//#endregion

//#region State Name

/**
 * US State abbreviations to their full names.
 *
 * @public
 */
export enum StateName {
	AS = "American Samoa",
	AK = "Alaska",
	AL = "Alabama",
	AR = "Arkansas",
	AZ = "Arizona",
	CA = "California",
	CO = "Colorado",
	CT = "Connecticut",
	DC = "District of Columbia",
	DE = "Delaware",
	FL = "Florida",
	GA = "Georgia",
	HI = "Hawaii",
	IA = "Iowa",
	ID = "Idaho",
	IL = "Illinois",
	IN = "Indiana",
	JA = "Johnston Atoll",
	KS = "Kansas",
	KY = "Kentucky",
	LA = "Louisiana",
	MA = "Massachusetts",
	MD = "Maryland",
	ME = "Maine",
	MI = "Michigan",
	MN = "Minnesota",
	MO = "Missouri",
	MS = "Mississippi",
	MT = "Montana",
	NC = "North Carolina",
	ND = "North Dakota",
	NE = "Nebraska",
	NH = "New Hampshire",
	NJ = "New Jersey",
	NM = "New Mexico",
	NV = "Nevada",
	NY = "New York",
	OH = "Ohio",
	OK = "Oklahoma",
	OR = "Oregon",
	PA = "Pennsylvania",
	PR = "Puerto Rico",
	RI = "Rhode Island",
	SC = "South Carolina",
	SD = "South Dakota",
	TN = "Tennessee",
	TX = "Texas",
	UT = "Utah",
	VA = "Virginia",
	VT = "Vermont",
	WA = "Washington",
	WI = "Wisconsin",
	WV = "West Virginia",
	WY = "Wyoming",
	VI = "Virgin Islands",
	MP = "Northern Mariana Islands",
	GU = "Guam",
}

//#endregion

//#region State Utilities

/**
 * Predicate for checking if a string is a proper abbreviation for a US State or territory, rather
 * than a random 2-letter string.
 *
 * @see {@link isStateAbbreviation} for a specific check for US States.
 * @see {@link isStateTerritoryAbbreviation} for a specific check for US Territories.
 */
export function isStateLevelAbbreviation(input: unknown): input is AdminLevel1Abbreviation {
	if (typeof input !== "string") return false

	return Object.hasOwn(FIPSStateCode, input) || Object.hasOwn(FIPSTerritoryCode, input)
}

/**
 * Predicate for checking if a string is a proper abbreviation for a US State, rather than a random
 * 2-letter string.
 *
 * @see {@link isStateLevelAbbreviation} for a general check for US States and Territories.
 * @see {@link isStateTerritoryAbbreviation} for a specific check for US Territories.
 */
export function isStateAbbreviation(input: unknown): input is StateAbbreviation {
	if (typeof input !== "string") return false

	return Object.hasOwn(FIPSStateCode, input)
}

/**
 * Predicate for checking if a string is a proper abbreviation for a US Territory, rather than a
 * random 2-letter string.
 *
 * @see {@link isStateLevelAbbreviation} for a general check for US States and Territories.
 * @see {@link isStateAbbreviation} for a specific check for US States.
 */
export function isStateTerritoryAbbreviation(input: unknown): input is AdminLevel1Abbreviation {
	if (typeof input !== "string") return false

	return Object.hasOwn(FIPSTerritoryCode, input)
}

/**
 * Common case variations of a US State or Territory name.
 *
 * @internal
 */
export type StateNameVariation = StateName | Lowercase<StateName> | Uppercase<StateName>

/**
 * Details about a US State or Territory.
 *
 * @title US State Details
 */
export interface StateDetails {
	/**
	 * Two-letter abbreviation of the state or territory.
	 *
	 * @title Abbreviation
	 */
	abbreviation: AdminLevel1Abbreviation
	/**
	 * Full name of the state or territory.
	 *
	 * @title Name
	 */
	displayName: StateName
	/**
	 * The FIPS code for the state or territory.
	 *
	 * @title FIPS Code
	 */
	FIPSCode: string
	/**
	 * The ANSI code for the state or territory.
	 *
	 * @title ANSI Code
	 */
	ANSICode: string
}

/**
 * A US state as defined by the Census Bureau's TIGER system.
 *
 * @title Census TIGER State
 * @public
 *
 * @requires {@linkcode AdminLevel1Abbreviation}
 * @requires {@linkcode StateName}
 * @requires {@linkcode AdminLevel1Code}
 */
export interface TIGERState {
	/**
	 * The two-letter abbreviation of a US state.
	 *
	 * @title State Abbreviation
	 */
	abbreviation: AdminLevel1Abbreviation

	/**
	 * The state's name.
	 *
	 * @title State Name
	 */
	displayName: StateName

	/**
	 * The state's FIPS code.
	 *
	 * @title State FIPS Code
	 */
	[GeoIDPart.State]: AdminLevel1Code

	/**
	 * The geometry of the tabulated block, typically a polygon, but may be a multi-polygon for blocks
	 * with holes, or islands.
	 *
	 * @title Geometry
	 */
	GEOM: MultiPolygonLiteral
}

export type TIGERStateFeature = GeoFeature<MultiPolygonLiteral, TIGERTabulatedBlockProperties>

//#endregion
