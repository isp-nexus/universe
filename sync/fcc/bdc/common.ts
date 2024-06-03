/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { BroadbandTechnologyCode, ProviderID } from "@isp.nexus/fcc"
import { AdminLevel1Code, StateName } from "@isp.nexus/tiger"

/**
 * The data type of the file, e.g. what kind of data is in the file.
 */
export enum BDCFilingDataType {
	/**
	 * The file contains data about the availability of broadband with a specific provider.
	 */
	Availability = "availability",
	/**
	 * The file contains data about the challenge process.
	 */
	Challenge = "challenge",
}

export enum BDCGISFileType {
	ShapeFile = 1,
	GeoPackage = 2,
}

/**
 * The type of file, e.g. what format the file is in.
 */
export enum BDCFileFormat {
	CSV = "csv",
	GIS = "gis",
}

export enum BDCFileCategory {
	Provider = "Provider",
	Summary = "Summary",
	State = "State",
}

export enum BDCProviderSubCategory {
	FixedBroadband = "Fixed Broadband",
	MobileBroadband = "Mobile Broadband",
	MobileVoice = "Mobile Voice",
	SupportingData = "Supporting Data",
}

export enum BDCSummarySubCategory {
	BroadbandSummaryByGeography = "Broadband Summary by Geography Type",
	ProviderSummaryByGeography = "Provider Summary by Geography Type",
	ProviderSummaryFixedBroadband = "Provider Summary - Fixed Broadband",
	ProviderSummaryMobileBroadband = "Provider Summary - Mobile Broadband",
}

export enum BDCStateSubCategory {
	FixedBroadband = "Fixed Broadband",
	MobileBroadband = "Mobile Broadband",
	MobileVoice = "Mobile Voice",
}

export type BDCSubCategory = BDCProviderSubCategory | BDCStateSubCategory | BDCSummarySubCategory

export interface RawBDCFile {
	file_id: number
	category: BDCFileCategory
	subcategory: BDCSubCategory
	/**
	 * Comma-separated list of technology codes.
	 *
	 * @see {@link BroadbandTechnologyCode}
	 */
	technology_code: string
	technology_code_desc: string
	state_fips: AdminLevel1Code
	state_name: StateName
	provider_id: string
	provider_name: string
	file_type: string
	file_name: string
	record_count: string
}

export interface BDCFile {
	/**
	 * Unique identifier for the file, defined by the FCC.
	 */
	fileID: number

	revision: Date
	vintage: Date

	/**
	 * The date the file was was downloaded, parsed, and stored in the database.
	 */
	synchronizedAt?: Date

	/**
	 * The category of the file.
	 */
	category: BDCFileCategory
	/**
	 * The subcategory of the file.
	 */
	subcategory: BDCSubCategory
	/**
	 * The technology codes in the file.
	 */
	technologyCodes: Set<BroadbandTechnologyCode>
	/**
	 * The state or territory FIPS code.
	 */
	stateCode: AdminLevel1Code
	/**
	 * The provider ID associated with the file.
	 */
	providerID: ProviderID
	/**
	 * The provider name associated with the file.
	 */
	providerName: string
	/**
	 * The number of records in the file.
	 */
	recordCount: number
	/**
	 * The type of file, e.g. what format the file is in.
	 */
	fileType: string
	/**
	 * The name of the file, as provided by the FCC.
	 */
	fileName: string
}

const BDCFileNamePattern = /([A-Z])(\d+)_(\d{2})([a-z]{3})(\d{4})$/

const MonthAbbreviation = {
	jan: 0,
	feb: 1,
	mar: 2,
	apr: 3,
	may: 4,
	jun: 5,
	jul: 6,
	aug: 7,
	sep: 8,
	oct: 9,
	nov: 10,
	dec: 11,
} as const

export type MonthAbbreviation = keyof typeof MonthAbbreviation

const VintageMonthLetter = {
	/** December */
	D: 11,
	/** June */
	J: 5,
}

type VintageMonthLetter = keyof typeof VintageMonthLetter

/**
 * Given a BDC file, parse the components of the file name.
 */
export function parseBDCFileTimestamps(fileName: string) {
	const match = fileName.match(BDCFileNamePattern)

	if (!match) throw new Error(`Invalid BDC file name: ${fileName}`)
	const [, vintageMonthLetter, vintageYearAbbreviation, revisionDay, revisionMonthAbbreviation, revisionYear] = match

	const revisionMonth = MonthAbbreviation[revisionMonthAbbreviation as MonthAbbreviation]
	const revision = new Date(parseInt(revisionYear!, 10), revisionMonth, parseInt(revisionDay!, 10))

	const vintageMonth = VintageMonthLetter[vintageMonthLetter as VintageMonthLetter]
	const vintageYear = parseInt(`20${vintageYearAbbreviation}`, 10)

	const vintage = new Date(vintageYear, vintageMonth)

	return {
		revision,
		vintage,
	}
}

export function parseRawBDCFile(raw: RawBDCFile): BDCFile {
	const parsedBDC: BDCFile = {
		...parseBDCFileTimestamps(raw.file_name),
		fileName: raw.file_name,
		fileType: raw.file_type,
		fileID: raw.file_id,
		recordCount: parseInt(raw.record_count, 10),
		category: raw.category,
		subcategory: raw.subcategory,
		technologyCodes: new Set(
			raw.technology_code.split(",").map((code) => parseInt(code, 10) as BroadbandTechnologyCode)
		),
		stateCode: raw.state_fips,
		providerID: parseInt(raw.provider_id, 10) as ProviderID,
		providerName: raw.provider_name,
	}

	return parsedBDC
}

export function compareRevisionAsc(a: BDCFile, b: BDCFile): number {
	return a.revision.getTime() - b.revision.getTime()
}

export function compareProviderIDAsc(a: BDCFile, b: BDCFile): number {
	return a.providerID - b.providerID
}

export function compareStateCodeAsc(a: BDCFile, b: BDCFile): number {
	return parseInt(a.stateCode, 10) - parseInt(b.stateCode, 10)
}
