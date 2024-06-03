/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { HillsLayerID } from "../base/layers.js"
import { LayerSpecificationListInput } from "../styles/layers.js"
import { TileSetSourceID } from "../styles/sources.js"

export const TIGERTractsTileSetID = TileSetSourceID("tiger-tracts")
export const TIGERBlocksTileSetID = TileSetSourceID("tiger-blocks")

export const TIGERLayers: LayerSpecificationListInput[] = [
	{
		afterID: HillsLayerID,
		metadata: {
			queryable: false,
		},

		id: "boundary-tracts",
		"source-layer": "tracts",
		source: TIGERTractsTileSetID,
		type: "line",
		filter: [">=", ["get", "ALAND"], 0],
		maxzoom: 9,
		paint: {
			"line-color": "white",
			"line-width": 1,

			"line-opacity": [
				// We fade out the outline at higher zoom levels
				"interpolate",
				["linear"],
				["zoom"],
				5,
				0.01,
				10,
				0.25,
			],
		},
	},

	{
		beforeID: "water",
		metadata: {
			queryable: false,
		},
		id: "boundary-blocks",
		"source-layer": "blocks",
		source: TIGERBlocksTileSetID,
		type: "line",
		filter: [">=", ["get", "ALAND"], 0],
		minzoom: 9,
		paint: {
			"line-color": "orange",
			"line-width": 1,

			"line-opacity": [
				// We fade out the outline at higher zoom levels
				"interpolate",
				["linear"],
				["zoom"],
				9,
				0.01,
				16,
				0.5,
			],
		},
	},
]
