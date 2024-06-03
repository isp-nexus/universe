/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { GeometryLiteral } from "./geometries/index.js"

export interface IdentifiableGeoFeature {
	GEOID: any
}

/**
 * A feature object which contains a geometry and associated properties.
 *
 * @see https://tools.ietf.org/html/rfc7946#section-3.2
 */
export interface GeoFeature<G = GeometryLiteral, P extends {} | null = null> {
	/**
	 * Declares the type of GeoJSON object as a `Feature`.
	 */
	type: "Feature"
	/**
	 * The feature's geometry.
	 *
	 * @see {@linkcode GeometryLiteral}
	 */
	geometry: G

	/**
	 * A unique identifier for the feature, such as a UUID, a serial number, or a name.
	 */
	id: P extends IdentifiableGeoFeature ? P["GEOID"] : string | number | undefined | null

	/**
	 * Additional properties associated with a GeoJSON object.
	 */
	properties: P
}

/**
 * Given a GeoFeature type, extract its geometry type.
 */
export type ExtractGeometryType<T> = T extends GeoFeature<infer G, any> ? G : never

/**
 * Given a GeoFeature type, extract its properties type.
 */
export type ExtractPropertiesType<T> = T extends GeoFeature<any, infer P> ? P : never

/**
 * A collection of feature objects.
 */
export interface GeoFeatureCollection<G = GeometryLiteral, P extends Record<string, any> | null = Record<string, any>> {
	/**
	 * Declares the type of GeoJSON object as a `FeatureCollection`.
	 */
	type: "FeatureCollection"

	/**
	 * An array of feature objects.
	 */
	features: GeoFeature<G, P>[]
}

/**
 * Given a GeoFeature type, extract its feature collection type.
 *
 * This is useful for "collecting" features into a single collection.
 */
export type InferGeoFeatureCollection<T> =
	T extends GeoFeature<infer G, infer P>
		? GeoFeatureCollection<G, P>
		: T extends GeoFeature<infer G, infer P>[]
			? GeoFeatureCollection<G, P>
			: never

/**
 * Given a GeoFeatureCollection type, extract its feature type.
 */
export type ExtractFeatureType<T> = T extends GeoFeatureCollection<infer G, any> ? G : never

/**
 * A utility type for wrapping a {@linkcode GeoFeature} type in a {@linkcode GeoFeatureCollection}.
 */
export type CastAsFeatureCollection<T extends GeoFeature> = GeoFeatureCollection<
	ExtractGeometryType<T>,
	ExtractPropertiesType<T>
>
