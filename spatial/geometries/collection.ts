/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file GeoJSON Geometry Collection
 */

import { GeoObjectLiteral } from "../object.js"
import { LineStringLiteral, MultiLineStringLiteral } from "./line-string.js"
import { MultiPointLiteral, PointLiteral } from "./point.js"
import { MultiPolygonLiteral, PolygonLiteral } from "./polygon.js"

/**
 * Union of the GeoJSON geometry types.
 */
export type GeometryLiteral =
	| PointLiteral
	| MultiPointLiteral
	| LineStringLiteral
	| MultiLineStringLiteral
	| PolygonLiteral
	| MultiPolygonLiteral

/**
 * A GeoJSON Geometry Collection.
 */
export interface GeometryCollection extends GeoObjectLiteral {
	/**
	 * Declares the type of GeoJSON object as a `GeometryCollection`.
	 */
	type: "GeometryCollection"
	/**
	 * An array of geometry objects.
	 */
	geometries: GeometryLiteral[]
}
