/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { WorkerRoute } from "../routing.js"
import { TileMetadataRoute, TileRoute } from "./tile.js"

//#region Tile Retrieval

export const BroadbandProviderTileRoute = WorkerRoute.GET(
	"/providers/:providerID(\\d+)/:stateCode(\\d+)/:tileSetName([a-z0-9_\\-]+)/:z(\\d+)/:x(\\d+)/:y(\\d+).:fileExtension([a-z0-9]+)",
	async ({ params, ...context }) => {
		const { providerID, stateCode, tileSetName } = params

		return TileRoute.handler({
			...context,
			params: {
				...params,
				tileSetName: `providers/${providerID}/${stateCode}/${tileSetName}`,
			},
		})
	}
)

//#endregion

//#region Metadata Lookup

export const BroadbandProviderTileMetadataRoute = WorkerRoute.GET(
	"/providers/:providerID(\\d+)/:stateCode(\\d+)/:tileSetName([a-z0-9_\\-]+).json",
	async ({ params, ...context }) => {
		const { providerID, stateCode, tileSetName } = params

		return TileMetadataRoute.handler({
			...context,
			params: {
				...params,
				tileSetName: `providers/${providerID}/${stateCode}/${tileSetName}`,
			},
		})
	}
)

//#endregion
