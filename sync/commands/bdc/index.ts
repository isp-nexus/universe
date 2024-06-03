/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ConsoleLogger } from "@isp.nexus/core/logging"
import { CommandHandler, createCLIProgressBar } from "@isp.nexus/sdk"
import {
	$BDCDataSource,
	BDCFileCategory,
	BDCFileSchema,
	BDCFilingDataType,
	BDCProviderSubCategory,
	compareRevisionAsc,
	parseRawBDCFile,
	retrieveAvailabilityFiles,
	retrieveFilingDates,
} from "@isp.nexus/sync/fcc"
import events from "node:events"

events.setMaxListeners(20)

export const command = "bdc-index"
export const describe = "Synchronize available filings from the FCC Broadband Data Collection API."

export const handler: CommandHandler = async () => {
	const dataSource = await $BDCDataSource
	await dataSource.synchronize(true)

	const fileRepo = dataSource.getRepository(BDCFileSchema)

	ConsoleLogger.info("Fetching BDC filings...")
	const availabilityDates = await retrieveFilingDates({
		filingType: BDCFilingDataType.Availability,
	})

	const files = await Promise.all(
		availabilityDates
			.map((asOfDate) => {
				return [
					retrieveAvailabilityFiles({
						asOfDate,
						category: BDCFileCategory.Provider,
						subcategory: BDCProviderSubCategory.FixedBroadband,
					}),
					retrieveAvailabilityFiles({
						asOfDate,
						category: BDCFileCategory.Provider,
						subcategory: BDCProviderSubCategory.MobileBroadband,
					}),
					retrieveAvailabilityFiles({
						asOfDate,
						category: BDCFileCategory.Provider,
						subcategory: BDCProviderSubCategory.MobileVoice,
					}),
				]
			})
			.flat()
	).then((filesByDate) => filesByDate.flat().map(parseRawBDCFile).sort(compareRevisionAsc))

	const progressBar = await createCLIProgressBar(
		{
			total: files.length,
		},
		{
			stage: "Parsing",
		}
	)

	for (const file of files) {
		progressBar.increment(0, { stage: file.fileName })

		await fileRepo.insert(file)
		progressBar.increment(1)
	}

	await progressBar.dispose()

	ConsoleLogger.info(`\nWriting ${files.length} changes to disk...`)
	await dataSource.query(/* sql */ `PRAGMA wal_checkpoint(FULL)`)

	ConsoleLogger.info("Done.")
}
