/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file GeoJSON Line String
 */

import { GeoObjectLiteral } from "../object.js"
import { Coordinates2D, Coordinates3D } from "../position.js"

/**
 * An array of positions forming a line, such as a road or a path.
 */
export type LineStringPath = [...points: Array<Coordinates2D | Coordinates3D>]

/**
 * A collection of points forming a line, such as a road or a path.
 */
export interface LineStringLiteral extends GeoObjectLiteral {
	/**
	 * Declares the type of GeoJSON object as a `LineString` geometry.
	 */
	type: "LineString"
	/**
	 * An array of positions for each point in the geometry.
	 *
	 * @TJS-type array
	 * @TJS-items.type number
	 *
	 * @see {@linkcode GeoJSONPosition} for more information.
	 */
	coordinates: LineStringPath
}

/**
 * A collection of points forming a line, such as a road or a path.
 */
export interface MultiLineStringLiteral extends GeoObjectLiteral {
	/**
	 * Declares the type of GeoJSON object as a `MultiLineString` geometry.
	 */
	type: "MultiLineString"
	/**
	 * An array for each line in the geometry.
	 *
	 * @TJS-type array
	 * @TJS-items.type number
	 *
	 * @see {@linkcode GeoJSONPosition} for more information.
	 */
	coordinates: LineStringPath[]
}
