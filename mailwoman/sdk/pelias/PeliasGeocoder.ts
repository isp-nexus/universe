/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Google Geocoding schema.
 */

import { APIClient, assertOptionalKeyPresent, flattenObject, pluckResponseData } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { PostalAddress, formatAddressFromParts } from "@isp.nexus/mailwoman"
import { HTTPCacheDataSource } from "@isp.nexus/sdk/caching/HTTPCacheDataSource"
import { $private, DataSourceFile } from "@isp.nexus/sdk/runtime"
import { GeoPoint, GeoPointInput, GooglePlaceID, H3Cell, cellToPointLiteral, isH3Cell } from "@isp.nexus/spatial"
import { AxiosRequestConfig } from "axios"
import { CacheRequestConfig } from "axios-cache-interceptor"
import { PathBuilder } from "path-ts"
import { PeliasGeocoderCache } from "./PeliasGeocoderCache.js"
import {
	PeliasForwardGeocodeSearchParameters,
	PeliasGeocoderFeatureCollection,
	PeliasReverseGeocodeSearchParameters,
} from "./geocoding.js"
import { parsePeliasGeocodeResult } from "./parser.js"

/**
 * A Google Geocoder client.
 */
export class PeliasGeocoder extends APIClient {
	public override toString(): string {
		return "Google Geocoder"
	}

	/**
	 * @internal
	 */
	protected pluckGeocodeResult = (data: PeliasGeocoderFeatureCollection): PostalAddress[] => {
		this.logger.debug(`Found ${data.features.length} results.`)

		if (!data.features.length)
			throw ResourceError.from(404, "No results found", "google", "geocoder", "pluckGeocodeResult")

		return data.features.map(parsePeliasGeocodeResult)
	}

	/**
	 * Reverse geocode a geographic point, e.g. a latitude and longitude.
	 */
	public geocodePoint(input: unknown, requestConfig?: Partial<AxiosRequestConfig>): Promise<PostalAddress[]> {
		const geoPoint = GeoPoint.from(input)

		if (!geoPoint) throw ResourceError.from(400, `Invalid input ${input}`)

		this.logger.info(`🌐 Geocoding point (${geoPoint})...`)

		const params = {
			point: {
				lat: geoPoint.latitude,
				lon: geoPoint.longitude,
			},
		} as const satisfies PeliasReverseGeocodeSearchParameters

		return this.fetch<PeliasGeocoderFeatureCollection>({
			url: "/v1/reverse",
			params: flattenObject(params),
			...(requestConfig as any),
		})
			.then(pluckResponseData)
			.then(this.pluckGeocodeResult)
			.catch((error: unknown) => {
				throw ResourceError.wrap(error, `Failed to geocode point ${geoPoint}`)
			})
	}

	public geocodeAddress(input: string | PostalAddress, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]> {
		const formattedAddress = typeof input === "string" ? input : formatAddressFromParts(input)
		const params = {
			text: formattedAddress,
		} as const satisfies PeliasForwardGeocodeSearchParameters

		this.logger.debug(`🌎 Geocoding address (${formattedAddress})...`)

		return this.fetch<PeliasGeocoderFeatureCollection>({
			url: "/v1/search",
			params: flattenObject(params),
			...(requestConfig as any),
		})
			.then(pluckResponseData)
			.then(this.pluckGeocodeResult)
			.catch((error: unknown) => {
				throw ResourceError.wrap(error, `Failed to geocode address ${formattedAddress}`)
			})
	}

	public async geocode(coordinate: GeoPointInput, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]>
	public async geocode(placeID: GooglePlaceID, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]>
	public async geocode(cell: H3Cell, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]>
	public async geocode(formattedAddress: string, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]>
	public async geocode(input: unknown, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]>
	public async geocode(input: unknown, requestConfig?: CacheRequestConfig): Promise<PostalAddress[]> {
		if (!input) throw ResourceError.from(400, "Input must be present", "geocoding", "geocode")

		if (typeof input !== "string") {
			throw ResourceError.from(400, `Invalid input ${input}`, "geocoding", "geocode")
		}
		if (isH3Cell(input)) {
			return this.geocodePoint(cellToPointLiteral(input), requestConfig)
		}

		const point = GeoPoint.from(input)
		if (point) return this.geocodePoint(input, requestConfig)

		return this.geocodeAddress(input, requestConfig)
	}
}

/**
 * Google Geocoder service, pre-configured with a runtime Google Maps API key.
 *
 * Note that while this instance may be used directly, higher-level operations are available via
 * `@isp.nexus/mailwoman/sdk`
 *
 * @singleton
 */
export const $PeliasGeocoder = ServiceRepository.register(async () => {
	const omissions = new Set(Object.values($private))

	assertOptionalKeyPresent($private, "PELIAS_SERVICE_URL")
	assertOptionalKeyPresent($private, "NEXUS_HTTP_CACHE_PATH")

	const httpCacheDataSource = await new PeliasGeocoderCache({
		peliasURL: $private.PELIAS_SERVICE_URL,
		storagePath: PathBuilder.from($private.NEXUS_HTTP_CACHE_PATH, DataSourceFile.SQLite3),
		namespace: "pelias_geocoder",
		omissions,
	}).ready()

	return new PeliasGeocoder({
		displayName: "Pelias Geocoder Service",
		axios: {
			baseURL: $private.PELIAS_SERVICE_URL,
			headers: {
				"Content-Type": "application/json",
			},
		},
		caching: {
			generateKey: HTTPCacheDataSource.generateCacheKey,

			storage: httpCacheDataSource.toAxiosStorage(),
			// We don't need to interpret the header since our cache will automatically
			// expire on outdated data.
			interpretHeader: false,
			// Addresses are unlikely to change while we're working with them,
			// so we can cache them for a week in milliseconds.
			ttl: 1000 * 60 * 60 * 24 * 7,
		},
	})
})
