/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { LatLng, LatLngLiteral } from "@googlemaps/google-maps-services-js"
import { tryParsingJSON } from "@isp.nexus/core"
import { convert as convertCoords } from "geo-coordinates-parser"
import { latLngToCell } from "h3-js"
import { BBox2DLiteral, BBox3DLiteral, GeoBoundingBox, isBBox } from "../bbox.js"
import { H3Cell, shortenH3Cell } from "../h3/index.js"
import { GeoObjectLiteral, GeometryType } from "../object.js"
import {
	InternalPointCoordinates,
	Coordinates2D as Point2DCoordinates,
	Coordinates3D as Point3DCoordinates,
	clampLatitude,
	inferGeoJSONCoordOrder,
	isCoordPairLiteral,
	isGoogleMapsLatLngLiteral,
	isInterpolatedCoordinates,
	wrapLongitude,
} from "../position.js"

/**
 * A JSON-serializeable single point geometry, such as a specific location, address, or longitude,
 * latitude pair.
 *
 * ```js
 * {
 * 	"type": "Point",
 * 	"coordinates": [100, 0]
 * }
 * ```
 *
 * @title Point Geometry
 * @public
 * @requires {@linkcode GeoObjectLiteral}
 */
export interface PointLiteral extends GeoObjectLiteral {
	/**
	 * Declares the type of GeoJSON object as a `Point` geometry.
	 */
	type: "Point"
	/**
	 * A pair of coordinates in the form of [longitude, latitude].
	 *
	 * @TJS-type array
	 * @TJS-items.type number
	 * @see {@linkcode Point2DCoordinates} for more information.
	 */
	coordinates: Point2DCoordinates | Point3DCoordinates
}

/**
 * Type-predicate to determine if the given input is a GeoJSON Point geometry.
 */
export function isPointLiteral(input: PointLiteral | null | undefined | unknown): input is PointLiteral {
	if (!input || typeof input !== "object") return false

	if (!("type" in input)) return false
	if (!("coordinates" in input)) return false
	if (input.type !== GeometryType.Point) return false

	return isCoordPairLiteral(input.coordinates)
}

/**
 * Common interface for Browser Geolocation API coordinates.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates MDN Web Docs}
 */
export interface GeolocationCoordinatesLike {
	latitude: number
	longitude: number
	altitude: number
}

/**
 * Type-predicate to determine if the given input appears to be a {@linkcode GeolocationCoordinates}
 * object.
 */
export function isGeolocationCoordinatesLike(input: unknown): input is GeolocationCoordinatesLike {
	if (!input || typeof input !== "object") return false

	if (!("latitude" in input)) return false
	if (!("longitude" in input)) return false
	if (!("altitude" in input)) return false

	return true
}

export type GeoPointInput =
	| PointLiteral
	| Point2DCoordinates
	| Point3DCoordinates
	| GeolocationCoordinatesLike
	| InternalPointCoordinates
	| LatLngLiteral
	| LatLng

//#region GeoPoint

/**
 * A single point geometry, such as a specific location, address, or longitude, latitude pair.
 */
export class GeoPoint implements PointLiteral {
	//#region Properties

	/**
	 * Declares the type of GeoJSON object as a `Point` geometry.
	 */
	readonly type = GeometryType.Point

	/**
	 * The bounding box literal of the GeoPoint.
	 *
	 * @see {@linkcode GeoPoint.bbox} for the actual bounding box object.
	 * @see {@linkcode GeoBoundingBox} for creating a bounding box.
	 */
	public boundingBox: GeoBoundingBox | null = null

	/**
	 * The bounding box literal of the GeoPoint.
	 *
	 * @see {@linkcode BBox2DLiteral} for 2D bounding boxes.
	 * @see {@linkcode BBox3DLiteral} for 3D bounding boxes.
	 * @see {@linkcode GeoBoundingBox} for creating a bounding box.
	 */
	public get bbox(): BBox2DLiteral | BBox3DLiteral | undefined {
		return this.boundingBox?.toJSON()
	}

	public set bbox(bbox: BBox2DLiteral | BBox3DLiteral | undefined) {
		this.boundingBox = bbox ? new GeoBoundingBox(bbox) : null
	}

	public get coordinates(): Point2DCoordinates | Point3DCoordinates {
		if (this.is3D()) {
			return [this.#longitude, this.#latitude, this.#altitude]
		}

		return [this.#longitude, this.#latitude]
	}

	public set coordinates(coords: Point2DCoordinates | Point3DCoordinates) {
		const [longitude, latitude, altitude] = coords

		this.#longitude = longitude
		this.#latitude = latitude
		this.#altitude = typeof altitude === "number" ? altitude : 0
	}

	#latitude: number = 0
	#longitude: number = 0
	#altitude: number = 0

	/**
	 * The longitude of the point in degrees, i.e. the x-coordinate.
	 *
	 * Values outside the range will be wrapped around to the opposite side of the globe.
	 *
	 * @minimum -180
	 * @maximum 180
	 */
	public get longitude(): number {
		return this.#longitude
	}

	public set longitude(value: number) {
		this.#longitude = wrapLongitude(value)
	}

	/**
	 * The latitude of the point in degrees, i.e. the y-coordinate.
	 *
	 * Values outside the range will be clamped to the poles.
	 *
	 * @minimum -90
	 * @maximum 90
	 */
	public get latitude(): number {
		return this.#latitude
	}

	public set latitude(value: number) {
		this.#latitude = clampLatitude(value)
	}

	/**
	 * The altitude of the point, i.e. the z-coordinate.
	 *
	 * This is optional and is typically measured in meters.
	 *
	 * @default 0
	 */
	public get altitude(): number {
		return this.#altitude
	}

	public set altitude(value: number) {
		this.#altitude = value
	}

	//#endregion

	//#region Constructors

	/**
	 * Create a new GeoPoint object with default coordinates.
	 */
	constructor()
	/**
	 * Create a new GeoPoint instance from another {@linkcode GeoJSONPosition} coordinates.
	 */
	constructor(
		geoJSONPosition: Point2DCoordinates | Point3DCoordinates,
		bbox?: BBox2DLiteral | BBox3DLiteral | GeoBoundingBox
	)

	/**
	 * Create a new GeoPoint instance from the browser's Geolocation API coordinates.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates MDN Web Docs}
	 */
	constructor(geoLocationCoordinates: GeolocationCoordinatesLike, bbox?: BBox2DLiteral | BBox3DLiteral | GeoBoundingBox)

	/**
	 * Creates a new GeoPoint instance from a Google Maps API
	 * {@linkcode google.maps.LatLngLiteral | LatLngLiteral} object.
	 */
	constructor(latLngLiteral: google.maps.LatLngLiteral, bbox?: BBox2DLiteral | BBox3DLiteral | GeoBoundingBox)

	/**
	 * Creates a new GeoPoint instance from internal coordinates.
	 */
	constructor(interpolatedCoords: InternalPointCoordinates, bbox?: BBox2DLiteral | BBox3DLiteral | GeoBoundingBox)
	/**
	 * Creates a new GeoPoint instance from a Google Maps API {@linkcode google.maps.LatLng | LatLng}
	 * object.
	 */
	constructor(latLng: LatLngLiteral, bbox?: BBox2DLiteral | BBox3DLiteral | GeoBoundingBox)
	/**
	 * Create a new GeoPoint instance from another {@linkcode PointLiteral}.
	 */
	constructor(geoPointJSON: PointLiteral, bbox?: BBox2DLiteral | BBox3DLiteral | GeoBoundingBox)

	/**
	 * Create a new GeoPoint instance.
	 */
	constructor(input: GeoPointInput, bbox?: BBox2DLiteral | BBox3DLiteral | GeoBoundingBox)
	constructor(input?: GeoPointInput, bbox?: BBox2DLiteral | BBox3DLiteral | GeoBoundingBox) {
		if (isCoordPairLiteral(input)) {
			if (input.length === 2) {
				this.coordinates = inferGeoJSONCoordOrder(input)
			} else {
				this.coordinates = input
			}
		} else if (isPointLiteral(input)) {
			this.coordinates = [...input.coordinates]

			if (isBBox(input.bbox)) {
				this.bbox = [...input.bbox]
			}
		} else if (isGoogleMapsLatLngLiteral(input)) {
			this.coordinates = [input.lng, input.lat]
		} else if (isGeolocationCoordinatesLike(input)) {
			this.#longitude = input.longitude
			this.#latitude = input.latitude
			this.#altitude = input.altitude || 0
		} else if (isInterpolatedCoordinates(input)) {
			this.#longitude = input.x
			this.#latitude = input.y
			this.#altitude = 0
		} else {
			this.coordinates = [0, 0]
		}

		if (isBBox(bbox)) {
			this.bbox = bbox
		}
	}

	/**
	 * Attempts to create a new GeoPoint instance from the given input.
	 */
	static from(input: unknown): GeoPoint | null {
		if (!input) return null
		if (input instanceof GeoPoint) return input

		if (typeof input === "string") {
			const coordinates = tryParsingJSON<GeoPointInput>(input) || tryParsingJSON<GeoPointInput>(`[${input}]`)

			if (coordinates) {
				input = coordinates
			}
		}

		try {
			const point = new GeoPoint(input as any)
			if (point.isNullIsland()) return null

			return point
		} catch (_error) {
			return null
		}
	}

	//#endregion

	//#region Predicates

	/**
	 * Whether the GeoPoint is 2-dimensional.
	 */
	public is2D() {
		return !this.is3D()
	}

	/**
	 * Whether the GeoPoint is 3-dimensional.
	 */
	public is3D() {
		return this.#altitude !== 0
	}

	/**
	 * Whether the GeoPoint is the null island at 0, 0.
	 */
	public isNullIsland(): boolean {
		return this.#latitude === 0 && this.#longitude === 0
	}

	//#endregion

	//#region Conversion

	public toJSON(): PointLiteral {
		return {
			type: this.type,
			coordinates: this.coordinates,
		}
	}

	public to2DCoordinates(): Point2DCoordinates {
		return [this.#longitude, this.#latitude]
	}

	public to3DCoordinates(): Point3DCoordinates {
		return [this.#longitude, this.#latitude, this.#altitude]
	}

	/**
	 * Converts the GeoPoint to a Google Maps API {@linkcode google.maps.LatLngLiteral | LatLngLiteral}
	 * object.
	 */
	public toGoogleLatLngLiteral(): google.maps.LatLngLiteral {
		return {
			lat: this.#latitude,
			lng: this.#longitude,
		}
	}

	/**
	 * Converts the GeoPoint to DMS (Degrees, Minutes, Seconds) format.
	 */
	public toDMS(): string {
		const converter = convertCoords(`${this.#latitude},${this.#longitude}`)

		return converter.toCoordinateFormat("DMS")
	}

	/**
	 * Converts the GeoPoint to a H3 short cell address.
	 */
	public toH3Cell(resolution = 15) {
		const cell = latLngToCell(this.#latitude, this.#longitude, resolution) as H3Cell

		return cell
	}

	/**
	 * Converts the GeoPoint to a H3 short cell address.
	 */
	public toH3ShortCell(resolution = 15) {
		const cell = this.toH3Cell(resolution)

		return shortenH3Cell(cell)
	}

	public toString(): string {
		return JSON.stringify(this.toJSON())
	}
	//#endregion

	public [Symbol.iterator](): Iterator<number> {
		return this.coordinates[Symbol.iterator]()
	}
}

/**
 * An array of positions for each point in the geometry.
 *
 * @see {@linkcode GeoJSONPosition} for more information.
 */
export type MultiPointPath = [...points: Array<Point2DCoordinates | Point3DCoordinates>]

/**
 * A collection of points, such as a constellation or a set of locations.
 */
export interface MultiPointLiteral extends GeoObjectLiteral {
	/**
	 * Declares the type of GeoJSON object as a `MultiPoint` geometry.
	 */
	type: "MultiPoint"
	/**
	 * An array of positions for each point in the geometry.
	 *
	 * @TJS-type array
	 * @TJS-items.type number
	 *
	 * @see {@linkcode GeoJSONPosition} for more information.
	 */
	coordinates: MultiPointPath
}
