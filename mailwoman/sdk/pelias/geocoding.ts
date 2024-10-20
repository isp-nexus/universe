/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { GeoFeature, GeoFeatureCollection, PointLiteral } from "@isp.nexus/spatial"

export type PeliasSource = "osm" | "oa" | "gn" | "wof"

export type PeliasLayer =
	| "address"
	| "borough"
	| "city"
	| "coarse"
	| "country"
	| "county"
	| "localadmin"
	| "locality"
	| "macrocounty"
	| "macroregion"
	| "neighbourhood"
	| "postalcode"
	| "region"
	| "state"
	| "street"
	| "venue"

/**
 * Geocoding parameters when querying the Pelias geocoding API with a structured query.
 *
 * @see {@link https://github.com/pelias/documentation/blob/master/structured-geocoding.md Pelias Structured Geocoding}
 */
export type PeliasStructuredGeocoderParameter = Extract<
	PeliasLayer,
	"address" | "neighbourhood" | "borough" | "locality" | "county" | "region" | "postalcode" | "country"
>

/**
 * Parsed text components from a Pelias geocoding query.
 */
export type PeliasParsedTextRecord = {
	[K in PeliasStructuredGeocoderParameter]?: string
}

export interface PeliasForwardGeocodeSearchParameters {
	/**
	 * The query string to geocode.
	 */
	text: string

	boundary?: {
		/**
		 * Limit search results be from a particular country or a list of countries.
		 *
		 * To do this, you can set the boundary.country parameter value to a comma separated list of
		 * alpha-2 or alpha-3 ISO-3166 country code.
		 */
		country?: string

		rect?: {
			min_lat: number
			max_lat: number
			min_lon: number
			max_lon: number
		}

		circle?: {
			lat: number
			lon: number
			radius: number
		}

		/**
		 * Pelias GID
		 */
		gid?: string
	}

	/**
	 * Limit the number of results returned.
	 *
	 * @default 10
	 */
	size?: number

	/**
	 * Latitude to sort results by proximity to a given location.
	 */
	focus?: {
		point: {
			lat: number
			lon: number
		}
	}

	/**
	 * Comma-separated list of sources to search.
	 */
	sources?: PeliasSource | PeliasSource[]

	/**
	 * List of layers to search.
	 */
	layers?: PeliasLayer | PeliasLayer[]
}

export interface PeliasReverseGeocodeSearchParameters {
	point: {
		lat: number
		lon: number
	}

	boundary?: {
		/**
		 * Limit search results be from a particular country or a list of countries.
		 *
		 * To do this, you can set the boundary.country parameter value to a comma separated list of
		 * alpha-2 or alpha-3 ISO-3166 country code.
		 */
		country?: string

		circle?: {
			lat: number
			lon: number
			radius: number
		}

		/**
		 * Pelias GID
		 */
		gid?: string
	}

	/**
	 * Limit the number of results returned.
	 *
	 * @default 10
	 */
	size?: number

	/**
	 * Comma-separated list of sources to search.
	 */
	sources?: PeliasSource | PeliasSource[]

	/**
	 * List of layers to search.
	 */
	layers?: PeliasLayer | PeliasLayer[]
}

export interface PeliasGeocodingEngineMetadata {
	/**
	 * Name of the engine.
	 */
	name: string

	/**
	 * Author of the engine.
	 */
	author: string

	/**
	 * Version of the engine.
	 */
	version: string
}

export interface PeliasGeocodingMetadata {
	/**
	 * Version of the geocoding API.
	 */
	version: string

	/**
	 * Attribution information.
	 *
	 * @format url
	 */
	attribution: string

	/**
	 * Query metadata.
	 */
	query: PeliasGeocodingQueryMetadata

	engine: PeliasGeocodingEngineMetadata

	/**
	 * Timestamp of the response.
	 *
	 * @format unix-time
	 */
	timestamp: number
}

export interface PeliasGeocodingQueryMetadata {
	/**
	 * Maximum number of results to query for.
	 */
	querySize: number

	/**
	 * Parser used to parse the query.
	 */
	parser: string

	/**
	 * Parsed text components.
	 */
	parsed_text: PeliasParsedTextRecord

	/**
	 * The original text query.
	 */
	text: string

	/**
	 * Maximum number of results to return.
	 */
	size: number

	/**
	 * Whether the query is private.
	 */
	private: boolean

	/**
	 * Language information.
	 */
	lang: {
		/**
		 * Name of the language.
		 */
		name: string

		/**
		 * ISO 639-1 code.
		 */
		iso6391: string

		/**
		 * ISO 639-3 code.
		 */
		iso6393: string

		/**
		 * How the language was determined.
		 */
		via: string

		/**
		 * Whether the language was defaulted.
		 */
		defaulted: boolean
	}
}

export type PeliasGeocoderAccuracy = "point" | "interpolated" | "fallback" | "centroid" | "rooftop" | "parcel"

/**
 * Properties of a Pelias geocoding feature.
 */
export interface PeliasGeocoderFeatureProperties {
	/**
	 * The level of accuracy of the geocoding result.
	 */
	accuracy: PeliasGeocoderAccuracy

	/**
	 * The confidence level of the geocoding result.
	 */
	confidence: number

	/**
	 * The continent of the geocoding result.
	 */
	continent?: string

	/**
	 * The country of the geocoding result.
	 */
	country?: string

	/**
	 * The country code of the geocoding result.
	 */
	country_code?: string

	/**
	 * The county of the geocoding result.
	 */
	county?: string

	/**
	 * The continent GID of the geocoding result.
	 */
	continent_gid?: string

	/**
	 * The country abbreviation of the geocoding result.
	 */
	country_a?: string

	/**
	 * The country GID of the geocoding result.
	 */
	country_gid?: string

	/**
	 * The county abbreviation of the geocoding result.
	 */
	county_a?: string

	/**
	 * The county GID of the geocoding result.
	 */
	county_gid?: string

	/**
	 * The house number of the geocoding result.
	 */
	housenumber?: string

	/**
	 * The Pelias GID of the geocoding result.
	 */
	gid: string

	/**
	 * The ID of the geocoding result.
	 */
	id: string

	/**
	 * The layer of the geocoding result.
	 */
	layer: string

	/**
	 * The label of the geocoding result, i.e. the formatted address.
	 */
	label?: string

	/**
	 * The locality GID of the geocoding result.
	 */
	locality_gid?: string

	/**
	 * The locality of the geocoding result.
	 */
	locality?: string

	/**
	 * The match type of the geocoding result.
	 */
	match_type?: string

	/**
	 * The name of the geocoding result.
	 */
	name?: string

	/**
	 * The postal code of the geocoding result.
	 */
	postalcode?: string

	/**
	 * The region of the geocoding result.
	 */
	region?: string

	/**
	 * The region abbreviation of the geocoding result.
	 */
	region_a?: string

	/**
	 * The region GID of the geocoding result.
	 */
	region_gid?: string

	/**
	 * The street of the geocoding result.
	 */
	street?: string

	/**
	 * The source of the geocoding result.
	 */
	source: string

	/**
	 * The source ID of the geocoding result.
	 */
	source_id: string
}

/**
 * A geocoding response from the Pelias geocoding API.
 */
export interface PeliasGeocoderFeatureCollection
	extends GeoFeatureCollection<PointLiteral, PeliasGeocoderFeatureProperties> {
	/**
	 * Metadata about the geocoding response.
	 */
	geocoding: PeliasGeocodingMetadata
}

/**
 * An individual feature from a Pelias geocoding response.
 */
export type PeliasGeocoderFeature = GeoFeature<PointLiteral, PeliasGeocoderFeatureProperties>

// export class PeliasGeocoderOperation {
// 	static readonly path = "/v1/search"

// 	static
// }
