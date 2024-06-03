/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

// import { FIPSBlockGeoID, ResourceError } from "@isp.nexus/core"
// import { TIGERDataService } from '@isp.nexus/sdk'

// /**
//  * The input for finding a tabulated block by its GeoID.
//  *
//  * @public
//  */
// export interface FindGeoFeatureByBlockIDRequestBody {
// 	geoid: string
// }

// /**
//  * Finds a tabulated block by its GeoID.
//  *
//  * @throws {ResourceError} If the GeoID is invalid or not found.
//  * @public
//  */
// export async function findGeoFeatureByBlockID({ geoid }: FindGeoFeatureByBlockIDRequestBody) {
// 	const block = await TIGERDataService.findOne({
// 		select: [...TigerTabulatedProperties, "geometryBytes"],
// 		where: {
// 			geoid: geoid as FIPSBlockGeoID,
// 		},
// 	})

// 	if (!block) throw ResourceError.from(404, `Tabulated Block not found: ${geoid}`, "tiger", "tabulated-block", "find")

// 	const geometry = await TIGERDataService.createQueryBuilder("block")
// 		.select("AsGeoJSON(block.GEOMETRY, 15, 3)")
// 		.where("block.geoid = :geoid", { geoid: geoid as FIPSBlockGeoID })
// 		.execute()
// 		.then((result) => Object.values(result[0])[0] as string)
// 		.then((geojson) => JSON.parse(geojson) as TIGERDataServiceGeometry)

// 	block.geometry = geometry

// 	return block.toGeoFeature()
// }

// /**
//  * Represents the response body for finding a tabulated block by its GeoID.
//  *
//  * @public
//  */
// export type GeoFeatureResponseBody = Awaited<ReturnType<typeof findGeoFeatureByBlockID>>
