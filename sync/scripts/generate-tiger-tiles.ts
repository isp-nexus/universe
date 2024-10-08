/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { iterateInParallel, takeInParallel } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { createCLIProgressBar, DataSourceFile, dataSourcePathBuilder, NexusDataSource, runScript } from "@isp.nexus/sdk"
import { packagePathBuilder, PathBuilderLike } from "@isp.nexus/sdk/reflection"
import {
	AdminLevel1Code,
	AdminLevel1CodeToAbbreviation,
	FIPSStateCode,
	GeoIDPart,
	TIGERLevel,
	TIGERProperty,
} from "@isp.nexus/tiger"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import { $ } from "zx"

const TIGERLevelToSQL = {
	[TIGERLevel.CountySubdivision]: /* sql */ `SELECT
		GEOID AS ${TIGERProperty.GeoID},
		STATEFP AS ${GeoIDPart.State},
		COUNTYFP AS ${GeoIDPart.County},
		COUSUBFP AS ${GeoIDPart.CountySubDivision},
		NAME AS ${TIGERProperty.DisplayName},
		ALAND AS ${TIGERProperty.LandAreaSqm},
		AWATER AS ${TIGERProperty.WaterAreaSqm},
		CAST(INTPTLON AS NUMERIC) AS ${TIGERProperty.CentroidLongitude},
		CAST(INTPTLAT AS NUMERIC) AS ${TIGERProperty.CentroidLatitude}
	FROM ${TIGERLevel.CountySubdivision}`,

	[TIGERLevel.Tract]: /* sql */ `SELECT
		GEOID AS ${TIGERProperty.GeoID},
		STATEFP AS ${GeoIDPart.State},
		COUNTYFP AS ${GeoIDPart.County},
		SUBSTR(GEOID, 6, 5) AS ${GeoIDPart.CountySubDivision},
		TRACTCE AS ${GeoIDPart.Tract},
		ALAND AS ${TIGERProperty.LandAreaSqm},
		AWATER AS ${TIGERProperty.WaterAreaSqm},
		CAST(INTPTLON AS NUMERIC) AS ${TIGERProperty.CentroidLongitude},
		CAST(INTPTLAT AS NUMERIC) AS ${TIGERProperty.CentroidLatitude}
		FROM ${TIGERLevel.Tract}`,

	[TIGERLevel.Block]: /* sql */ `SELECT
		GEOID20 AS ${TIGERProperty.GeoID},
		STATEFP20 AS ${GeoIDPart.State},
		COUNTYFP20 AS ${GeoIDPart.County},
		SUBSTR(GEOID20, 6, 5) AS ${GeoIDPart.CountySubDivision},
		SUBSTR(GEOID20, 6, 6) AS ${GeoIDPart.Tract},
		BLOCKCE20 AS ${GeoIDPart.Block},
		ALAND20 AS ${TIGERProperty.LandAreaSqm},
		AWATER20 AS ${TIGERProperty.WaterAreaSqm},
		CAST(INTPTLON20 AS NUMERIC) AS ${TIGERProperty.CentroidLongitude},
		CAST(INTPTLAT20 AS NUMERIC) AS ${TIGERProperty.CentroidLatitude},
		UR20 AS ${TIGERProperty.UrbanRuralCode},
		UACE20 AS ${TIGERProperty.UrbanizedAreaCode},
		HOUSING20 AS ${TIGERProperty.HousingUnitCount},
		POP20 AS ${TIGERProperty.Population}
		FROM ${TIGERLevel.Block}`,
	[TIGERLevel.BlockGroup]: /* sql */ `SELECT * FROM ${TIGERLevel.BlockGroup}`,
	[TIGERLevel.State]: /* sql */ `SELECT * FROM ${TIGERLevel.State}`,
	[TIGERLevel.County]: /* sql */ `SELECT * FROM ${TIGERLevel.State}`,
} as const satisfies Record<TIGERLevel, string>

const cachedFeatureCount = new Map<PathBuilderLike, number>()

async function pluckFeatureCount(shapeFilePath: PathBuilderLike): Promise<number> {
	if (cachedFeatureCount.has(shapeFilePath)) {
		return cachedFeatureCount.get(shapeFilePath)!
	}

	const child = await $`ogrinfo -al -so -json ${shapeFilePath} | jq ".layers[0].featureCount"`

	const errorOutput = child.stderr.toString().trim()

	if (errorOutput) {
		throw ResourceError.from(500, `${shapeFilePath}: ${errorOutput}`, "tiger", "ogrinfo")
	}

	const featureCount = parseInt(child.stdout.toString())

	cachedFeatureCount.set(shapeFilePath, featureCount)

	return featureCount
}

const stateCodes = Object.values(FIPSStateCode)
const baseCacheDirectory = dataSourcePathBuilder("scratch", "tiger")

const destDir = packagePathBuilder("tiger", "scratch")
const storagePath = path.join(destDir, DataSourceFile.SQLite3)

type PreparationFn = (level: TIGERLevel, stateCode: AdminLevel1Code) => Promise<void>

const convertWithGDAL: PreparationFn = async (level, stateCode) => {
	const sqlQuery = TIGERLevelToSQL[level]
	const shapeFilePath = baseCacheDirectory(stateCode, `${level}.shp`)
	const featureCount = await pluckFeatureCount(shapeFilePath)
	const increment = Math.floor(10 / featureCount)

	const stateAbbreviation = AdminLevel1CodeToAbbreviation[stateCode]

	const conversionProgressBar = await createCLIProgressBar({
		total: featureCount,
		displayName: `${stateAbbreviation} ${level} Conversion`,
	})

	const child = $`ogr2ogr \\
	-f SQLite \\
	-append \\
	${storagePath} \\
	${shapeFilePath} \\
	-nlt MULTIPOLYGON \\
	-progress \\
	-t_srs EPSG:4326 \\
	-sql ${sqlQuery.replace(/\n/g, " ")}`

	child.stdout.on("data", () => {
		conversionProgressBar.increment(increment)
	})

	child.stderr.on("data", (data) => {
		throw ResourceError.from(500, data.toString(), "ogr2ogr", "tiger", stateCode)
	})

	await child

	await conversionProgressBar.dispose()
}

function createTIGERDataSource() {
	return new NexusDataSource({
		displayName: "TIGER",
		storagePath,
		pragmas: {
			auto_vacuum: "INCREMENTAL",
			page_size: 4096,
			cache_size: 10000,
			journal_mode: "WAL",
		},
	}).ready()
}

await runScript(async () => {
	const supportedLevels = [
		// ---
		TIGERLevel.CountySubdivision,
		TIGERLevel.Tract,
		TIGERLevel.Block,
	] as const

	const levelsProgress = await createCLIProgressBar(
		{ total: supportedLevels.length, displayName: "TIGER Levels" },
		{
			stage: "Preparing",
		}
	)

	await fs.mkdir(destDir, { recursive: true })

	await Promise.all([
		fs.rm(storagePath, { recursive: true, force: true }),
		fs.rm(storagePath + "-journal", { recursive: true, force: true }),
		fs.rm(storagePath + "-wal", { recursive: true, force: true }),
	])

	let dataSource = await createTIGERDataSource()

	await dataSource.query(/* sql */ `SELECT InitSpatialMetadata();`)
	await dataSource.vacuum()
	dataSource.dispose()

	dataSource = await createTIGERDataSource()

	//#region Create Tables

	await dataSource.query(/* sql */ `
		CREATE TABLE '${TIGERLevel.CountySubdivision}' (
			ogc_fid 															INTEGER PRIMARY KEY AUTOINCREMENT,
			'${TIGERProperty.GeoID}'							VARCHAR(10) NOT NULL UNIQUE,
			'${GeoIDPart.State}'									VARCHAR(2) NOT NULL,
			'${GeoIDPart.County}'									VARCHAR(3) NOT NULL,
			'${GeoIDPart.CountySubDivision}'			VARCHAR(5) NOT NULL,
			'${TIGERProperty.DisplayName}'				VARCHAR(255) NOT NULL,
			'${TIGERProperty.LandAreaSqm}'				BIGINT NOT NULL,
			'${TIGERProperty.WaterAreaSqm}'				BIGINT NOT NULL,
			'${TIGERProperty.CentroidLongitude}'	FLOAT NOT NULL,
			'${TIGERProperty.CentroidLatitude}'		FLOAT NOT NULL
		);
`)

	await dataSource.query(/* sql */ `
		CREATE TABLE '${TIGERLevel.Tract}' (
			ogc_fid 															INTEGER PRIMARY KEY AUTOINCREMENT,
			'${TIGERProperty.GeoID}'							VARCHAR(11) NOT NULL UNIQUE,
			'${GeoIDPart.State}'									VARCHAR(2) NOT NULL,
			'${GeoIDPart.County}'									VARCHAR(3) NOT NULL,
			'${GeoIDPart.CountySubDivision}'			VARCHAR(5) NOT NULL,
			'${GeoIDPart.Tract}'									VARCHAR(6) NOT NULL,
			'${TIGERProperty.LandAreaSqm}'				BIGINT NOT NULL,
			'${TIGERProperty.WaterAreaSqm}'				BIGINT NOT NULL,
			'${TIGERProperty.CentroidLongitude}'	FLOAT NOT NULL,
			'${TIGERProperty.CentroidLatitude}'		FLOAT NOT NULL
		);
`)

	await dataSource.query(/* sql */ `
		CREATE TABLE '${TIGERLevel.Block}' (
			ogc_fid 															INTEGER PRIMARY KEY AUTOINCREMENT,
			'${TIGERProperty.GeoID}' 							VARCHAR(15) NOT NULL UNIQUE,
			'${GeoIDPart.State}'									VARCHAR(2) NOT NULL,
			'${GeoIDPart.County}'									VARCHAR(3) NOT NULL,
			'${GeoIDPart.CountySubDivision}'			VARCHAR(5) NOT NULL,
			'${GeoIDPart.Tract}'									VARCHAR(6) NOT NULL,
			'${GeoIDPart.Block}'									VARCHAR(4) NOT NULL,
			'${TIGERProperty.LandAreaSqm}'				BIGINT NOT NULL,
			'${TIGERProperty.WaterAreaSqm}'				BIGINT NOT NULL,
			'${TIGERProperty.CentroidLongitude}'	FLOAT NOT NULL,
			'${TIGERProperty.CentroidLatitude}'		FLOAT NOT NULL,
			'${TIGERProperty.UrbanRuralCode}'			VARCHAR(1),
			'${TIGERProperty.UrbanizedAreaCode}'	VARCHAR(5),
			'${TIGERProperty.HousingUnitCount}'		BIGINT,
			'${TIGERProperty.Population}'					BIGINT
		);
	`)

	await dataSource.vacuum()

	//#endregion

	//#region Geometry Columns

	for (const level of supportedLevels) {
		await dataSource.query(/* sql */ `
			SELECT AddGeometryColumn('${level}', 'GEOMETRY', 4326, 'MULTIPOLYGON', 2, 1);
		`)

		await dataSource.vacuum()
	}

	//#endregion

	//#region Feature Views

	await dataSource.query(/* sql */ `
		CREATE VIEW '${TIGERLevel.CountySubdivision}_feature' AS
		SELECT
			${GeoIDPart.State},
			${GeoIDPart.County},
			${GeoIDPart.CountySubDivision},
			${TIGERProperty.DisplayName},
			${TIGERProperty.LandAreaSqm},
			${TIGERProperty.WaterAreaSqm},
			${TIGERProperty.CentroidLatitude},
			${TIGERProperty.CentroidLongitude},
			json_object(
				'type', 'Feature',
				'id', ${TIGERProperty.GeoID},
				'properties', json_object(
					'${GeoIDPart.State}', ${GeoIDPart.State},
					'${GeoIDPart.County}', ${GeoIDPart.County},
					'${GeoIDPart.CountySubDivision}', ${GeoIDPart.CountySubDivision},
					'${TIGERProperty.DisplayName}', ${TIGERProperty.DisplayName},
					'${TIGERProperty.LandAreaSqm}', ${TIGERProperty.LandAreaSqm},
					'${TIGERProperty.WaterAreaSqm}', ${TIGERProperty.WaterAreaSqm},
					'${TIGERProperty.CentroidLatitude}', ${TIGERProperty.CentroidLatitude},
					'${TIGERProperty.CentroidLongitude}', ${TIGERProperty.CentroidLongitude}
				),
				'geometry', json(AsGeoJSON(GEOMETRY))
			) AS geojson
			FROM '${TIGERLevel.CountySubdivision}';
	`)

	await dataSource.query(/* sql */ `
		CREATE VIEW '${TIGERLevel.Tract}_feature' AS
		SELECT
		${GeoIDPart.State},
		${GeoIDPart.County},
		${GeoIDPart.CountySubDivision},
		${GeoIDPart.Tract},
		${TIGERProperty.LandAreaSqm},
		${TIGERProperty.WaterAreaSqm},
		${TIGERProperty.CentroidLatitude},
		${TIGERProperty.CentroidLongitude},
			json_object(
				'type', 'Feature',
				'id', ${TIGERProperty.GeoID},
				'properties', json_object(
					'${GeoIDPart.State}', ${GeoIDPart.State},
					'${GeoIDPart.County}', ${GeoIDPart.County},
					'${GeoIDPart.CountySubDivision}', ${GeoIDPart.CountySubDivision},
					'${GeoIDPart.Tract}', ${GeoIDPart.Tract},
					'${TIGERProperty.LandAreaSqm}', ${TIGERProperty.LandAreaSqm},
					'${TIGERProperty.WaterAreaSqm}', ${TIGERProperty.WaterAreaSqm},
					'${TIGERProperty.CentroidLatitude}', ${TIGERProperty.CentroidLatitude},
					'${TIGERProperty.CentroidLongitude}', ${TIGERProperty.CentroidLongitude}
				),
				'geometry', json(AsGeoJSON(GEOMETRY))
			) AS geojson
			FROM '${TIGERLevel.Tract}';
	`)

	await dataSource.query(/* sql */ `
		CREATE VIEW '${TIGERLevel.Block}_feature' AS
		SELECT
			${GeoIDPart.State},
			${GeoIDPart.County},
			${GeoIDPart.CountySubDivision},
			${GeoIDPart.Tract},
			${GeoIDPart.Block},
			${TIGERProperty.LandAreaSqm},
			${TIGERProperty.WaterAreaSqm},
			${TIGERProperty.CentroidLatitude},
			${TIGERProperty.CentroidLongitude},
			${TIGERProperty.UrbanRuralCode},
			${TIGERProperty.UrbanizedAreaCode},
			${TIGERProperty.HousingUnitCount},
			${TIGERProperty.Population},
			json_object(
				'type', 'Feature',
				'id', ${TIGERProperty.GeoID},
				'properties', json_object(
					'${GeoIDPart.State}', ${GeoIDPart.State},
					'${GeoIDPart.County}', ${GeoIDPart.County},
					'${GeoIDPart.CountySubDivision}', ${GeoIDPart.CountySubDivision},
					'${GeoIDPart.Tract}', ${GeoIDPart.Tract},
					'${GeoIDPart.Block}', ${GeoIDPart.Block},
					'${TIGERProperty.LandAreaSqm}', ${TIGERProperty.LandAreaSqm},
					'${TIGERProperty.WaterAreaSqm}', ${TIGERProperty.WaterAreaSqm},
					'${TIGERProperty.CentroidLatitude}', ${TIGERProperty.CentroidLatitude},
					'${TIGERProperty.CentroidLongitude}', ${TIGERProperty.CentroidLongitude},
					'${TIGERProperty.UrbanRuralCode}', ${TIGERProperty.UrbanRuralCode},
					'${TIGERProperty.UrbanizedAreaCode}', ${TIGERProperty.UrbanizedAreaCode},
					'${TIGERProperty.HousingUnitCount}', ${TIGERProperty.HousingUnitCount},
					'${TIGERProperty.Population}', ${TIGERProperty.Population}
				),
				'geometry', json(AsGeoJSON(GEOMETRY))
			) AS geojson
			FROM '${TIGERLevel.Block}';
	`)

	//#endregion

	levelsProgress.update({ stage: "Converting" })

	for (const level of supportedLevels) {
		const gdalProgress = await createCLIProgressBar({ total: stateCodes.length, displayName: "GDAL" })

		const tasks = takeInParallel(stateCodes, 1, (stateCode) => {
			return convertWithGDAL(level, stateCode).then(() => gdalProgress.increment())
		})

		await iterateInParallel(tasks)
		await gdalProgress.dispose()
		levelsProgress.increment()
	}
	levelsProgress.update({ stage: "Indexing" })

	await dataSource.vacuum()

	levelsProgress.update(0)

	for (const level of supportedLevels) {
		await dataSource.query(/* sql */ `
			CREATE INDEX 'idx_${level}_${GeoIDPart.State}' ON '${level}' ('${GeoIDPart.State}');
		`)

		await dataSource.query(/* sql */ `
			CREATE INDEX 'idx_${level}_${TIGERProperty.GeoID}' ON '${level}' ('${TIGERProperty.GeoID}');
		`)

		levelsProgress.increment()
	}

	await levelsProgress.dispose()

	await dataSource.dispose()
})
