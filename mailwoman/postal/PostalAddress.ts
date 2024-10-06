/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Describes the properties of a postal delivery address.
 */

import { JSONSchemaID, TemporalProperties } from "@isp.nexus/core"
import type { GeometryLiteral, GooglePlaceID, H3Cell, MultiPolygonLiteral, PointLiteral } from "@isp.nexus/spatial"
import type { AdminLevel1Abbreviation, ParsedGeoID } from "@isp.nexus/tiger"
import type { PointOfContact } from "../contacts/PointOfContact.js"
import type { PostalAddressID } from "./codex.js"
import type { DirectionalAbbreviation } from "./directional.js"
import type { SanitizedPostalAddress } from "./sanitize.js"
import type { USPSStandardSuffixAbbreviation } from "./suffix.js"
import type { ZipCode, ZipCodePlusFour } from "./zipcode.js"

//#region Address Parts

/**
 * A part of a postal address to it's respective name.
 *
 * @internal
 */
export enum PostalAddressPart {
	/**
	 * The preferred address, i.e. the address that should be used for mail.
	 */
	FormattedAddress = "formatted_address",
	/**
	 * A normalized address that can be used for geocoding.
	 */
	SanitizedAddress = "sanitized_address",
	CountryCode = "country_code",
	/**
	 * A country code or two-letter abbreviation of a US state.
	 */
	AdminLevel1 = "admin_level1",
	// AdminLevel2 = "admin_level2",
	// AdminLevel3 = "admin_level3",
	PostalCode = "postal_code",
	Locality = "locality",
	StreetName = "street_name",
	DirectionalAbbreviation = "directional_abbreviation",
	StreetSuffixAbbreviation = "street_suffix_abbreviation",
	StreetNumber = "street_number",
	RangeFirst = "range_first",
	RangeLast = "range_last",
	SecondaryAddressDesignator = "secondary_address_designator",
	PostalFloor = "postal_floor",
	POBox = "po_box",
	GooglePlaceID = "google_place_id",
	PlusCode = "plus_code",
	FabricID = "fabric_id",
	Accuracy = "accuracy",
	H3Cell = "h3_cell",
}

//#endregion

//#region Delivery Address

export const $PostalAddress = JSONSchemaID("PostalAddress")
export type $PostalAddress = typeof $PostalAddress

/**
 * Describes the properties of a postal delivery address.
 *
 * Note that while this is tailored to USPS addresses, it can be used for other postal services,
 * with varying degrees of success.
 *
 * @category Postal
 * @title Postal Address
 * @public
 * @requires {@linkcode PointLiteral}
 * @requires {@linkcode DirectionalAbbreviation}
 * @requires {@linkcode AdminLevel1Abbreviation}
 * @requires {@linkcode StateName}
 * @requires {@linkcode AdminLevel1Code}
 * @requires {@linkcode USPSStandardSuffixAbbreviation}
 */
export interface PostalAddress extends TemporalProperties {
	/**
	 * The schema URL of the Postal Address.
	 *
	 * @ignore
	 */
	$schema: $PostalAddress["url"]

	//#region Table Columns

	/**
	 * The unique identifier of the postal address, derived from the address components.
	 *
	 * @type string
	 * @format uuid
	 * @title Postal Address ID
	 */
	id: PostalAddressID

	/**
	 * The points of contact associated with the postal address, if any.
	 *
	 * @title Points of Contact
	 */
	pointsOfContact?: PointOfContact[]

	//#endregion

	//#region Address Components

	/**
	 * The canonical address, as determined by a geocoding service.
	 *
	 * @example 123 Main Street, Apt 1, San Francisco, California 94103, USA
	 *
	 * @title Formatted Address
	 * @maxLength 255
	 */
	[PostalAddressPart.FormattedAddress]: string

	/**
	 * The formatted mail delivery address.
	 *
	 * @example 123 MAIN ST, APT 1, SAN FRANCISCO, CA 94103
	 *
	 * @title Formatted Address
	 * @maxLength 255
	 */
	[PostalAddressPart.SanitizedAddress]: SanitizedPostalAddress

	/**
	 * The two-letter abbreviation of a US state.
	 *
	 * @title Country
	 */
	[PostalAddressPart.CountryCode]?: string

	/**
	 * The two-letter abbreviation of a US state.
	 *
	 * @title State Abbreviation
	 */
	[PostalAddressPart.AdminLevel1]?: AdminLevel1Abbreviation

	/**
	 * The ZIP code portion of the address.
	 *
	 * @title ZIP Code
	 */
	[PostalAddressPart.PostalCode]?: ZipCode | ZipCodePlusFour | string

	/**
	 * The city, town, village, or other locale portion of the address.
	 *
	 * @example San Francisco, New York, Los Angeles
	 *
	 * @title Locality
	 * @maxLength 255
	 */
	[PostalAddressPart.Locality]?: string

	/**
	 * The name portion of the road.
	 *
	 * @example Main, Elm, Maple
	 *
	 * @title Street Name
	 * @maxLength 255
	 */
	[PostalAddressPart.StreetName]?: string

	/**
	 * The 8 directional abbreviations accepted by the USPS.
	 *
	 * @example N, NE, E, SE, S, SW, W, NW
	 *
	 * @title Directional Abbreviation
	 * @maxLength 2
	 */

	[PostalAddressPart.DirectionalAbbreviation]?: DirectionalAbbreviation

	/**
	 * The standard abbreviation of the street's suffix portion of the address.
	 *
	 * @example ST, AVE, BLVD, RD
	 *
	 * @title Street Suffix Abbreviation
	 * @maxLength 255
	 */
	[PostalAddressPart.StreetSuffixAbbreviation]?: USPSStandardSuffixAbbreviation

	/**
	 * The house number portion of the address.
	 *
	 * @example 123, 456, 789
	 *
	 * @title Street Number
	 * @maxLength 255
	 */
	[PostalAddressPart.StreetNumber]?: string

	/**
	 * The first number of the address range, such as the beginning of a block.
	 *
	 * @example 100, 200, 300
	 *
	 * @type integer
	 * @title Range First
	 */
	[PostalAddressPart.RangeFirst]?: number

	/**
	 * The last number of the address range, such as the end of a block.
	 *
	 * @example 199, 299, 399
	 *
	 * @type integer
	 * @title Range Last
	 */
	[PostalAddressPart.RangeLast]?: number

	/**
	 * Present when the address is a secondary unit, i.e. an apartment, suite, or unit.
	 *
	 * @example Apt 1, Suite 2, Unit 3
	 *
	 * @title Secondary Address Designator
	 * @maxLength 255
	 */

	[PostalAddressPart.SecondaryAddressDesignator]?: string

	/**
	 * Present when the floor of the address is specified.
	 *
	 * @example Floor 1, 2nd Floor, 3rd Floor, Basement
	 *
	 * @title Floor
	 * @maxLength 255
	 */
	[PostalAddressPart.PostalFloor]?: string

	/**
	 * Present for PO Box addresses.
	 *
	 * @example PO Box 123, P.O. Box 456
	 *
	 * @title PO Box
	 * @maxLength 255
	 */
	[PostalAddressPart.POBox]?: string

	//#endregion

	//#region Geographic Identifiers

	/**
	 * A place ID provided by Google's geocoding API.
	 *
	 * Note that while place IDs are unique, they are not stable over time. This means that the same
	 * place ID may refer to a different location at a later date.
	 *
	 * @title Google Place ID
	 * @maxLength 255
	 * @see {@link https://developers.google.com/maps/documentation/geocoding/intro#place_id Google Place ID}
	 */
	[PostalAddressPart.GooglePlaceID]?: GooglePlaceID

	/**
	 * A Plus Codes is a location-based digital addressing system that covers the entire world,
	 * allowing people to refer to any location on the Earth.
	 *
	 * @title Plus Code
	 * @maxLength 255
	 * @see {@link https://maps.google.com/pluscodes/learn/  Plus Code Documentation}
	 */
	[PostalAddressPart.PlusCode]?: string | null

	/**
	 * FCC Broadband serviable location ID.
	 *
	 * @title Broadband Servicable Location ID
	 */
	[PostalAddressPart.FabricID]?: number

	/**
	 * The H3 cell associated with the address, typically at resolution 15.
	 *
	 * @title H3 Cell
	 */
	[PostalAddressPart.H3Cell]?: H3Cell

	/**
	 * The Census GEO ID associated with the address, if any.
	 *
	 * @type string
	 * @title Census Geo ID
	 */
	GEOID?: string

	/**
	 * The geographic coordinates of the address.
	 *
	 * @title Geographic Coordinates
	 */
	GEOM: PointLiteral

	/**
	 * The footprint of the address, if any.
	 *
	 * @title Footprint
	 */
	FOOTPRINT?: MultiPolygonLiteral | null

	/**
	 * The accuracy of the postal address determined during geocoding.
	 *
	 * @title Postal Address Accuracy
	 */
	[PostalAddressPart.Accuracy]?: PostalAddressAccuracy | null

	//#endregion
}

/**
 * Accuracy of the postal address, i.e. how precise the address is.
 *
 * @title Postal Address Accuracy
 */
export enum PostalAddressAccuracy {
	/**
	 * RoofTop accuracy, i.e. the most precise.
	 */
	RoofTop = 10,
	/**
	 * Range Interpolated accuracy, i.e. interpolated between two points.
	 */
	RangeInterpolated = 20,
	/**
	 * Geometric Center accuracy, i.e. the center of the address.
	 */
	GeometricCenter = 30,
	/**
	 * Approximate accuracy, i.e. the least precise.
	 */
	Approximate = 40,
}

export interface PostalAddressFeature {
	type: "Feature"

	/**
	 * UUID derived from the address components.
	 *
	 * @format uuid
	 */
	id: string

	properties: Omit<PostalAddress, "id" | "GEOM"> & Partial<NonNullable<ParsedGeoID>>

	geometry: GeometryLiteral
}

export function castToPostalAddressFeature(postalAddress: PostalAddress): PostalAddressFeature {
	const { id, GEOM, ...properties } = postalAddress

	if (!GEOM) throw new Error(`Postal address ${id} must have a geometry.`)

	const postalFeature: PostalAddressFeature = {
		type: "Feature",
		id,
		geometry: GEOM,
		properties,
	}

	return postalFeature
}

//#endregion
