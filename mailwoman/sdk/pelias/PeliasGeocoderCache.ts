/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { HTTPCacheDataSource, HTTPCacheDataSourceOptions } from "@isp.nexus/sdk/caching/HTTPCacheDataSource"
import { PeliasGeocoderFeatureProperties } from "./geocoding.js"

export const CommonPeliasCacheColumnNames = [
	"latitude",
	"longitude",
	"api_response",
	"geojson_properties",
	"geojson_geometry",
	"cache_key",
	"created_at",
	"input_address",
	"input_latitude",
	"input_longitude",
	"input_idx",
] as const
export type CommonPeliasCacheColumnName = (typeof CommonPeliasCacheColumnNames)[number]

/**
 * The columns of the Pelias Geocoder API cache.
 */
export const GeocoderColumnNames = [
	"accuracy",
	"confidence",
	"continent",
	"country",
	"country_code",
	"county",
	"continent_gid",
	"country_a",
	"country_gid",
	"county_a",
	"county_gid",
	"housenumber",
	"gid",
	"id",
	"label",
	"layer",
	"locality_gid",
	"locality",
	"match_type",
	"name",
	"postalcode",
	"region",
	"region_a",
	"region_gid",
	"street",
	"source",
	"source_id",
] as const satisfies Array<keyof PeliasGeocoderFeatureProperties>
export type GeocoderColumnName = (typeof GeocoderColumnNames)[number]

export const PeliasCacheColumnNames = [...CommonPeliasCacheColumnNames, ...GeocoderColumnNames] as const
/**
 * The columns of the Pelias Geocoder cache.
 */
export type PeliasCacheColumnName = (typeof PeliasCacheColumnNames)[number]

export interface PeliasGeocoderCacheOptions extends HTTPCacheDataSourceOptions {
	peliasURL: string
}

/**
 * An HTTP cache enhanced for Pelias API responses.
 */
export class PeliasGeocoderCache extends HTTPCacheDataSource {
	protected existingColumns: Set<PeliasCacheColumnName> | null = null
	protected readonly peliasURL: string

	constructor({ peliasURL, ...options }: PeliasGeocoderCacheOptions) {
		super(options)

		this.peliasURL = peliasURL
	}

	protected async refreshColumnNames(): Promise<Set<PeliasCacheColumnName>> {
		const columnInfoRows = await this.tableInfo<PeliasCacheColumnName>(this.tableName)

		this.existingColumns = new Set<PeliasCacheColumnName>(columnInfoRows.map((row) => row.name))

		return this.existingColumns
	}

	protected async createGeocoderColumn(columnName: PeliasCacheColumnName, sql: string): Promise<void> {
		const existingColumns = this.existingColumns || (await this.refreshColumnNames())

		if (existingColumns.has(columnName)) return

		await this.query(/* sql */ `
			ALTER TABLE '${this.tableName}'
				ADD COLUMN '${columnName}' TEXT
				AS (${sql}) VIRTUAL;
		`)

		existingColumns!.add(columnName)

		await this.query(/* sql */ `
			CREATE INDEX IF NOT EXISTS '${this.tableName}_${columnName}_idx'	ON ${this.tableName}
				('${columnName}');
		`)
	}

	public override async ready(): Promise<this> {
		await super.ready()

		const columnSchemas: [PeliasCacheColumnName, string][] = [
			["input_idx", /* sql */ `CAST(request_headers ->> 'x-nexus-cache-idx' as INTEGER)`],
			["input_address", /* sql */ `request_params ->> 'text'`],
			["input_longitude", /* sql */ `request_params ->> 'point.lon'`],
			["input_latitude", /* sql */ `request_params ->> 'point.lat'`],

			["api_response", /* sql */ `storage_value -> 'data' -> 'data' -> 'features' -> 0`],
			["geojson_properties", /* sql */ `api_response -> 'properties'`],
			["geojson_geometry", /* sql */ `api_response -> 'geometry'`],

			["longitude", /* sql */ `CAST(geojson_geometry -> 'coordinates' ->> 0 AS REAL)`],
			["latitude", /* sql */ `CAST(geojson_geometry -> 'coordinates' ->> 1 AS REAL)`],

			["accuracy", /* sql */ `geojson_properties ->> 'accuracy'`],
			["confidence", /* sql */ `geojson_properties ->> 'confidence'`],
			["continent", /* sql */ `geojson_properties ->> 'continent'`],
			["gid", /* sql */ `geojson_properties ->> 'gid'`],
			["label", /* sql */ `geojson_properties ->> 'label'`],
			["layer", /* sql */ `geojson_properties ->> 'layer'`],
			["locality", /* sql */ `geojson_properties ->> 'locality'`],
			["match_type", /* sql */ `geojson_properties ->> 'match_type'`],
			["postalcode", /* sql */ `geojson_properties ->> 'postalcode'`],
			["region_a", /* sql */ `geojson_properties ->> 'region_a'`],
			["street", /* sql */ `geojson_properties ->> 'street'`],
		]

		for (const [columnName, sql] of columnSchemas) {
			await this.createGeocoderColumn(columnName, sql)
		}

		await this.query(/* sql */ `
			CREATE VIEW IF NOT EXISTS pelias_api AS
			SELECT
			${columnSchemas.map(([columnName]) => columnName).join(",\n")}
			FROM ${this.tableName}
		`)

		return this
	}
}
