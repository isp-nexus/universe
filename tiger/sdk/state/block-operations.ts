/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { pick } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { GeometryLiteral, MultiPolygonLiteral } from "@isp.nexus/spatial"
import { geometryToEWKH, wellKnownGeometryToGeoJSON } from "@isp.nexus/spatial/sdk"
import {
	FIPSBlockGeoID,
	FIPSStateCode,
	FIPSTractCode,
	GeoIDPart,
	ParsedGeoIDBlockLevel,
	parseFIPSBlockGeoID,
	TIGERBlockFeature,
	TIGERBlockFeatureCollection,
	TIGERTabulatedBlockProperties,
} from "@isp.nexus/tiger"
import { In } from "typeorm"
import { TIGERTabulatedBlockEntitySelections, TIGERTabulatedBlockSchema } from "./TIGERTabulatedBlockEntity.js"
import { $TIGERStateDataSource } from "./data-source.js"

export interface StateBlockIntersectionCriteria {
	stateCode: FIPSStateCode
	geometry: GeometryLiteral
	tractCodes?: FIPSTractCode[]
}

/**
 * Find all the tabulated blocks that intersect with the given geometry.
 */
export async function findIntersectingBlockFeatures({
	stateCode,
	geometry,
}: StateBlockIntersectionCriteria): Promise<TIGERBlockFeatureCollection> {
	// tractCodes ||= await findIntersectingTractCode({ stateCode, geometry })
	// if (!tractCodes.length) throw ResourceError.from(404, "Cannot find intersecting tracts", "tiger", "tract", "find")

	const dataSource = await $TIGERStateDataSource
	const ewkb = geometryToEWKH(geometry)

	const blockIDs = await dataSource
		.getRepository(TIGERTabulatedBlockSchema)
		.createQueryBuilder()
		.select("GEOID")
		.where(/* sql*/ `${GeoIDPart.State} = :stateCode`)
		.andWhere(/* sql*/ `MbrIntersects(GEOM, GeomFromEWKB(:ewkb))`)
		.setParameter("ewkb", ewkb)
		.setParameter("stateCode", stateCode)
		.execute()
		.then((rows) => rows.map((row: any) => row.GEOID))

	const query = dataSource
		.getRepository(TIGERTabulatedBlockSchema)
		.createQueryBuilder()
		.select(TIGERTabulatedBlockEntitySelections)
		.addSelect("AsEWKB(GEOM)", "serializedGeometry")
		.where({
			GEOID: In(blockIDs),
		})
		.andWhere(/* sql*/ `MbrIntersects(GEOM, GeomFromEWKB(:ewkb))`)
		.andWhere(/* sql*/ `Covers(GEOM, GeomFromEWKB(:ewkb))`)
		.setParameter("ewkb", ewkb)

	const rows: TIGERBlockRow[] = await query.execute()

	return parseTIGERBlockFeatureCollectionFromRows(rows)
}

//#region Block Queries

/**
 * Find a tabulated block by its GeoID.
 */
export async function findGeometryByBlockID(geoid: FIPSBlockGeoID): Promise<Buffer> {
	const stateCode = geoid.slice(0, 2) as FIPSStateCode
	const dataSource = await $TIGERStateDataSource

	const query = dataSource
		.getRepository(TIGERTabulatedBlockSchema)
		.createQueryBuilder()
		.select("AsBinary(GEOM)", "serializedGeometry")
		.where({ GEOID: geoid, [GeoIDPart.State]: stateCode })
		.limit(1)

	const rows: Pick<TIGERBlockRow, "serializedGeometry">[] = await query.execute()
	const [row] = rows

	if (!row)
		throw ResourceError.from(
			404,
			`Tabulated Block not found: ${JSON.stringify(geoid)}`,
			"tiger",
			"tabulated-block",
			"find"
		)

	return Buffer.from(row.serializedGeometry, "hex")
}

/**
 * Find a tabulated block by its GeoID.
 */
export async function findGeoFeatureByBlockID(
	input: FIPSBlockGeoID | ParsedGeoIDBlockLevel
): Promise<TIGERBlockFeature> {
	const blockID = typeof input === "string" ? parseFIPSBlockGeoID(input) : input
	const db = await $TIGERStateDataSource

	const where = pick(blockID, [
		GeoIDPart.State,
		GeoIDPart.County,
		GeoIDPart.CountySubDivision,
		GeoIDPart.Tract,
		GeoIDPart.BlockGroup,
		GeoIDPart.Block,
	])

	const query = db
		.getRepository(TIGERTabulatedBlockSchema)
		.createQueryBuilder()
		.select(TIGERTabulatedBlockEntitySelections)
		.addSelect("AsEWKB(GEOM)", "serializedGeometry")
		.where(where)
		.limit(1)

	const rows: TIGERBlockRow[] = await query.execute()
	const [row] = rows

	if (!row)
		throw ResourceError.from(
			404,
			`Tabulated Block not found: ${JSON.stringify(blockID)}`,
			"tiger",
			"tabulated-block",
			"find"
		)

	return parseTIGERBlockFromRow(row)
}

//#region Row parsing

/**
 * @internal
 */
export interface TIGERBlockRow extends TIGERTabulatedBlockProperties {
	GEOID: FIPSBlockGeoID
	/**
	 * @format hex
	 */
	serializedGeometry: string
}

/**
 * Given a row from the TIGER tabulated block table, parses it into a GeoJSON feature.
 *
 * @internal
 */
export function parseTIGERBlockFromRow({ serializedGeometry, ...properties }: TIGERBlockRow): TIGERBlockFeature {
	const feature: TIGERBlockFeature = {
		type: "Feature",
		id: properties.GEOID,
		geometry: wellKnownGeometryToGeoJSON<MultiPolygonLiteral>(Buffer.from(serializedGeometry, "hex")),
		properties,
	}

	return feature
}

/**
 * Given a collection of rows from the TIGER tabulated block table, parses them into a GeoJSON
 * feature collection.
 *
 * @internal
 */
export function parseTIGERBlockFeatureCollectionFromRows(rows: TIGERBlockRow[]): TIGERBlockFeatureCollection {
	const features = rows.map(parseTIGERBlockFromRow)
	const featureCollection: TIGERBlockFeatureCollection = {
		type: "FeatureCollection",
		features,
	}

	return featureCollection
}

//#endregion
