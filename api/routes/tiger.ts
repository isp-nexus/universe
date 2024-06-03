/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { WorkerRoute } from "../routing.js"
import { TileMetadataRoute, TileRoute } from "./tile.js"

//#region Tile Retrieval

export const TIGERTileRoute = WorkerRoute.GET(
	"/tiger/:stateCode(\\d+)/:tileSetName([a-zA-Z0-9_\\-]+)/:z(\\d+)/:x(\\d+)/:y(\\d+).:fileExtension([a-z0-9]+)",
	async ({ params, ...context }) => {
		const { stateCode, tileSetName } = params

		return TileRoute.handler({
			...context,
			params: {
				...params,
				tileSetName: `tiger/${stateCode}/${tileSetName}`,
			},
		})
	}
)

//#endregion

//#region Metadata Lookup

export const TIGERTileMetadataRoute = WorkerRoute.GET(
	"/tiger/:stateCode(\\d+)/:tileSetName([a-zA-Z0-9_\\-]+).json",
	async ({ params, ...context }) => {
		const { stateCode, tileSetName } = params

		return TileMetadataRoute.handler({
			...context,
			params: {
				...params,
				tileSetName: `tiger/${stateCode}/${tileSetName}`,
			},
		})
	}
)

//#endregion

// export const TIGERBlockRoute = WorkerRoute.GET(
// 	"/tiger/:stateCode(\\d+)/:tileSetName([a-zA-Z0-9_\\-]+)/:z(\\d+)/:x(\\d+)/:y(\\d+).:fileExtension([a-z0-9]+)",
// 	async ({ params, ...context }) => {
// 		const { stateCode, tileSetName } = params

// 		return TileRoute.handler({
// 			...context,
// 			params: {
// 				...params,
// 				tileSetName: `tiger/${stateCode}/${tileSetName}`,
// 			},
// 		})
// 	}
// )
