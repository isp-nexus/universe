/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { LayerSpecification } from "maplibre-gl"
import { labelsWithCustomTheme, noLabelsWithCustomTheme } from "protomaps-themes-base"
import { BuildingLayers } from "../base/buildings.js"
import { NexusBaseTheme, NexusBaseTileSetID } from "../base/theme.js"
import { LayerID } from "../styles/layers.js"
import { HillshadeTileSetID } from "./terrain.js"

export const HillsLayerID = LayerID(HillshadeTileSetID, "hills")

export const BaseLayers: LayerSpecification[] = [
	...noLabelsWithCustomTheme(NexusBaseTileSetID, NexusBaseTheme),
	{
		id: LayerID(NexusBaseTileSetID, "water-outline"),
		type: "line",
		source: NexusBaseTileSetID,
		"source-layer": "water",
		filter: ["any", ["in", "water", "river", "lake", "other"]],
		paint: {
			"line-color": "hsl(194deg 100% 30% / 0.5)",
			"line-width": 1,
		},
	},
	{
		id: HillsLayerID,
		type: "hillshade",
		source: HillshadeTileSetID,
		paint: {
			"hillshade-exaggeration": 0.25,
			"hillshade-accent-color": "hsl(240deg 100% 95%)",
			"hillshade-shadow-color": "hsl(240deg 100% 5%)",
		},
	},
	...BuildingLayers,
	...labelsWithCustomTheme(NexusBaseTileSetID, NexusBaseTheme),
]
