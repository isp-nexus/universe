/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { pick } from "@isp.nexus/core"
import { printEntriesAsTable, printJSONAsTable } from "@isp.nexus/core/logging"
import { FormattedAddressParts, PostalAddress, PostalAddressPart } from "@isp.nexus/mailwoman"
import { GeoFeature, GeometryLiteral, GeoPoint, orderGeoJSONToCoordPair } from "@isp.nexus/spatial"
import jsonColorizer from "json-colorizer"

/**
 * Log a postal address as table.
 *
 * @category Logging
 */
export function printPostalAddressAsTable(postalAddress: PostalAddress, additionalProperties?: object): string {
	return printJSONAsTable({
		...pick(postalAddress, [
			PostalAddressPart.FormattedAddress,
			PostalAddressPart.SanitizedAddress,
			PostalAddressPart.GooglePlaceID,
			...FormattedAddressParts.flat(),
		]),
		...additionalProperties,
	})
}

/**
 * Log GeoJSON as table.
 *
 * @category Logging
 */
export function printGeoFeatureAsTable(feature: GeoFeature<GeometryLiteral, any>): string {
	const entries: [string, ...any][] = [["Type", `${feature.type} (Geometry: ${feature.geometry.type})`]]

	if (feature.geometry.type === "Point") {
		const point = new GeoPoint(feature.geometry)
		const coordinates = point.to2DCoordinates()

		entries.push(
			["Coordinates (DMS)", point.toDMS()],
			["Coordinates (GeoJSON)", jsonColorizer.colorize(coordinates, { indent: 0 })],
			["Coordinates (Latitude/Longitude)", jsonColorizer.colorize(orderGeoJSONToCoordPair(coordinates), { indent: 0 })]
		)
	}
	entries.push(["Properties"], ...Object.entries(feature.properties))

	return printEntriesAsTable(entries)
}
