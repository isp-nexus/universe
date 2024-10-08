/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import {
	AddressComponent,
	AddressGeometry,
	AddressType,
	GeocodeResult,
	GeocodingAddressComponentType,
	PlaceType2 as PlaceType,
} from "@googlemaps/google-maps-services-js"
import {
	createPostalAddressID,
	parseFormattedAddress,
	PostalAddress,
	PostalAddressAccuracy,
	PostalAddressPart,
	sanitizePostalAddress,
} from "@isp.nexus/mailwoman"
import { GeoPoint, GooglePlaceID } from "@isp.nexus/spatial"
import { AdminLevel1Abbreviation, AdminLevel1Code } from "@isp.nexus/tiger"

function pluckGeometryAccuracy({ location_type }: AddressGeometry): PostalAddressAccuracy | null {
	if (!location_type) return null

	if (location_type === "ROOFTOP") return PostalAddressAccuracy.RoofTop
	if (location_type === "RANGE_INTERPOLATED") return PostalAddressAccuracy.RangeInterpolated
	if (location_type === "GEOMETRIC_CENTER") return PostalAddressAccuracy.GeometricCenter
	if (location_type === "APPROXIMATE") return PostalAddressAccuracy.Approximate

	return null
}

class AddressComponentParser {
	#addressComponents = new Map<AddressType | GeocodingAddressComponentType, AddressComponent>()

	constructor(addressComponents: AddressComponent[]) {
		for (const addressComponent of addressComponents) {
			for (const addressComponentType of addressComponent.types) {
				this.#addressComponents.set(addressComponentType, addressComponent)
			}
		}
	}

	/**
	 * Retrieve the short name of the address component by its place type.
	 */
	getShortName(placeType: PlaceType): string | undefined
	/**
	 * Retrieve the short name of the address component by its geocoding address component type.
	 */
	getShortName(componentType: GeocodingAddressComponentType): string | undefined
	/**
	 * Retrieve the short name of the address component by its place type or geocoding address
	 * component type.
	 *
	 * @param type The place type or geocoding address component type.
	 */
	getShortName(type: PlaceType | GeocodingAddressComponentType) {
		return this.#addressComponents.get(type)?.short_name?.toUpperCase()
	}

	/**
	 * Retrieve the short name of the address component by its place type.
	 */
	getLongName(placeType: PlaceType): string | undefined
	/**
	 * Retrieve the short name of the address component by its geocoding address component type.
	 */
	getLongName(componentType: GeocodingAddressComponentType): string | undefined
	/**
	 * Retrieve the short name of the address component by its place type or geocoding address
	 * component type.
	 *
	 * @param type The place type or geocoding address component type.
	 */
	getLongName(type: PlaceType | GeocodingAddressComponentType) {
		return this.#addressComponents.get(type)?.long_name?.toUpperCase()
	}
}

/**
 * A USPS-compatible address parsed from a Google Geocoding API result.
 *
 * This is useful for quickly looking up address components by their type, rather than having to
 * iterate over the address components array repeatedly.
 *
 * @category Google Maps
 * @category Geocoding
 * @category Address
 * @category Postal
 */
export function parseGoogleGeocodeResult(geocodeResult: GeocodeResult): PostalAddress {
	const $ = new AddressComponentParser(geocodeResult.address_components)

	const formattedAddress = geocodeResult.formatted_address
	const sanitizedPostalAddress = sanitizePostalAddress(geocodeResult.formatted_address)
	const localParsedAddress = parseFormattedAddress(sanitizedPostalAddress)

	// const country = components.getShortName(PlaceType.country) as AdminLevel1Abbreviation,

	const adminLevel1 = $.getShortName(PlaceType.administrative_area_level_1) as AdminLevel1Abbreviation
	const locality = $.getLongName(PlaceType.locality) || $.getLongName(PlaceType.sublocality)
	const postalCode = $.getLongName(PlaceType.postal_code)
	const GEOM = new GeoPoint({
		lat: parseFloat(geocodeResult.geometry.location.lat.toPrecision(9)),
		lng: parseFloat(geocodeResult.geometry.location.lng.toPrecision(9)),
	})
	const cell = GEOM.toH3Cell()

	const id = createPostalAddressID(cell, {
		prefix: AdminLevel1Code[adminLevel1] || "ZZ",
		sanitizedPostalAddress,
	})

	const postalAddress: PostalAddress = {
		...localParsedAddress,
		id,
		GEOM: GEOM.toJSON(),
		[PostalAddressPart.H3Cell]: cell,
		[PostalAddressPart.FormattedAddress]: formattedAddress,
		[PostalAddressPart.SanitizedAddress]: sanitizedPostalAddress,

		[PostalAddressPart.GooglePlaceID]: geocodeResult.place_id as GooglePlaceID,
		[PostalAddressPart.PlusCode]: geocodeResult.plus_code?.global_code || null,
		[PostalAddressPart.Accuracy]: pluckGeometryAccuracy(geocodeResult.geometry),
		[PostalAddressPart.AdminLevel1]: adminLevel1,
		[PostalAddressPart.Locality]: locality,
		[PostalAddressPart.PostalCode]: postalCode,
		[PostalAddressPart.PostalFloor]: $.getLongName(PlaceType.floor),
		[PostalAddressPart.StreetNumber]: $.getLongName(PlaceType.street_number),
	}

	return postalAddress
}
