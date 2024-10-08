/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ExtractResponseBodyData, pluckResponseData } from "@isp.nexus/core"
import { dataSourcePathBuilder } from "@isp.nexus/sdk"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import { $BCDClient } from "./client.js"
import { BDCFilingDataType } from "./common.js"

export interface FCCAsOfDateEntry {
	data_type: BDCFilingDataType
	/**
	 * @format date-time
	 */
	as_of_date: string
}

export interface ListAvailableDatesResponseBody {
	data: FCCAsOfDateEntry[]
	result_count: number
	status_code: string
	message: string
	status: string
	request_date: string
}

/**
 * Pluck the available dates from the response body.
 */
const pluckAvailableDates = (
	filingType: BDCFilingDataType,
	data: ExtractResponseBodyData<ListAvailableDatesResponseBody>
) => {
	return (
		data
			.filter((entry) => entry.data_type === filingType)
			// ---
			.map((entry) => new Date(entry.as_of_date))
			.sort((a, b) => b.getTime() - a.getTime())
	)
}

export interface RetrieveFilingDatesParams {
	filingType: BDCFilingDataType
	skipCache?: boolean
}

export async function retrieveFilingDates({ filingType, skipCache = false }: RetrieveFilingDatesParams) {
	const bdc = await $BCDClient
	bdc.logger.info(`Fetching available dates...`)

	const cachedFilePath = dataSourcePathBuilder("fcc", "bdc", `${filingType}-dates.json`)

	if (!skipCache) {
		const cachedDates = await fs.readFile(cachedFilePath, "utf8").catch(() => null)

		if (cachedDates) {
			bdc.logger.debug(`Using cached available dates...`)
			return (JSON.parse(cachedDates) as string[]).map((date) => new Date(date))
		}
	}

	return (
		bdc

			// ---
			.fetch<ListAvailableDatesResponseBody>({
				url: "/map/listAsOfDates",
			})
			.then(pluckResponseData)
			.then(async (data) => {
				const dates = pluckAvailableDates(filingType, data)

				await fs.mkdir(path.dirname(cachedFilePath.toString()), { recursive: true })
				await fs.writeFile(cachedFilePath, JSON.stringify(dates, null, "\t"))

				return dates
			})
	)
}
