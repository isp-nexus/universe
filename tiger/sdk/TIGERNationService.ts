/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { NexusDataSource, readLocalJSONFile } from "@isp.nexus/sdk"
import { GeometryCollection, GeometryLiteral } from "@isp.nexus/spatial"
import { geometryToEWKH, geometryToWKT } from "@isp.nexus/spatial/sdk"

import {
	AdminLevel1Abbreviation,
	AdminLevel1Code,
	FIPSStateCode,
	GeoIDPart,
	StateName,
	TIGERLevel,
	TIGERState,
} from "@isp.nexus/tiger"
import { EntitySchema } from "typeorm"

/**
 * @internal
 */
export const TIGERStateSchema = new EntitySchema<TIGERState>({
	name: TIGERLevel.State,
	orderBy: {
		[GeoIDPart.State]: "ASC",
	},
	columns: {
		[GeoIDPart.State]: {
			primary: true,
			type: "text",
			length: 2,
		},

		abbreviation: {
			type: "text",
		},

		GEOM: {
			type: "blob",
			comment: "The spatial data for the state.",
			select: false,
		},
	},
	indices: [
		{
			columns: [GeoIDPart.State],
			name: "idx_us_state_code",
		},
	],
})

/**
 * @internal
 */
export interface TIGERStateShapeAttributes {
	STATEFP: FIPSStateCode
	STUSPS: AdminLevel1Abbreviation
	NAME: StateName
}

/**
 * Data source for the TIGER Nation service.
 *
 * @singleton
 */
export const $TIGERNation = ServiceRepository.register(async () => {
	const dataSource = new NexusDataSource({
		displayName: "TIGER Nation Service",
		storagePath: ":memory:",
		entities: [TIGERStateSchema],
		logLevels: ["warn", "error"],
	})

	await dataSource.query(/* sql */ `SELECT InitSpatialMetadata();`)

	await dataSource.query(/* sql */ `CREATE TABLE "${TIGERLevel.State}"(
		"state_code" TEXT PRIMARY KEY NOT NULL
	);`)

	await dataSource.driver.queryRunner.addSpatialColumn(TIGERLevel.State, "GEOM", "MultiPolygon")

	const collection: GeometryCollection = await readLocalJSONFile("tiger", "sdk", "data", "nation", "index.json")

	for (const geometry of collection.geometries) {
		await dataSource.query(/* sql */ `
			INSERT INTO "${TIGERLevel.State}" ("state_code", "GEOM")
			VALUES ('${geometry.id!}', GeomFromEWKT('SRID=4326;${geometryToWKT(geometry)}'));
		`)
	}

	return dataSource
})

export interface FindIntersectingStateOptions {
	/**
	 * The geometry to intersect with.
	 */
	geometry: GeometryLiteral
}

/**
 * Find the state code that intersects with the given geometry.
 *
 * This can be used to improve the performance of finding block geometries, limiting the search to
 * subset of states.
 */
export async function findIntersectingState({ geometry }: FindIntersectingStateOptions): Promise<AdminLevel1Code[]> {
	const dataStore = await $TIGERNation

	const query = dataStore
		.getRepository(TIGERStateSchema)
		.createQueryBuilder()
		.select(GeoIDPart.State)
		.where(/* sql */ `Contains(GEOM, GeomFromEWKB(:ewkb))`)
		.setParameter("ewkb", geometryToEWKH(geometry))

	const rows: Pick<TIGERState, GeoIDPart.State>[] = await query.execute()
	const stateCodes = rows.map((row) => row[GeoIDPart.State])

	return stateCodes
}
