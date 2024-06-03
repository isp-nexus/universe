/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { TileCoords, TileJSON } from "@isp.nexus/cartographer"
import { ResourceError } from "@isp.nexus/core/errors"
import { PMTiles, RangeResponse, ResolvedValueCache, TileType } from "pmtiles"
import { decompressPMTileBuffer } from "./compression.js"
import { TileTypeFileExtensionMap, TileTypeToContentType } from "./files.js"
import { R2Source, R2SourceConfig } from "./R2Source.js"

export interface ReadTileParams {
	tileCoords: TileCoords
	tileType: TileType
}

export interface TileRangeResult extends RangeResponse {
	contentType: string
}

export class CloudflareWorkerPMTiles extends PMTiles {
	/**
	 * A shared cache for resolved PMTiles values.
	 *
	 * @singleton
	 */
	static readonly SharedResolvedValueCache = new ResolvedValueCache(25, false, decompressPMTileBuffer)
	static from(sourceConfig: R2SourceConfig) {
		const source = new R2Source(sourceConfig)

		const pm = new CloudflareWorkerPMTiles(source, this.SharedResolvedValueCache, decompressPMTileBuffer)

		return pm
	}

	public async retrieveTile({ tileType, tileCoords }: ReadTileParams): Promise<TileRangeResult | null> {
		const header = await this.getHeader()

		if (header.tileType !== tileType)
			throw ResourceError.from(400, `Tile type mismatch: ${tileType} !== ${header.tileType}`)

		const [zoom, x, y] = tileCoords

		if (zoom < header.minZoom) {
			throw ResourceError.from(400, `Zoom level ${zoom} is below the minimum level of ${header.minZoom}`)
		}

		if (zoom > header.maxZoom) {
			throw ResourceError.from(404, `Zoom level ${zoom} is above the maximum level of ${header.maxZoom}`)
		}

		const range = await this.getZxy(zoom, x, y)

		if (!range) return null

		return {
			...range,
			contentType: TileTypeToContentType[header.tileType],
		}
	}

	/**
	 * Retrieve the TileJSON metadata for a tileset.
	 */
	public async retrieveTileJSON(tilesetName: string): Promise<TileJSON> {
		const [header, rawMetadata] = await Promise.all([this.getHeader(), this.getMetadata()])

		const fileExtension = TileTypeFileExtensionMap.get(header.tileType)
		const url = `https://tiles.isp.nexus/${tilesetName}/{z}/{x}/{y}.${fileExtension}`

		const { vector_layers, name, description, version, attribution } = rawMetadata as TileJSON

		return {
			tilejson: "3.0.0",
			name,
			description,
			attribution,
			scheme: "xyz",
			tiles: [url],
			version,
			bounds: [header.minLon, header.minLat, header.maxLon, header.maxLat],
			center: [header.centerLon, header.centerLat, header.centerZoom],
			minzoom: header.minZoom,
			maxzoom: header.maxZoom,
			vector_layers,
		}
	}
}
