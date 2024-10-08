/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   This file contains types and utilities for working with geographic positions.
 */

import { LatLngLiteral } from "@googlemaps/google-maps-services-js"

/**
 * An ordered pair of coordinates in the form of [longitude, latitude].
 *
 * Note that unlike the typical order, GeoJSON coordinates are in the order of [longitude, latitude]
 * to match the order of [x, y] in Cartesian coordinates.
 *
 * @see {@linkcode Coordinates3D} for 3D coordinates.
 */
export type Coordinates2D = [
	/**
	 * The longitude of the point, i.e. the x-coordinate.
	 *
	 * @minimum -180
	 * @maximum 180
	 */
	longitude: number,
	/**
	 * The latitude of the point, i.e. the y-coordinate.
	 *
	 * @minimum -90
	 * @maximum 90
	 */
	latitude: number,
]

/**
 * Orders the given coordinates as [longitude, latitude].
 *
 * This is useful when converting into GeoJSON format.
 *
 * @category GeoJSON
 * @category Position
 */
export function orderCoordPairToGeoJSON([latitude, longitude]: [number, number]): Coordinates2D {
	return [longitude, latitude]
}

/**
 * Orders the given coordinates as [latitude, longitude].
 *
 * This is useful when converting into Google Maps format.
 *
 * @category GeoJSON
 * @category Position
 */
export function orderGeoJSONToCoordPair([longitude, latitude]: Coordinates2D): [number, number] {
	return [latitude, longitude]
}

/**
 * Given an input which appears to be reversed GeoJSON coordinates (i.e. [latitude, longitude]),
 * returns the coordinates in the correct order of [longitude, latitude].
 *
 * Note that this is a heuristic and is only accurate for North American coordinates.
 *
 * @category GeoJSON
 * @category Position
 */
export function inferGeoJSONCoordOrder([coordA, coordB]: [number, number]): Coordinates2D {
	// Latitude values typically range from -90 to 90
	const isCoordALat = coordA >= -90 && coordA <= 90
	const isCoordBLat = coordB >= -90 && coordB <= 90

	if (isCoordALat && !isCoordBLat) {
		// coordA is latitude, coordB is longitude
		return [coordB, coordA]
	}

	if (!isCoordALat && isCoordBLat) {
		// coordB is latitude, coordA is longitude
		return [coordA, coordB]
	}

	// In case both appear to be latitudes (unlikely) or longitudes (out of range for US),
	// assume coordA is longitude and coordB is latitude as default.
	return [coordA, coordB]
}

/**
 * An ordered triple of coordinates in the form of [longitude, latitude, altitude].
 *
 * @see {@linkcode Coordinates2D} for 2D coordinates.
 */
export type Coordinates3D = [
	/**
	 * The longitude of the point, i.e. the x-coordinate.
	 *
	 * @minimum -180
	 * @maximum 180
	 */
	longitude: number,
	/**
	 * The latitude of the point, i.e. the y-coordinate.
	 *
	 * @minimum -90
	 * @maximum 90
	 */
	latitude: number,
	/**
	 * The altitude of the point, i.e. the z-coordinate.
	 */
	altitude: number,
]

/**
 * A record of internal coordinates, typically used by the US Census.
 */
export type InternalPointCoordinates = {
	/**
	 * Internal Longitude (X) Coordinates
	 *
	 * @minimum -180
	 * @maximum 180
	 */
	x: number
	/**
	 * Internal Latitude (Y) Coordinates
	 *
	 * @minimum -90
	 * @maximum 90
	 */
	y: number
}

/**
 * Type-predicate to determine if the given input is a GeoJSON Point geometry.
 */
export function isCoordPairLiteral(input: unknown): input is [number, number] | [number, number, number] {
	if (!Array.isArray(input)) return false

	if (input.length !== 2 && input.length !== 3) return false

	return input.every((coord) => typeof coord === "number")
}

/**
 * Type-predicate to determine if the given input is a {@linkcode LatLngLiteral} object.
 *
 * @see {@link https://developers.google.com/maps/documentation/javascript/reference/coordinates#LatLngLiteral Google Maps API Documentation}
 */
export function isGoogleMapsLatLngLiteral(input: unknown): input is LatLngLiteral {
	if (!input || typeof input !== "object") return false

	if (!Object.hasOwn(input, "lat") || !Object.hasOwn(input, "lng")) return false

	return true
}

/**
 * Type-predicate to determine if the given input is a {@linkcode InternalPointCoordinates} object.
 */
export function isInterpolatedCoordinates(input: unknown): input is InternalPointCoordinates {
	if (!input || typeof input !== "object") return false

	if (!("x" in input)) return false
	if (!("y" in input)) return false

	return typeof input.x === "number" && typeof input.y === "number"
}

/**
 * Given a longitude value, wraps it to the range of [-180, 180].
 *
 * This is useful when normalizing longitude values.
 */
export function wrapLongitude(longitude: number): number {
	return ((((longitude + 180) % 360) + 360) % 360) - 180
}

/**
 * Given a latitude value, clamps it to the range of [-90, 90].
 *
 * This is useful when normalizing latitude values.
 */
export function clampLatitude(value: number): number {
	return Math.min(90, Math.max(-90, value))
}
