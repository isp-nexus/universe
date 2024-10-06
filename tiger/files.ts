/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   TIGER Census data utilities.
 */

import { AdminLevel1Code } from "./state.js"

//#region Constants

/**
 * Census TIGER levels for geographic data.
 *
 * @category Census
 */
export enum TIGERLevel {
	State = "us_state",
	County = "county",
	CountySubdivision = "cousub",
	Tract = "tract",
	BlockGroup = "bg",
	Block = "tabblock20",
}

/**
 * File extension for TIGER data files.
 *
 * @category Census
 */
export enum TIGERFileExtension {
	/**
	 * Feature geometry, i.e. the shape of the geographic area.
	 */
	Shape = ".shp",
	/**
	 * Index of the feature geometry for quick access.
	 */
	Index = ".shx",
	/**
	 * Tabular attribute metadata.
	 */
	Attributes = ".dbf",
	/**
	 * Coordinate system information. Describes the projection of the geographic data.
	 */
	Projection = ".prj",
	/**
	 * Federal Geographic Data Committee (FGDC) metadata.
	 */
	FGDCMetadata = ".shp.xml",
	/**
	 * International Organization for Standardization (ISO 191) metadata.
	 */
	ISOMetadata = ".shp.iso.xml",
	/**
	 * ISO 191 (entity and attribute) metadata.
	 */
	EntityAttributeMetadata = ".shp.ea.iso.xml",

	/**
	 * Compressed ZIP archive.
	 */
	Zip = ".zip",

	None = "",
}

/**
 * Order of TIGER levels for processing, from largest to smallest.
 */
export const TIGERLevelOrder = [
	TIGERLevel.State,
	TIGERLevel.Tract,
	TIGERLevel.CountySubdivision,
	TIGERLevel.BlockGroup,
	TIGERLevel.Block,
] as const satisfies TIGERLevel[]

/**
 * The current TIGER vintage.
 *
 * @category Census
 * @internal
 */
export const TIGERCurrentVintage = 2023
export type TIGERCurrentVintage = typeof TIGERCurrentVintage

//#endregion

//#region File Name Generation

/**
 * Type-helper for TIGER feature geometry file names.
 *
 * @category Census
 */
export type TIGERStateLevelFileName<
	SFC extends AdminLevel1Code,
	Level extends TIGERLevel,
	FileExtension extends TIGERFileExtension,
	Vintage extends number = TIGERCurrentVintage,
> = `tl_${Vintage}_${SFC}_${Level}${FileExtension}`

/**
 * Template function to generate a TIGER file name.
 */
export function TIGERStateLevelFileName<
	SFC extends AdminLevel1Code,
	Level extends TIGERLevel,
	FileExtension extends TIGERFileExtension,
	Vintage extends number = TIGERCurrentVintage,
>(stateFIPSCode: SFC, level: Level, fileExtension: FileExtension, vintage: Vintage = TIGERCurrentVintage as Vintage) {
	const fileName = `tl_${vintage}_${stateFIPSCode}_${level}${fileExtension}` satisfies TIGERStateLevelFileName<
		SFC,
		Level,
		FileExtension,
		number
	>

	return fileName
}

export type TIGERStateLevelZIPPath<
	SFC extends AdminLevel1Code,
	Level extends TIGERLevel,
	Vintage extends number = TIGERCurrentVintage,
> = `/geo/tiger/TIGER${Vintage}/${Uppercase<Level>}/${TIGERStateLevelFileName<SFC, Level, TIGERFileExtension.Zip, Vintage>}`

/**
 * Template function to generate a TIGER ZIP file path.
 */
export function TIGERStateLevelZIPPath<
	SFC extends AdminLevel1Code,
	Level extends TIGERLevel,
	Vintage extends number = TIGERCurrentVintage,
>(stateFIPSCode: SFC, level: Level, vintage: Vintage = TIGERCurrentVintage as Vintage) {
	const levelPath = level.toUpperCase() as Uppercase<Level>
	const fileName = TIGERStateLevelFileName(stateFIPSCode, level, TIGERFileExtension.Zip, vintage)
	const path = `/geo/tiger/TIGER${vintage}/${levelPath}/${fileName}` satisfies TIGERStateLevelZIPPath<
		SFC,
		Level,
		Vintage
	>

	return path
}

/**
 * Template function to generate a TIGER ZIP file path.
 */
export function TIGERNationZIPPath<Vintage extends number = TIGERCurrentVintage>(
	vintage: Vintage = TIGERCurrentVintage as Vintage
) {
	const fileName = `tl_${vintage}_${TIGERLevel.State}${TIGERFileExtension.Zip}` as const

	const path = `/geo/tiger/TIGER${vintage}/STATE/${fileName}` as const
	// https://www2.census.gov/geo/tiger/TIGER2023/STATE/tl_2023_us_state.zip

	return path
}

//#endregion

//#region Manifests

/**
 * A TIGER manifest for a specific state at a specific level of detail.
 *
 * @category Census
 */
export interface TIGERLevelManifest<
	SFC extends AdminLevel1Code,
	Level extends TIGERLevel,
	Vintage extends number = number,
> {
	Shape: TIGERStateLevelFileName<SFC, Level, TIGERFileExtension.Shape, Vintage>
	Index: TIGERStateLevelFileName<SFC, Level, TIGERFileExtension.Index, Vintage>
	Attributes: TIGERStateLevelFileName<SFC, Level, TIGERFileExtension.Attributes, Vintage>
	Projection: TIGERStateLevelFileName<SFC, Level, TIGERFileExtension.Projection, Vintage>
	FGDCMetadata: TIGERStateLevelFileName<SFC, Level, TIGERFileExtension.FGDCMetadata, Vintage>
	ISOMetadata: TIGERStateLevelFileName<SFC, Level, TIGERFileExtension.ISOMetadata, Vintage>
	EntityAttributeMetadata: TIGERStateLevelFileName<SFC, Level, TIGERFileExtension.EntityAttributeMetadata, Vintage>
}

export function TIGERLevelManifest<
	SFC extends AdminLevel1Code,
	Level extends TIGERLevel,
	Vintage extends number = TIGERCurrentVintage,
>(stateFIPSCode: SFC, level: Level, vintage?: Vintage) {
	vintage ??= TIGERCurrentVintage as Vintage

	const Shape = TIGERStateLevelFileName(stateFIPSCode, level, TIGERFileExtension.Shape, vintage)
	const Index = TIGERStateLevelFileName(stateFIPSCode, level, TIGERFileExtension.Index, vintage)
	const Attributes = TIGERStateLevelFileName(stateFIPSCode, level, TIGERFileExtension.Attributes, vintage)
	const Projection = TIGERStateLevelFileName(stateFIPSCode, level, TIGERFileExtension.Projection, vintage)
	const FGDCMetadata = TIGERStateLevelFileName(stateFIPSCode, level, TIGERFileExtension.FGDCMetadata, vintage)
	const ISOMetadata = TIGERStateLevelFileName(stateFIPSCode, level, TIGERFileExtension.ISOMetadata, vintage)
	const EntityAttributeMetadata = TIGERStateLevelFileName(
		stateFIPSCode,
		level,
		TIGERFileExtension.EntityAttributeMetadata,
		vintage
	)

	const manifest = {
		Shape,
		Index,
		Attributes,
		Projection,
		FGDCMetadata,
		ISOMetadata,
		EntityAttributeMetadata,
	} satisfies TIGERLevelManifest<SFC, Level, number>

	return manifest as TIGERLevelManifest<SFC, Level, Vintage>
}

/**
 * A full TIGER manifest for a specific state.
 */
export interface TIGERStateManifest<SFC extends AdminLevel1Code, Vintage extends number = TIGERCurrentVintage> {
	Tract: TIGERLevelManifest<SFC, TIGERLevel.Tract, Vintage>
	CountySubdivision: TIGERLevelManifest<SFC, TIGERLevel.CountySubdivision, Vintage>
	BlockGroup: TIGERLevelManifest<SFC, TIGERLevel.BlockGroup, Vintage>
	Block: TIGERLevelManifest<SFC, TIGERLevel.Block, Vintage>
}

export function TIGERStateManifest<SFC extends AdminLevel1Code, Vintage extends number = TIGERCurrentVintage>(
	stateFIPSCode: SFC,
	vintage?: Vintage
) {
	vintage ??= TIGERCurrentVintage as Vintage

	const Tract = TIGERLevelManifest(stateFIPSCode, TIGERLevel.Tract, vintage)
	const CountySubdivision = TIGERLevelManifest(stateFIPSCode, TIGERLevel.CountySubdivision, vintage)
	const BlockGroup = TIGERLevelManifest(stateFIPSCode, TIGERLevel.BlockGroup, vintage)
	const Block = TIGERLevelManifest(stateFIPSCode, TIGERLevel.Block, vintage)

	const manifest = {
		Tract,
		CountySubdivision,
		BlockGroup,
		Block,
	} satisfies TIGERStateManifest<SFC, Vintage>

	return manifest as TIGERStateManifest<SFC, Vintage>
}

//#endregion
