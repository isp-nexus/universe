/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { APIClient, pluckResponseData } from "@isp.nexus/core"
import type { VectorSourceSpecification } from "maplibre-gl"
import type { TileSetSourceID, TileSetSourceRecord } from "../styles/sources.js"
import type { TileJSON } from "./schema.js"

/**
 * API Client for fetching Protomap tile data.
 */
export const TileAPI = new APIClient({
	displayName: "TileAPI",
	axios: {
		baseURL: "https://tiles.isp.nexus",
	},
})

export function fetchTileSetSourceSpec(
	tileSetID: TileSetSourceID
): Promise<[TileSetSourceID, VectorSourceSpecification]> {
	return TileAPI.fetch<TileJSON>({ url: `/${tileSetID}.json` })
		.then(pluckResponseData)
		.then((metadata) => {
			const sourceSpec: VectorSourceSpecification = {
				type: "vector",
				scheme: metadata.scheme,
				tiles: metadata.tiles,
				minzoom: metadata.minzoom,
				maxzoom: metadata.maxzoom,
				attribution: metadata.attribution || "OpenISP, Inc. et al.",
				bounds: metadata.bounds,
			}

			return [tileSetID, sourceSpec] as const
		})
}

export async function fetchTileSetSources(tileSetIDs: TileSetSourceID[]): Promise<TileSetSourceRecord> {
	const tileSetPromises = tileSetIDs.map(fetchTileSetSourceSpec)

	const tileSetPairs = await Promise.all(tileSetPromises)
	const tileSetSources: TileSetSourceRecord = {}

	for (const [tileSetID, sourceSpec] of tileSetPairs) {
		tileSetSources[tileSetID] = sourceSpec
	}

	return tileSetSources
}
