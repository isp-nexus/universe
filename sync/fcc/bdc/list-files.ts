/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { pluckResponseData } from "@isp.nexus/core"
import { URLRoutePattern } from "@isp.nexus/core/routing"
import { $BCDClient } from "./client.js"
import {
	BDCFileCategory,
	BDCProviderSubCategory,
	BDCStateSubCategory,
	BDCSummarySubCategory,
	RawBDCFile,
} from "./common.js"

export interface RetrieveProviderAvailabilityParams {
	asOfDate: Date
	category: BDCFileCategory.Provider
	subcategory: BDCProviderSubCategory
}

export interface RetrieveStateAvailabilityParams {
	asOfDate: Date
	category: BDCFileCategory.State
	subcategory: BDCStateSubCategory
}

export interface RetrieveSummaryAvailabilityParams {
	asOfDate: Date
	category: BDCFileCategory.Summary
	subcategory: BDCSummarySubCategory
}

export type RetrieveAvailabilityFilesParams =
	| RetrieveProviderAvailabilityParams
	| RetrieveStateAvailabilityParams
	| RetrieveSummaryAvailabilityParams

export interface RetrieveAvailabilityFilesResponse {
	data: RawBDCFile[]
	result_count: number
	status_code: string
	message: string
	status: string
	request_date: string
}

const ListFilesRouteBuilder = URLRoutePattern.from("/map/downloads/listAvailabilityData/:asOfDate")

/**
 * List the files available for download for a given date, category, and subcategory.
 */
export async function retrieveAvailabilityFiles({
	asOfDate,
	category,
	subcategory,
}: RetrieveAvailabilityFilesParams): Promise<RawBDCFile[]> {
	const bdc = await $BCDClient
	const asOfDateParam = asOfDate.toISOString()
	const pathname = ListFilesRouteBuilder.compile({ asOfDate: asOfDateParam })

	bdc.logger.info(`Listing files for ${category} ${subcategory} as of ${asOfDateParam}`)

	const files = await bdc
		.fetch<RetrieveAvailabilityFilesResponse>({
			url: pathname,
			params: {
				category,
				subcategory,
			},
		})
		.then(pluckResponseData)

	return files
}
