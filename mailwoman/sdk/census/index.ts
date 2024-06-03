/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { omitNullable, pluckResponseData } from "@isp.nexus/core"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import {
	$PostalAddress,
	type DirectionalAbbreviation,
	type PostalAddress,
	PostalAddressPart,
	type SanitizedPostalAddress,
	type USPSStandardSuffixAbbreviation,
	type ZipCode,
	type ZipCodePlusFour,
	createPostalAddressID,
	parseFormattedAddress,
	sanitizePostalAddress,
} from "@isp.nexus/mailwoman"
import { GeoPoint, type InternalPointCoordinates } from "@isp.nexus/spatial"
import {
	type AdminLevel1Abbreviation,
	AdminLevel1Code,
	type FIPSBlockCode,
	type FIPSBlockGeoID,
	type FIPSBlockGroupCode,
	type FIPSCountyCode,
	type FIPSTractCode,
	type LandWaterBlockType,
	type LegalStatisticalAreaDescription,
	type TIGERClassCode,
	type TIGERFunctionalStatus,
	type TIGERGeographicClassification,
} from "@isp.nexus/tiger"
import Axios, { AxiosInstance, isAxiosError } from "axios"

export interface TigerLineMetadata {
	/**
	 * The side of the street, i.e. left or right.
	 */
	side: "L" | "R"
	/**
	 * The TIGER/Line ID.
	 *
	 * @pattern ^\d{8}$
	 */
	tigerLineId: string
}

export enum SpatialBenchmarkName {
	/**
	 * @title Public Address Ranges - Current Benchmark
	 */
	Current = "Public_AR_Current",
	/**
	 * @title Public Address Ranges - ACS2023 Benchmark
	 */
	ACS2023 = "Public_AR_ACS2023",
	/**
	 * @title Public Address Ranges - Census 2020 Benchmark
	 */
	Census2020 = "Public_AR_Census2020",
}

/**
 * The metadata for a spatial benchmark.
 */
export interface SpatialBenchmarkMetadata {
	/**
	 * A numerical ID or name that references what version of the locator should be searched. This
	 * generally corresponds to MTDB data which is benchmarked twice yearly.
	 */
	id: string
	/**
	 * The benchmark name.
	 */
	benchmarkName: SpatialBenchmarkName
	/**
	 * The benchmark description.
	 */
	benchmarkDescription: string

	/**
	 * Whether the benchmark is the default.
	 */
	isDefault: boolean
}

enum CensusGeocoderVintageName {
	Current = "Current_Current",
	Census2020 = "Census2020_Census2020",
}

export interface GeographyVintageMetadata {
	/**
	 * The vintage ID.
	 */
	id: string

	/**
	 * The vintage name.
	 */
	vintageName: CensusGeocoderVintageName

	/**
	 * The vintage description.
	 */
	vintageDescription: string

	/**
	 * Whether the vintage is the default.
	 */
	isDefault: boolean
}

export interface CensusGeocoderAddressComponents {
	/**
	 * The two-letter abbreviation of a US state.
	 */
	state: AdminLevel1Abbreviation

	/**
	 * The name of the street, without any pre or suffix types.
	 *
	 * @example SILVER HILL , "MAIN", "WILLOW GLEN"
	 */
	streetName: string

	/**
	 * The prefix type
	 */
	preType: string

	/**
	 * The abbreviation preceding the street name, e.g. "ST", "AVE", "BLVD", etc.
	 *
	 * @see {@linkcode lookupStreetSuffix} for more information.
	 */
	suffixType: USPSStandardSuffixAbbreviation

	/**
	 * An abbreviation following the street name that indicates the directional taken by the
	 * thoroughfare or the sector where it is located.
	 *
	 * For example: “123 N MAIN ST E”, the Street Suffix Direction would be “E”.
	 */
	suffixDirection: DirectionalAbbreviation

	/**
	 * A word or phrase in a complete street name that follows and modifies the name but is separated
	 * from it by a street suffix-type, street suffix direction and/or street suffix type.
	 *
	 * For example: “123 East End Avenue Extended”, the Street Suffix Qualifier would be the word
	 * “Extended”.
	 */
	suffixQualifier: string

	/**
	 * The city of the address. Typically referred to as "locality" in other address formats.
	 */
	city: string

	/**
	 * The ZIP code of the address.
	 */
	zip: ZipCode | ZipCodePlusFour
	/**
	 * A word or phrase in a complete street name that precedes and modifies the street name, but is
	 * separated from it by a street name, street pre-type, or a street predirectional or both.
	 *
	 * For example: “123 Old Main St”, the Street Pre-qualifier would be “Old”.
	 */
	preQualifier: string

	/**
	 * Start of TIGER address range.
	 */
	fromAddress: string

	/**
	 * End of TIGER address range.
	 */
	toAddress: string
}

export interface CensusGeocoderAddressMatch {
	/**
	 * The formatted address as it was matched.
	 *
	 * The matched address is based on where the submitted address falls along a Tigerline.
	 */
	matchedAddress: PostalAddressPart.FormattedAddress
	/**
	 * The address components.
	 */
	addressComponents: CensusGeocoderAddressComponents
	/**
	 * The TIGER/Line metadata.
	 */
	tigerLine: TigerLineMetadata
	/**
	 * The coordinates of the address.
	 */
	coordinates: InternalPointCoordinates
}

/**
 * @title TIGER Block Group
 * @public
 * @requires {@linkcode AdminLevel1Code}
 */
export interface CensusGeocoderTIGERBlock {
	/**
	 * Land Area in square meters.
	 *
	 * @title Land Area
	 * @minimum 0
	 */

	AREALAND: number
	/**
	 * Water Area in square meters.
	 *
	 * @title Water Area
	 * @minimum 0
	 */
	AREAWATER: number
	/**
	 * @title Base Name
	 *
	 * The base name of the block.
	 */
	BASENAME: FIPSBlockCode
	/**
	 * @title Block Group Code
	 */
	BLKGRP: FIPSBlockGroupCode
	/**
	 * @title Block Code
	 */
	BLOCK: FIPSBlockCode
	/**
	 * @title Center Latitude
	 */
	CENTLAT: string
	/**
	 * @title Center Longitude
	 */
	CENTLON: string
	/**
	 * @title County FIPS Code
	 */
	COUNTY: FIPSCountyCode
	/**
	 * Functional Status.
	 *
	 * @title Functional Status
	 * @minLength 1
	 * @maxLength 1
	 * @pattern ^[A-Z]$
	 */
	FUNCSTAT: TIGERFunctionalStatus
	/**
	 * @title FIPS Block GeoID
	 */
	GEOID: FIPSBlockGeoID
	/**
	 * @title Total Households
	 * Total number of households in the blockgroup
	 */
	HU100: number
	/**
	 * @title Internal Point Latitude
	 */
	INTPTLAT: string
	/**
	 * @title Internal Point Longitude
	 */
	INTPTLON: string
	/**
	 * Legal/Statistical Area Description.
	 *
	 * @title Legal/Statistical Area Description
	 */
	LSADC: LegalStatisticalAreaDescription
	/**
	 * @title Land/Water Block Type
	 *
	 * Whether the block is land or water.
	 */
	LWBLKTYP: LandWaterBlockType
	/**
	 * @title MAF/TIGER Feature Class Code.
	 */
	MTFCC: TIGERClassCode
	/**
	 * @title Block Name
	 */
	NAME: string
	/**
	 * @title Object ID
	 *
	 * The unique identifier for the block.
	 */
	OBJECTID: number
	/**
	 * @title MAF/TIGER Object Identifier
	 *
	 * The unique identifier for the block.
	 */
	OID: string
	/**
	 * @title Population
	 *
	 * Total population in the blockgroup.
	 */
	POP100: number
	STATE: AdminLevel1Code
	/**
	 * @title Block Suffix
	 *
	 * The block suffix.
	 */
	SUFFIX: string
	TRACT: FIPSTractCode
	/**
	 * @title Urban/Rural
	 */
	UR: TIGERGeographicClassification
}

export interface CensusGeocoderGeographyMatch extends CensusGeocoderAddressMatch {
	geographies: {
		"Census Blocks": CensusGeocoderTIGERBlock[]
	}
}

export interface CensusGeocoderOneLineResponseBody {
	input: {
		address: string
		benchmark: SpatialBenchmarkMetadata
	}
	result: {
		addressMatches: CensusGeocoderAddressMatch[]
	}
}

export interface GeocodeAddressComponents {
	/**
	 * @title Formatted One-Line Address
	 */
	address?: string | null
	/**
	 * @title Street Name
	 */
	street?: string | null
	/**
	 * @title City (Locality)
	 */
	city?: string | null
	/**
	 * @title State Abbreviation
	 */
	state?: AdminLevel1Abbreviation | null
	/**
	 * @title ZIP Code
	 */
	zip?: ZipCode | ZipCodePlusFour | null
}

export type CensusGeocoderInput = PostalAddress | string

interface LookupAddressParams extends GeocodeAddressComponents {
	benchmark: SpatialBenchmarkName
	vintage: CensusGeocoderVintageName
}

export interface CensusGeocoderAddressResponseBody {
	input: {
		address: GeocodeAddressComponents | string
		benchmark: SpatialBenchmarkMetadata
	}
	result: {
		addressMatches: CensusGeocoderAddressMatch[]
	}
}

export interface CensusGeocoderGeographyResponseBody {
	input: {
		address: GeocodeAddressComponents | string
		benchmark: SpatialBenchmarkMetadata
	}
	result: {
		addressMatches: CensusGeocoderGeographyMatch[]
	}
}

/**
 * The base URL for the FCC Broadband Data Collection API.
 *
 * @internal
 */
export const FCCGeocoderBaseURL = "https://geo.fcc.gov/api/census/"

export class CensusGeocoderError extends Error {
	override name = "CensusGeocoderError"
}

export class CensusGeocoder {
	static readonly BaseURL = "https://geocoding.geo.census.gov/geocoder/"
	static readonly OneLineAddressPathname = "/locations/onelineaddress"
	static readonly AddressComponentsPathname = "/locations/address"
	#axios: AxiosInstance
	#logger = ConsoleLogger.withPrefix("Census Geocoder")

	constructor() {
		this.#axios = Axios.create({
			baseURL: CensusGeocoder.BaseURL,
			timeout: 5000,
		})
	}

	public lookupAddress = async (input: CensusGeocoderInput) => {
		this.#logger.info(`Geocoding address components...`)

		const params: LookupAddressParams = {
			benchmark: SpatialBenchmarkName.Current,
			vintage: CensusGeocoderVintageName.Current,
		}

		let pathname: string

		if (typeof input === "string") {
			input = sanitizePostalAddress(input)

			if (input.startsWith("PO BOX")) {
				return parseFormattedAddress(input as SanitizedPostalAddress)
			}

			pathname = CensusGeocoder.OneLineAddressPathname
			params.address = input
		} else {
			pathname = CensusGeocoder.AddressComponentsPathname
			params.city = input.locality
			params.street = input[PostalAddressPart.StreetName]
			params.state = input[PostalAddressPart.AdminLevel1]
			params.zip = input[PostalAddressPart.PostalCode] as ZipCode
		}

		return this.#axios
			.get<CensusGeocoderAddressResponseBody>(pathname, {
				params: {
					...omitNullable(params),
					format: "json",
				},
			})
			.then(pluckResponseData)
			.then((data) => {
				const [firstMatch] = data.result.addressMatches

				if (!firstMatch) {
					throw new CensusGeocoderError(`No address match for ${JSON.stringify(params)}`)
				}

				const formattedAddress = firstMatch.matchedAddress
				const sanitizedAddress = sanitizePostalAddress(formattedAddress)

				const GEOM = new GeoPoint(firstMatch.coordinates)

				const id = createPostalAddressID(GEOM, {
					sanitizedPostalAddress: sanitizedAddress,
					prefix: AdminLevel1Code[firstMatch.addressComponents.state],
				})

				const postalAddress: PostalAddress = {
					$schema: $PostalAddress.url,
					id,
					GEOM,
					[PostalAddressPart.FormattedAddress]: formattedAddress,
					[PostalAddressPart.SanitizedAddress]: sanitizedAddress,
					[PostalAddressPart.AdminLevel1]: firstMatch.addressComponents.state,
					[PostalAddressPart.PostalCode]: firstMatch.addressComponents.zip,
					[PostalAddressPart.Locality]: firstMatch.addressComponents.city,
					[PostalAddressPart.StreetName]: firstMatch.addressComponents.streetName,
					[PostalAddressPart.DirectionalAbbreviation]: firstMatch.addressComponents.suffixDirection,
					[PostalAddressPart.StreetSuffixAbbreviation]: firstMatch.addressComponents.suffixType,
				}

				this.#logger.info(`Matched address: ${firstMatch.matchedAddress}`)
				return postalAddress
			})
			.catch((error) => {
				if (isAxiosError(error)) {
					this.#logger.error(`Error geocoding address: ${error.status || error.message}`)
					this.#logger.error(error.toJSON())
				}

				throw new CensusGeocoderError(`Error geocoding address: ${error.message}`)
			})
	}

	public lookupGeography = (input: CensusGeocoderInput) => {
		this.#logger.info(`Geocoding address components...`)

		const params: LookupAddressParams = {
			benchmark: SpatialBenchmarkName.Census2020,
			vintage: CensusGeocoderVintageName.Census2020,
		}

		if (typeof input === "string") {
			params.address = input
		} else {
			params.city = input[PostalAddressPart.Locality]
			params.street = input[PostalAddressPart.StreetName]
			params.state = input[PostalAddressPart.AdminLevel1]
			params.zip = input[PostalAddressPart.PostalCode] as ZipCode
		}

		return this.#axios
			.get<CensusGeocoderGeographyResponseBody>("/geographies/address", {
				params: {
					...omitNullable(params),
					format: "json",
				},
			})
			.then(pluckResponseData)
			.then((data) => {
				const [firstMatch] = data.result.addressMatches

				if (!firstMatch) {
					throw new CensusGeocoderError(`No address match for ${JSON.stringify(params)}`)
				}

				this.#logger.info(`Matched address: ${firstMatch.matchedAddress}`)
				const formattedAddress = firstMatch.matchedAddress
				const sanitizedAddress = sanitizePostalAddress(formattedAddress)

				const GEOM = new GeoPoint(firstMatch.coordinates)

				const id = createPostalAddressID(GEOM, {
					sanitizedPostalAddress: sanitizedAddress,
					prefix: AdminLevel1Code[firstMatch.addressComponents.state],
				})

				const postalAddress: PostalAddress = {
					$schema: $PostalAddress.url,
					id,
					[PostalAddressPart.SanitizedAddress]: sanitizedAddress,
					[PostalAddressPart.FormattedAddress]: formattedAddress,
					[PostalAddressPart.AdminLevel1]: firstMatch.addressComponents.state,
					[PostalAddressPart.PostalCode]: firstMatch.addressComponents.zip,
					[PostalAddressPart.Locality]: firstMatch.addressComponents.city,
					[PostalAddressPart.StreetName]: firstMatch.addressComponents.streetName,
					[PostalAddressPart.DirectionalAbbreviation]: firstMatch.addressComponents.suffixDirection,
					[PostalAddressPart.StreetSuffixAbbreviation]: firstMatch.addressComponents.suffixType,
					GEOM: new GeoPoint(firstMatch.coordinates),
				}

				return postalAddress
			})
			.catch((error) => {
				if (isAxiosError(error)) {
					this.#logger.error(`Error geocoding geography: ${error.status || error.message}`)
					this.#logger.error(error.toJSON())
				}

				throw new CensusGeocoderError(`Error geocoding address: ${error.message}`)
			})
	}
}

/**
 * The FCC Geocoder API client.
 *
 * A singleton instance, since the FCC Geocoder API is stateless...
 */
export const CensusGeocoderService = new CensusGeocoder()
