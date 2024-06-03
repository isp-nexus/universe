/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { GeoObjectLiteral } from "../object.js"
import { LineStringPath } from "./line-string.js"

/**
 * An array of positions forming a closed shape, such as a country or a lake.
 *
 * @example
 *
 * A polygon without holes:
 *
 * ```json
 * {
 * 	"type": "Polygon",
 * 	"coordinates": [
 * 		[
 * 			[100, 0],
 * 			[101, 0],
 * 			[101, 1],
 * 			[100, 1],
 * 			[100, 0]
 * 		]
 * 	]
 * }
 * ```
 */
export type SolidPolygonPath = [
	/**
	 * - A linear ring is a closed LineString with four or more positions.
	 * - The first and last positions are equivalent (they represent equivalent points).
	 */
	exteriorRing: LineStringPath,
]

/**
 * An array of positions forming a closed shape with holes, such as a country with islands or a lake
 * with islands.
 *
 * @example
 *
 * A polygon with holes:
 *
 * ```json
 * {
 * 	"type": "Polygon",
 * 	"coordinates": [
 * 		[
 * 			[100.0, 0.0],
 * 			[101.0, 0.0],
 * 			[101.0, 1.0],
 * 			[100.0, 1.0],
 * 			[100.0, 0.0]
 * 		],
 * 		[
 * 			[100.8, 0.8],
 * 			[100.8, 0.2],
 * 			[100.2, 0.2],
 * 			[100.2, 0.8],
 * 			[100.8, 0.8]
 * 		]
 * 	]
 * }
 * ```
 */
export type NestedPolygonPath = [
	/**
	 * - A linear ring is a closed LineString with four or more positions.
	 * - The first and last positions are equivalent (they represent equivalent points).
	 */
	exteriorRing: LineStringPath,
	/**
	 * - The interior rings are arrays of positions forming holes in the polygon.
	 */
	...interiorRings: LineStringPath[],
]

/**
 * A polygon geometry.
 *
 * @see {@linkcode PolygonLiteral} for applicable JSON schema.
 * @see {@linkcode SolidPolygonPath} for more information.
 * @see {@linkcode NestedPolygonPath} for more information.
 */
export type PolygonPath = SolidPolygonPath | NestedPolygonPath

/**
 * An array of positions forming a closed shape, such as a country or a lake.
 */
export interface PolygonLiteral<P extends PolygonPath = SolidPolygonPath> extends GeoObjectLiteral {
	/**
	 * Declares the type of GeoJSON object as a `Polygon` geometry.
	 */
	type: "Polygon"
	/**
	 * An array of positions for each point in the geometry.
	 *
	 * @TJS-type array
	 * @TJS-items.type number
	 * @see {@link https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.6 | RFC 7946 Section 3.1.6}
	 * @see {@linkcode SolidPolygonPath}
	 * @see {@linkcode NestedPolygonPath}
	 */
	coordinates: P
}

/**
 * Predicate for checking if a GeoJSON object is a `Polygon` geometry.
 */
export function isPolygonLiteral<P extends PolygonPath = PolygonPath>(input: unknown): input is PolygonLiteral<P> {
	if (typeof input !== "object" || input === null) return false

	return "type" in input && input.type === "Polygon" && "coordinates" in input && Array.isArray(input.coordinates)
}

/**
 * Predicate for checking if a polygon geometry is a solid, i.e. it has no holes.
 */
export function isSolidPolygonPath(input: PolygonLiteral): boolean {
	return input.coordinates.length === 1
}

/**
 * A collection of polygons, such as a country with islands or a lake with islands.
 */
export interface MultiPolygonLiteral<P extends PolygonPath = SolidPolygonPath> extends GeoObjectLiteral {
	type: "MultiPolygon"

	/**
	 * An array of polygons.
	 *
	 * @TJS-type array
	 * @TJS-items.type number
	 */
	coordinates: P[][]
}
/**
 * Predicate for checking if a GeoJSON object is a `MultiPolygon` geometry.
 */

/**
 * Given a polygon geometry, return an OSM filter string.
 *
 * This is useful when working with the Overpass API.
 */
export function polygonToOSMFilter(input: PolygonLiteral): string {
	if (!isPolygonLiteral(input)) return ""

	const [exteriorRing] = input.coordinates

	const filter = exteriorRing.map(([lon, lat]) => `${lat} ${lon}`).join(" ")

	return `poly:'${filter}'`
}

/**
 * Tags returned by the Overpass API for a node.
 *
 * @category OSM
 */
export enum OSMNodeTag {
	HouseNumber = "addr:housenumber",
	PostCode = "addr:postcode",
	Street = "addr:street",
	State = "addr:state",
	City = "addr:city",
	Website = "website",
	Email = "email",
	Phone = "phone",
	Shop = "shop",
	Brand = "brand",
	Cuisine = "cuisine",
	Name = "name",
	Healthcare = "healthcare",
	Office = "office",
	Amenity = "amenity",
}

export const ForbiddenResidentialOSMNodeTags: ReadonlySet<OSMNodeTag> = new Set<OSMNodeTag>([
	OSMNodeTag.Shop,
	OSMNodeTag.Brand,
	OSMNodeTag.Cuisine,
	OSMNodeTag.Office,
	OSMNodeTag.Healthcare,
])

export type OSMNodeTagRecord = Record<OSMNodeTag, string | undefined>

export interface OSMOverpassElement {
	type: "node"
	id: number
	lat: number
	lon: number
	tags: OSMNodeTagRecord
}

export interface OSMOverpassResponseBody {
	version: string
	generator: string
	osm3s: {
		timestamp_osm_base: string
		copyright: string
	}
	elements: OSMOverpassElement[]
}

/**
 * Given an OSM element, attempts to infer if the result is a residential address.
 */
export function isResidentialElement(element: OSMOverpassElement): boolean {
	for (const key in element.tags) {
		if (ForbiddenResidentialOSMNodeTags.has(key as OSMNodeTag)) return false
	}

	if (element.tags[OSMNodeTag.Amenity] === "restaurant") return false

	return true
}

export function fetchOSMElementViaOverpassAPI(input: PolygonLiteral): Promise<OSMOverpassElement[]> {
	const filter = polygonToOSMFilter(input)

	const url = new URL("http://overpass-api.de/api/interpreter")
	url.searchParams.set("data", `[out:json];(node['addr:housenumber'](${filter}););out body;>;out skel qt;`)

	return fetch(url)
		.then((response) => {
			if (!response.ok) throw ResourceError.from(response.status, response.statusText, "osm", "overpass-api", "fetch")

			return response
		})
		.then((response) => response.json() as Promise<OSMOverpassResponseBody>)
		.then((body) => body.elements)
		.catch((error) => {
			throw ResourceError.wrap(error, "osm", "overpass-api", "fetch")
		})
}
