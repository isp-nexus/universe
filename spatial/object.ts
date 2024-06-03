/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { BBox2DLiteral, BBox3DLiteral, is2DBBox } from "./bbox.js"

/**
 * GeoJSON object types.
 */
export type GeometryType =
	| "Point"
	| "MultiPoint"
	| "LineString"
	| "MultiLineString"
	| "Polygon"
	| "MultiPolygon"
	| "GeometryCollection"
	| "FeatureCollection"

/**
 * Shadow enum-like record of valid GeoJSON object types.
 */
export const GeometryType = {
	Point: "Point",
	MultiPoint: "MultiPoint",
	LineString: "LineString",
	MultiLineString: "MultiLineString",
	Polygon: "Polygon",
	MultiPolygon: "MultiPolygon",
	GeometryCollection: "GeometryCollection",
	FeatureCollection: "FeatureCollection",
} as const satisfies { [K in GeometryType]: K }

/**
 * The base GeoJSON object.
 *
 * The GeoJSON specification also allows foreign members
 * (https://tools.ietf.org/html/rfc7946#section-6.1) to be included in the object.
 *
 * @title Geo Object
 * @public
 * @see {@link https://tools.ietf.org/html/rfc7946#section-3 GeoJSON Object}
 */
export interface GeoObjectLiteral {
	/**
	 * Specifies the type of GeoJSON object.
	 */
	type: GeometryType

	/**
	 * A unique identifier for the feature, such as a UUID, a serial number, or a name.
	 */
	id?: string | number | undefined | null

	/**
	 * A bounding box of the coordinate range of the object's Geometries, Features, or Feature
	 * Collections.
	 *
	 * This is useful when defining the extent of a GeoJSON object, i.e. the minimum and maximum
	 * coordinates of the object's Geometries, Features, or Feature Collections.
	 *
	 * @TJS-type array
	 * @TJS-items.type number
	 * @see {@link https://tools.ietf.org/html/rfc7946#section-5 GeoJSON Bounding Boxes}
	 */
	bbox?: BBox2DLiteral | BBox3DLiteral

	/**
	 * Coordinate reference system for GeoJSON objects.
	 *
	 * @title Coordinate Reference System
	 * @see {@link https://tools.ietf.org/html/rfc7946#section-4 Coordinate Reference Systems}
	 */
	crs?: {
		type: "name"

		properties: {
			/**
			 * The name of the coordinate reference system.
			 *
			 * @default "EPSG:4326"
			 */
			name: string
		}
	}
}

/**
 * Abstract base-class for all GeoJSON class constructors.
 */
export abstract class GeoObject implements GeoObjectLiteral {
	/**
	 * The JSON literal type of the GeoJSON object.
	 */
	abstract type: GeometryType

	/**
	 * A bounding box of the coordinate range of the object's Geometries, Features, or Feature.
	 *
	 * @see {@linkcode BBox2DLiteral} for 2-dimensional bounding boxes.
	 * @see {@linkcode BBox3DLiteral} for 3-dimensional bounding boxes.
	 * @see
	 */
	bbox?: BBox2DLiteral | BBox3DLiteral

	protected constructor(bbox?: BBox2DLiteral | BBox3DLiteral) {
		this.bbox = bbox
	}

	/**
	 * Predicate to determine if the GeoJSON object is 2-dimensional.
	 */
	public is2D() {
		return is2DBBox(this.bbox)
	}
}
