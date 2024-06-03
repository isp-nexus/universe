/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { PickJSON } from "@isp.nexus/core"
import { BroadbandTechnologyCode, ProviderID } from "@isp.nexus/fcc"
import { UnparsedRow } from "@isp.nexus/sdk"
import { AdminLevel1Code } from "@isp.nexus/tiger"
import { BDCFile, BDCFileCategory, BDCProviderSubCategory } from "./common.js"
import { $BDCDataSource } from "./data-source.js"

/**
 * A row in the BDC file table.
 */
export type FileRow = PickJSON<
	BDCFile,
	| "providerName"
	| "fileID"
	| "fileName"
	| "fileType"
	| "providerID"
	| "category"
	| "subcategory"
	| "stateCode"
	| "revision"
	| "vintage"
	| "recordCount"
	| "synchronizedAt"
>

export interface CollectBDCFilesParams {
	category: BDCFileCategory
	subcategory: BDCProviderSubCategory
	providerIDs?: Array<ProviderID | number>
	omit?: "synchronized" | "not-synchronized" | Date
}

/**
 * Collect the most recent BDC files for a given category and subcategory.
 */
export async function collectBDCFiles({
	category,
	subcategory,
	providerIDs,
	omit,
}: CollectBDCFilesParams): Promise<Map<number, FileRow>> {
	const dataSource = await $BDCDataSource

	const providerClause = providerIDs ? /* sql */ `AND provider_id IN (${providerIDs.join(",")})` : ""
	let synchronizedClause: string

	if (omit instanceof Date) {
		synchronizedClause = `AND synchronized_at > date(${omit.toISOString()})`
	} else {
		synchronizedClause = omit === "synchronized" ? `AND synchronized_at IS NULL` : `AND synchronized_at IS NOT NULL`
	}

	const files = await dataSource.query<FileRow[]>(/* sql */ `
		WITH ranked_files AS (
			SELECT
					provider_name,
					file_id,
					file_name,
					file_type,
					provider_id,
					state_code,
					record_count,
					synchronized_at,
					category,
					subcategory,
					revision,
					vintage,
					ROW_NUMBER() OVER (PARTITION BY provider_id, state_code ORDER BY revision DESC) AS rn
			FROM
					bdc_file
			WHERE
				category = '${category}'
				AND subcategory = '${subcategory}'
				${providerClause}
	)
	SELECT
			provider_name as providerName,
			file_id as 'fileID',
			file_name as 'fileName',
			file_type as 'fileType',
			provider_id as 'providerID',
			record_count as 'recordCount',
			synchronized_at as 'synchronizedAt',
			state_code as 'stateCode',
			category,
			subcategory,
			revision,
			vintage
	FROM
			ranked_files
	WHERE
			rn = 1
			${synchronizedClause}
	ORDER BY state_code, record_count ASC;`)

	return new Map(files.map((file) => [file.fileID, file]))
}

export interface BDCProvider {
	providerID: ProviderID
	providerName: string
	vintage: Date
	totalRecordCount: number
	technologyCodes: Set<BroadbandTechnologyCode>
	stateRecordCount: Record<AdminLevel1Code, number>
}

export type BDCProviderRow = UnparsedRow<BDCProvider>

/**
 * Collect the most recent synchronized BDC providers.
 */
export async function collectBDCProviders(): Promise<BDCProvider[]> {
	const dataSource = await $BDCDataSource

	const providerRows = await dataSource.query<BDCProviderRow[]>(/* sql */ `
		SELECT
			provider_id AS providerID,
			provider_name AS providerName,
			technology_codes AS technologyCodes,
			vintage,
			SUM(record_count) AS totalRecordCount,
			json_group_object(state_code, record_count) as stateRecordCount
		FROM bdc_file
		WHERE synchronized_at IS NOT NULL
		GROUP BY provider_id
		ORDER BY totalRecordCount DESC, vintage DESC;
	`)

	return providerRows.map((provider) => ({
		...provider,
		vintage: new Date(provider.vintage),
		technologyCodes: new Set(JSON.parse(provider.technologyCodes)),
		stateRecordCount: JSON.parse(provider.stateRecordCount),
	}))
}
