/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file FCC Broadband Data Collection System
 */

import { AdminLevel1Abbreviation, StateName } from "@isp.nexus/tiger"
import type { SnakeCase } from "type-fest"
import { BuildingTypeCode } from "./buildings.js"

/**
 * Snake_case identifier for a US State or Territory.
 *
 * @category FCC
 * @title FCC State Identifier
 */
export type FCCStateID = SnakeCase<Lowercase<StateName>>

/**
 * Code indicating confidence in the association between the textual address and the location.
 *
 * @category NTIA
 * @category FCC
 */
export enum AddressConfidenceCode {
	High = "1",
	Medium = "2",
	Low = "3",
	SuccessfulChallenge = "4",
}

/**
 * A modeled land use designation estimated from assembled county assessor information.
 *
 * @category NTIA
 * @category FCC
 */
export enum LandUseCode {
	Residential = 1,
	Land = 2,
	Business = 3,
	Unknown = 4,
	Agriculture = 5,
	Community = 6,
	Industrial = 7,
	Recreation = 8,
	Utility = 9,
	MixedUse = 10,
	Transportation = 11,
	Water = 12,
	Communications = 13,
	Row = 14,
	Wireless = 15,
	Other = 0,
}

/**
 * Flag indicating if the location is a broadband serviceable location.
 */
export enum BSLFlag {
	Serviceable = 1,
	NotServiceable = 0,
}

/**
 * Interface representing a record from the NTIA data dictionary.
 *
 * @category NTIA
 * @title NTIA Record
 */
export interface NTIARecord {
	/**
	 * Unique ID for the Fabric location. Remains persistent across versions, even if the location's
	 * position or building changes.
	 *
	 * @title Location ID
	 * @pattern ^[0-9A-Z]{1,10}$
	 */
	location_id: number

	/**
	 * Primary postal address excluding city, state, and ZIP code.
	 *
	 * @example 123 Main St
	 *
	 * @title Primary Address
	 */
	address_primary: string

	/**
	 * City name from the postal address. Also known as the locality.
	 *
	 * @example San Francisco
	 *
	 * @title City
	 */
	city: string

	/**
	 * 2-character state abbreviation from the postal address.
	 *
	 * @example CA
	 *
	 * @title State Abbreviation
	 */
	state: AdminLevel1Abbreviation

	/**
	 * 5-digit ZIP code associated with the address.
	 *
	 * @example 94103
	 *
	 * @title ZIP Code
	 */
	zip: string

	/**
	 * USPS ZIP+4 extension.
	 *
	 * @example 94103-1234
	 *
	 * @title ZIP+4
	 */
	zip_suffix?: string

	/**
	 * Estimate of the number of units at the location. Includes both residential and non-residential
	 * units.
	 *
	 * @example 10
	 *
	 * @title Unit Count
	 */
	unit_count: number

	/**
	 * Flag indicating if the location is a broadband serviceable location. 1 for serviceable, 0 for
	 * not.
	 *
	 * @example 1
	 *
	 * @title BSL Flag
	 */
	bsl_flag: BSLFlag

	/**
	 * Code indicating the type of building at the location. Can be residential (R), non-residential
	 * (B), mixed (X), group quarters (G), CAI (C), enterprise (E), or other (O).
	 *
	 * @example R
	 *
	 * @title Building Type Code
	 */
	building_type_code: BuildingTypeCode

	/**
	 * Modeled land use designation from county assessor information. Possible values range from 0
	 * (Other) to 15 (Wireless).
	 *
	 * @example 1
	 *
	 * @title Land Use Code
	 */
	land_use_code: LandUseCode | null

	/**
	 * Code indicating confidence in the association between the textual address and the location. 1 =
	 * High, 2 = Medium, 3 = Low, 4 = successful address challenge.
	 *
	 * @example 1
	 *
	 * @title Address Confidence Code
	 */
	address_confidence_code: AddressConfidenceCode

	/**
	 * 5-digit TIGER 2020 identifier for the county based on the latitude and longitude.
	 *
	 * @example 06075
	 *
	 * @title County GEOID
	 */
	county_geoid: string

	/**
	 * 15-digit 2020 U.S. Census Bureau FIPS code for the census block, based on the latitude and
	 * longitude.
	 *
	 * @example 060750001000123
	 *
	 * @title Block GEOID
	 */
	block_geoid: string

	/**
	 * H3 hex cell ID, level 9, for geospatial referencing.
	 *
	 * @example 8928308280fffff
	 *
	 * @title H3 Cell ID (9)
	 */
	h3_9: string

	/**
	 * Latitude coordinate of the location in decimal degrees. Uses WGS84 format with 5-digit
	 * precision.
	 *
	 * @example 37.774929
	 *
	 * @minimum -90
	 * @maximum 90
	 * @title Latitude
	 */
	latitude: number

	/**
	 * Longitude coordinate of the location in decimal degrees. Uses WGS84 format with 5-digit
	 * precision.
	 *
	 * @example -122.419416
	 *
	 * @minimum -180
	 * @maximum 180
	 * @title Longitude
	 */
	longitude: number

	/**
	 * FCC Fabric Release Date, present only for tier 2, 3, and 4 licensees.
	 *
	 * @example 07212023
	 *
	 * @title FCC Fabric Release Date
	 */
	fcc_rel?: string
}
