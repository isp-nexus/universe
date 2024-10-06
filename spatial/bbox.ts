/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   GeoJSON Bounding Boxes
 */

import type { PolygonLiteral, SolidPolygonPath } from "./geometries/polygon.js"
import { clampLatitude, wrapLongitude } from "./position.js"
import { CoordinateProjection } from "./projection.js"

//#region Bounding Box Literals

/**
 * A 2-dimensional rectangular area that can be determined by two longitudes and two latitudes.
 *
 * @category GeoJSON
 * @category Bounding Box
 * @see {@linkcode BBox} for additional information.
 * @see {@linkcode BBox3DLiteral} for 3-dimensional bounding boxes.
 * @see {@linkcode isBBox} for type-predicates.
 * @see {@link https://tools.ietf.org/html/rfc7946#section-5 GeoJSON Bounding Boxes}
 */
export type BBox2DLiteral = [
	/**
	 * The most western longitude (in decimal degrees) of the coordinate range.
	 *
	 * @minimum -180.0
	 * @maximum 180.0
	 */
	minLongitude: number,
	/**
	 * The most southern latitude (in decimal degrees) of the coordinate range.
	 *
	 * @minimum -90.0
	 * @maximum 90.0
	 */
	minLatitude: number,
	/**
	 * The most eastern longitude (in decimal degrees) of the coordinate range.
	 *
	 * @minimum -180.0
	 * @maximum 180.0
	 */
	maxLongitude: number,
	/**
	 * The most northern latitude (in decimal degrees) of the coordinate range.
	 *
	 * @minimum -90.0
	 * @maximum 90.0
	 */
	maxLatitude: number,
]

/**
 * A 3-dimensional rectangular area that can be determined by two longitudes, two latitudes, and two
 * altitudes.
 *
 * @category GeoJSON
 * @category Bounding Box
 * @see {@linkcode BBox} for additional information.
 * @see {@linkcode BBox2DLiteral} for a 2-dimensional bounding box.
 * @see {@link https://tools.ietf.org/html/rfc7946#section-5 GeoJSON Bounding Boxes}
 */
export type BBox3DLiteral = [
	/**
	 * The most western longitude (in decimal degrees) of the coordinate range.
	 *
	 * @minimum -180.0
	 * @maximum 180.0
	 */
	minLongitude: number,
	/**
	 * The most southern latitude (in decimal degrees) of the coordinate range.
	 *
	 * @minimum -90.0
	 * @maximum 90.0
	 */
	minLatitude: number,

	/**
	 * Altitude of the most western longitude (in decimal degrees) of the coordinate range.
	 */
	minAltitude: number,
	/**
	 * The most eastern longitude (in decimal degrees) of the coordinate range.
	 *
	 * @minimum -180.0
	 * @maximum 180.0
	 */
	maxLongitude: number,
	/**
	 * The most northern latitude (in decimal degrees) of the coordinate range.
	 *
	 * @minimum -90.0
	 * @maximum 90.0
	 */
	maxLatitude: number,

	/**
	 * Altitude of the most eastern longitude (in decimal degrees) of the coordinate range.
	 */
	maxAltitude: number,
]

//#endregion

//#region Type Predicates

/**
 * Type-predicate for 3-dimensional bounding boxes.
 *
 * This is useful when determining the type of bounding box in a GeoJSON object.
 *
 * @category GeoJSON
 * @category Bounding Box
 */
export function is2DBBox(input: unknown): input is BBox3DLiteral {
	return Array.isArray(input) && input.length === 6
}

/**
 * Type-predicate for 3-dimensional bounding boxes.
 *
 * This is useful when determining the type of bounding box in a GeoJSON object.
 *
 * @category GeoJSON
 * @category Bounding Box
 */
export function is3DBBox(input: unknown): input is BBox3DLiteral {
	return Array.isArray(input) && input.length === 6
}

/**
 * Type-predicate to determine if the given input is a bounding box.
 *
 * @category GeoJSON
 * @category Bounding Box
 */
export function isBBox(input: unknown): input is BBox2DLiteral | BBox3DLiteral {
	return Array.isArray(input) && (input.length === 4 || input.length === 6)
}

/**
 * Type-predicate to determine if the given input is a GeoBoundingBox instance.
 *
 * Note that this function only checks if the input is an instance of the GeoBoundingBox class.
 * `instanceof` checks are not reliable in JavaScript, so this function should be used with
 * caution.
 *
 * @category GeoJSON
 */
export function isGeoBoundingBox(input: unknown): input is GeoBoundingBox {
	return input instanceof GeoBoundingBox
}

//#endregion

/**
 * Input for creating a GeoBoundingBox instance.
 */
export type GeoBoundingBoxInput = BBox2DLiteral | BBox3DLiteral | GeoBoundingBox

// MARK: - GeoBoundingBox

/**
 * A bounding box to represent the coordinate range of a GeoJSON object.
 *
 * This is useful when defining the extent of a GeoJSON object, such as the minimum and maximum
 * coordinates of the object's Geometries, Features, or Feature Collections.
 */
export class GeoBoundingBox {
	//#region Properties

	public projection: CoordinateProjection

	/**
	 * The most western longitude (in decimal degrees) of the coordinate range.
	 *
	 * @minimum -180.0
	 * @maximum 180.0
	 */
	#minLongitude: number
	/**
	 * The most southern latitude (in decimal degrees) of the coordinate range.
	 *
	 * @minimum -90.0
	 * @maximum 90.0
	 */
	#minLatitude: number

	/**
	 * Altitude of the most western longitude (in decimal degrees) of the coordinate range.
	 */
	#minAltitude: number
	/**
	 * The most eastern longitude (in decimal degrees) of the coordinate range.
	 *
	 * @minimum -180.0
	 * @maximum 180.0
	 */
	#maxLongitude: number
	/**
	 * The most northern latitude (in decimal degrees) of the coordinate range.
	 *
	 * @minimum -90.0
	 * @maximum 90.0
	 */
	#maxLatitude: number

	/**
	 * Altitude of the most eastern longitude (in decimal degrees) of the coordinate range.
	 */
	#maxAltitude: number

	//#endregion

	//#region Accessors

	public get minLongitude() {
		return this.#minLongitude
	}
	public set minLongitude(value: number) {
		this.#minLongitude = wrapLongitude(value)
	}

	public get minLatitude() {
		return this.#minLatitude
	}
	public set minLatitude(value: number) {
		this.#minLatitude = clampLatitude(value)
	}

	public get maxLongitude() {
		return this.#maxLongitude
	}
	public set maxLongitude(value: number) {
		this.#maxLongitude = wrapLongitude(value)
	}

	public get maxLatitude() {
		return this.#maxLatitude
	}
	public set maxLatitude(value: number) {
		this.#maxLatitude = clampLatitude(value)
	}

	public get minAltitude() {
		return this.#minAltitude
	}
	public set minAltitude(value: number) {
		this.#minAltitude = value
	}

	public get maxAltitude() {
		return this.#maxAltitude
	}

	public set maxAltitude(value: number) {
		this.#maxAltitude = value
	}

	public get east(): number {
		return this.#maxLongitude
	}

	public set east(value: number) {
		this.#maxLongitude = wrapLongitude(value)
	}

	public get north(): number {
		return this.#maxLatitude
	}

	public set north(value: number) {
		this.#maxLatitude = clampLatitude(value)
	}

	public get south(): number {
		return this.#minLatitude
	}

	public set south(value: number) {
		this.#minLatitude = clampLatitude(value)
	}

	public get west(): number {
		return this.#minLongitude
	}

	public set west(value: number) {
		this.#minLongitude = wrapLongitude(value)
	}

	public get elevation(): number {
		return this.#maxAltitude
	}

	public set elevation(value: number) {
		this.#maxAltitude = value
	}

	public get depth(): number {
		return this.#minAltitude
	}

	public set depth(value: number) {
		this.#minAltitude = value
	}

	public [Symbol.iterator]() {
		return this.toJSON()[Symbol.iterator]()
	}

	//#endregion

	//#region Constructors

	/**
	 * Creates a blank GeoBoundingBox instance.
	 */
	constructor()
	/**
	 * Creates a new GeoBoundingBox instance from the given 2D bounding box.
	 */
	constructor(bbox: BBox2DLiteral, projection?: CoordinateProjection)

	/**
	 * Creates a new GeoBoundingBox instance from the given 3D bounding box.
	 */
	constructor(bbox: BBox3DLiteral, projection?: CoordinateProjection)

	constructor(input?: GeoBoundingBoxInput, projection?: CoordinateProjection)
	constructor(input?: GeoBoundingBoxInput, projection?: CoordinateProjection) {
		let bbox: BBox2DLiteral | BBox3DLiteral

		if (input instanceof GeoBoundingBox) {
			bbox = input.toJSON()
		} else if (isBBox(input)) {
			bbox = input
		} else {
			bbox = [0, 0, 0, 0]
		}

		const [
			// ---
			minLongitude = 0,
			minLatitude = 0,
			maxLongitude = 0,
			maxLatitude = 0,
			minAltitude = 0,
			maxAltitude = 0,
		] = bbox

		this.#minLongitude = minLongitude
		this.#minLatitude = minLatitude
		this.#maxLongitude = maxLongitude
		this.#maxLatitude = maxLatitude
		this.#minAltitude = minAltitude
		this.#maxAltitude = maxAltitude
		this.projection = projection ?? CoordinateProjection.WGS84
	}

	//#endregion

	//#region Predicates

	public is3D() {
		return this.#minAltitude !== 0 || this.#maxAltitude !== 0
	}

	public is2D() {
		return !this.is3D()
	}

	//#endregion

	//#region Conversion

	/**
	 * Converts the 2D GeoBoundingBox to an array literal.
	 */
	public toJSON2D(): BBox2DLiteral {
		return [
			// ---
			this.#minLongitude,
			this.#minLatitude,
			this.#maxLongitude,
			this.#maxLatitude,
		]
	}

	/**
	 * Converts the 3D GeoBoundingBox to an array literal.
	 */
	public toJSON3D(): BBox3DLiteral {
		return [
			// ---
			this.#minLongitude,
			this.#minLatitude,
			this.#minAltitude,
			this.#maxLongitude,
			this.#maxLatitude,
			this.#maxAltitude,
		]
	}

	public toJSON(): BBox2DLiteral | BBox3DLiteral {
		if (this.is3D()) return this.toJSON3D()

		return this.toJSON2D()
	}

	/**
	 * Converts the GeoBoundingBox to a GeoJSON Polygon, omitting the altitude.
	 */
	public to2DPolygon(): PolygonLiteral {
		const { minLatitude, maxLatitude, minLongitude, maxLongitude } = this
		const path: SolidPolygonPath = [
			[
				[minLongitude, minLatitude],
				[maxLongitude, minLatitude],
				[maxLongitude, maxLatitude],
				[minLongitude, maxLatitude],
				[minLongitude, minLatitude],
			],
		]

		return { type: "Polygon", coordinates: path }
	}

	/**
	 * Converts the GeoBoundingBox to a Well-Known-Text (WKT) string.
	 *
	 * This is useful when building Spatialite query parameters.
	 */
	public to2DEWKT(): string {
		const { minLatitude, maxLatitude, minLongitude, maxLongitude } = this

		return `SRID=${this.projection};POLYGON((${minLongitude} ${minLatitude}, ${maxLongitude} ${minLatitude}, ${maxLongitude} ${maxLatitude}, ${minLongitude} ${maxLatitude}, ${minLongitude} ${minLatitude}))`
	}

	//#endregion
}
