/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

// import { FIPSBlockGeoID } from "@isp.nexus/tiger"
import { router } from "./singleton.js"

// static async findGeoFeaturesWithinBBox(_input: GeoBoundingBoxInput): Promise<FIPSBlockGeoID[]> {
// 	const bbox = new GeoBoundingBox([-73.78394710709753, 40.85496734268477, -73.78061811293166, 40.85636234845039])
// 	const { minLatitude, maxLatitude, minLongitude, maxLongitude } = bbox

// 	// We use a Spatialite query here since our ORM doesn't support SQlite's spatial functions.
// 	const geoIDs = await this.query(/* sql */ `
// 		SELECT GEOID
// 		FROM ${$TigerTabulatedBlock.tableName}
// 		WHERE
// 			ST_Intersects(
// 				GEOMETRY,
// 				MakeEnvelope(${minLongitude}, ${minLatitude}, ${maxLongitude}, ${maxLatitude}, 4326)
// 			);`)

// 	return geoIDs as FIPSBlockGeoID[]
// 	// const blocks = await this.findManyBy({ geoid: geoIDs })
// }

export const appRouter = router({
	// /**
	//  * Finds a tabulated block by its GeoID.
	//  *
	//  * @throws {ResourceError} If the GeoID is invalid or not found.
	//  */
	// findGeoFeatureByBlockID: publicProcedure.input(z.string()).query(async (_opts) => {
	// 	throw new Error("Not implemented")
	// 	// const { input } = opts
	// 	// const block = await TigerTabulatedBlock.findOne({
	// 	// 	select: [...TigerTabulatedProperties, "geometryBytes"],
	// 	// 	where: {
	// 	// 		geoid: input as FIPSBlockGeoID,
	// 	// 	},
	// 	// })
	// 	// if (!block) throw ResourceError.from(404, `Tabulated Block not found: ${input}`, "tiger", "tabulated-block", "find")
	// 	// const geometry = await TigerTabulatedBlock.createQueryBuilder("block")
	// 	// 	.select("AsGeoJSON(block.GEOMETRY, 15, 3)")
	// 	// 	.where("block.geoid = :geoid", { geoid: input as FIPSBlockGeoID })
	// 	// 	.execute()
	// 	// 	.then((result) => Object.values(result[0])[0] as string)
	// 	// 	.then((geojson) => JSON.parse(geojson) as TIGERTabulatedBlockGeometry)
	// 	// block.geometry = geometry
	// 	// return block.toGeoFeature()
	// }),
	// findGeoFeaturesWithinBBox: publicProcedure.input(z.array(z.number())).query<FIPSBlockGeoID[]>(async (_opts) => {
	// 	throw new Error("Not implemented")
	// 	// const { input } = opts
	// 	// const bbox = new GeoBoundingBox(input as any)
	// 	// // We use a Spatialite query here since our ORM doesn't support SQlite's spatial functions.
	// 	// const geoIDs = await TigerTabulatedBlock.createQueryBuilder("block")
	// 	// 	.select("block.geoid as geoid")
	// 	// 	.where(/* sql*/ `MbrIntersects(GeomFromText('${bbox.to2DWKT()}'), block.GEOMETRY)`)
	// 	// 	.execute()
	// 	// 	.then((result) => Object.values(result).map((row: any) => row.geoid as FIPSBlockGeoID))
	// 	// return geoIDs as FIPSBlockGeoID[]
	// }),
})

export type AppRouter = typeof appRouter
