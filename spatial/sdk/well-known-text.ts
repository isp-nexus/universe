/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Provides functions for parsing and converting extended Well-Known text and binary data.
 */

import type { GeometryCollection, GeometryLiteral } from "@isp.nexus/spatial"
import wkx from "wkx"

/**
 * Given an extended Well-Known Binary (EWKB) buffer, parse it into a GeoJSON geometry object.
 *
 * @category Geo
 */
export function wellKnownGeometryToGeoJSON<T = GeometryLiteral>(extendedWellKnownBinary: Buffer): T
/**
 * Given an extended Well-Known-Text, parse it into a GeoJSON geometry object.
 *
 * @category Geo
 */
export function wellKnownGeometryToGeoJSON<T = GeometryLiteral>(wellKnownText: string): T
/**
 * Given an extended Well-Known-Text, parse it into a GeoJSON geometry object.
 *
 * @category Geo
 */
export function wellKnownGeometryToGeoJSON<T = GeometryLiteral>(input: Buffer | string): T
export function wellKnownGeometryToGeoJSON<T = GeometryLiteral>(input: Buffer | string) {
	return wkx.Geometry.parse(input).toGeoJSON() as T
}

/**
 * Given a GeoJSON geometry object, convert it to an well-known binary (EWKB) buffer.
 *
 * @category Geo
 * @returns A hex-encoded string representing the EWKB.
 * @returns A buffer representing the WKB.
 */
export function geometryToWKB(geometry: GeometryLiteral | GeometryCollection) {
	return wkx.Geometry.parseGeoJSON(geometry).toWkb()
}

/**
 * Given a GeoJSON geometry object, convert it to an extended well-known binary (EWKB) buffer.
 *
 * @category Geo
 * @returns A buffer representing the EWKB.
 */
export function geometryToEWKB(geometry: GeometryLiteral | GeometryCollection) {
	return wkx.Geometry.parseGeoJSON(geometry).toEwkb()
}

/**
 * Given a GeoJSON geometry object, convert it to an extended well-known binary (EWKB) buffer.
 *
 * @category Geo
 * @returns A hex-encoded string representing the EWKB.
 */
export function geometryToEWKH(geometry: GeometryLiteral | GeometryCollection) {
	return geometryToEWKB(geometry).toString("hex")
}

/**
 * Given a GeoJSON geometry object, convert it to an extended well-known text (EWKT) string.
 *
 * @category Geo
 */
export function geometryToWKT(geometry: GeometryLiteral | GeometryCollection): string {
	return wkx.Geometry.parseGeoJSON(geometry).toWkt()
}

/**
 * Given a GeoJSON geometry object, convert it to a SQL geometry string.
 *
 * This is useful for composing SQL queries that require geometry literals.
 *
 * @category Geo
 */
export function geometryToSQL<T extends GeometryLiteral | GeometryCollection>(geometry: T | null | undefined) {
	return () => {
		if (!geometry) return `NULL`

		return /* sql */ `GeomFromEWKB('${geometryToEWKH(geometry)}')`
	}
}
