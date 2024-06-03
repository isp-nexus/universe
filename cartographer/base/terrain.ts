/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { RasterDEMSourceSpecification } from "@maplibre/maplibre-gl-style-spec"
import { TileSetSourceID } from "../styles/sources.js"

/**
 * Creates a raster DEM source specification for terrain data.
 */
export function createTerrainDEMSource(): RasterDEMSourceSpecification {
	const terrainSource: RasterDEMSourceSpecification = {
		type: "raster-dem",
		encoding: "terrarium",
		tiles: ["https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png"],
		tileSize: 256,
		maxzoom: 15,
	}

	return terrainSource
}

/**
 * Identifier for the Nexus terrain tileset.
 */
export const TerrainTileSetID = TileSetSourceID("terrain")

/**
 * Identifier for the Nexus terrain tileset.
 */
export const HillshadeTileSetID = TileSetSourceID("hillshade")
