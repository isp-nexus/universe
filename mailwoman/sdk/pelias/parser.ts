/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { PostalAddress, PostalAddressAccuracy, PostalAddressPart, sanitizePostalAddress } from "@isp.nexus/mailwoman"
import { GeoPoint } from "@isp.nexus/spatial"
import { AdminLevel1Abbreviation } from "@isp.nexus/tiger"
import { PeliasGeocoderFeature, PeliasGeocoderFeatureProperties } from "./geocoding.js"

function pluckGeometryAccuracy({ accuracy }: PeliasGeocoderFeatureProperties): PostalAddressAccuracy | null {
	if (!accuracy) return null

	switch (accuracy) {
		case "rooftop":
			return PostalAddressAccuracy.RoofTop
		case "point":
			return PostalAddressAccuracy.RoofTop
		case "interpolated":
			return PostalAddressAccuracy.RangeInterpolated
		case "centroid":
			return PostalAddressAccuracy.GeometricCenter
		case "fallback":
			return PostalAddressAccuracy.Approximate
		case "parcel":
			return PostalAddressAccuracy.Parcel
	}

	return null
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
export function parsePeliasGeocodeResult({ geometry, properties }: PeliasGeocoderFeature): PostalAddress {
	const formattedAddress = properties.label!
	const sanitizedPostalAddress = sanitizePostalAddress(formattedAddress)

	const { region_a, locality, street, postalcode, gid, ...peliasProperties } = properties

	const GEOM = new GeoPoint(geometry.coordinates)
	const cell = GEOM.toH3Cell()

	const postalAddress: PostalAddress = {
		...peliasProperties,
		id: properties.gid,
		GEOM: GEOM?.toJSON(),
		[PostalAddressPart.H3Cell]: cell,
		[PostalAddressPart.FormattedAddress]: formattedAddress,
		[PostalAddressPart.SanitizedAddress]: sanitizedPostalAddress,
		[PostalAddressPart.StreetName]: street,
		[PostalAddressPart.Accuracy]: pluckGeometryAccuracy(properties),
		[PostalAddressPart.AdminLevel1]: region_a as AdminLevel1Abbreviation,
		[PostalAddressPart.Locality]: locality,
		[PostalAddressPart.PostalCode]: postalcode,
	}

	return postalAddress
}
