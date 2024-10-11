/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Download a file from the FCC's Broadband Data Collection API
 */

import { sumOf, takeInParallel } from "@isp.nexus/core"
import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { ProviderID } from "@isp.nexus/fcc"
import { CommandHandler, createCLIProgressBar, ParquetReader } from "@isp.nexus/sdk"
import {
	$BCDClient,
	$BDCDataSource,
	BDCFileCategory,
	BDCProviderSubCategory,
	buildFileCacheDirectoryMap,
	CensusBlockAvailabilityRecord,
	collectBDCFiles,
	downloadBDCFile,
	FileRow,
	writeProviderAvailability,
} from "@isp.nexus/sync/fcc"
import { AdminLevel1CodeToAbbreviation } from "@isp.nexus/tiger"
import { bold, cyanBright, reset } from "colorette"
import { PathBuilder } from "path-ts"

export const command = "bdc-sync"
export const describe = "Synchronize available filings from the FCC Broadband Data Collection API."

export const handler: CommandHandler = async () => {
	const dataSource = await $BDCDataSource

	const bdc = await $BCDClient

	ConsoleLogger.info("Fetching file IDs...")

	const category = BDCFileCategory.Provider
	const subcategory = BDCProviderSubCategory.FixedBroadband

	const files = await collectBDCFiles({ category, subcategory, omit: "synchronized" })
	ConsoleLogger.info(`Found ${files.size} files...`)

	const talleyProgressBar = await createCLIProgressBar(
		{
			total: files.size,
		},
		{
			stage: "Batching",
		}
	)

	const remainingFilesToInsert = new Set<FileRow>()
	const fileCacheDirectoryMap = buildFileCacheDirectoryMap(files.values())

	const fileDownloadTasks = takeInParallel(
		files.values(),
		10,
		async (file) => {
			const { fileName } = file

			talleyProgressBar.update({ stage: fileName })

			remainingFilesToInsert.add(file)
		},
		ServiceRepository.abortController.signal
	)

	for await (const _ of fileDownloadTasks) {
		await bdc.$cooldown

		talleyProgressBar.increment()
	}

	await talleyProgressBar.dispose()

	const downloadProgressBar = await createCLIProgressBar(
		{
			total: files.size,
		},
		{
			stage: "Downloading",
		}
	)

	bdc.addEventListener("cooldown_start", () => {
		downloadProgressBar.update({ stage: "Cooldown" })
	})

	bdc.addEventListener("cooldown_end", () => {
		downloadProgressBar.update({
			stage: "Downloading",
		})
	})

	const filesWithErrors: FileRow[] = []

	const batchedDownloads = takeInParallel(
		files.values(),
		10,
		async (file) => {
			const fileCacheDirectory = fileCacheDirectoryMap.get(file)!

			const { fileID, fileName, providerID, recordCount, fileType } = file

			const fileBuffer = await downloadBDCFile({
				fileID,
				fileName,
				fileCacheDirectory,
			}).catch(() => {
				filesWithErrors.push(file)
				return null
			})

			if (fileBuffer && fileType === "csv") {
				await writeProviderAvailability({
					zippedCSVBuffer: fileBuffer,
					fileCacheDirectory,
					fileName,
					providerID,
					recordCount,
				})
			}

			downloadProgressBar.increment()
		},
		ServiceRepository.abortController.signal
	)

	for await (const _ of batchedDownloads) {
		/* empty */
	}

	await downloadProgressBar.dispose()

	const totalRecordInsertionCount = sumOf(files.values(), "recordCount")

	const insertAverageProgressBar = await createCLIProgressBar({
		total: totalRecordInsertionCount,
		etaBuffer: 10_000,
		showPerformance: true,
	})

	const filesToInsertByProviderID = new Map<ProviderID, FileRow[]>()
	const recordCountByProviderID = new Map<ProviderID, number>()

	for (const file of remainingFilesToInsert) {
		const { providerID } = file
		const filesForProvider = filesToInsertByProviderID.get(providerID) || []

		filesForProvider.push(file)
		filesToInsertByProviderID.set(providerID, filesForProvider)

		const count = recordCountByProviderID.get(providerID) || 0
		recordCountByProviderID.set(providerID, count + file.recordCount)
	}

	const insertProgressBar = await createCLIProgressBar({
		total: filesToInsertByProviderID.size,
		displayName: "Providers Remaining",
	})

	// We want to insert the providers with the fewest records first because
	// the insertion process is slow and we want to get the most complete
	// records in the database as quickly as possible.

	const sortedProviderIDs = Array.from(filesToInsertByProviderID.keys()).sort((a, b) => {
		const aCount = recordCountByProviderID.get(a)!
		const bCount = recordCountByProviderID.get(b)!
		return aCount - bCount
	})

	for (const providerID of sortedProviderIDs) {
		const providerFiles = filesToInsertByProviderID.get(providerID)!

		const batchedInserts = takeInParallel(
			providerFiles,
			1,
			async (file) => {
				const { providerName, fileName, fileType, stateCode, vintage, revision } = file
				const stateCodeInt = parseInt(stateCode, 10)

				const stateAbbreviation = AdminLevel1CodeToAbbreviation[stateCode]
				const displayName = cyanBright(bold([stateAbbreviation, providerName].join(" - "))) + reset("")

				if (fileType !== "csv") return

				const fileCacheDirectory = fileCacheDirectoryMap.get(file)!
				const parquetFilePath = PathBuilder.from(fileCacheDirectory, fileName + ".parquet")

				const reader = await ParquetReader.openFile<CensusBlockAvailabilityRecord>(parquetFilePath)
				const fileRecordCount = reader.getRowCount().toNumber()
				insertAverageProgressBar.setTotal(insertAverageProgressBar.getTotal() + fileRecordCount)

				const readerProgressBar = await createCLIProgressBar({
					total: fileRecordCount,
					displayName,
				})

				for await (const record of reader) {
					await dataSource.query(/* sql */ `
					INSERT OR IGNORE INTO bsl_availability (
						stateCode,
						provider_id,
						location_id,
						technology_code,
						business_residential_code,
						low_latency,
						max_advertised_download_speed,
						max_advertised_upload_speed,
						revision,
						vintage
					)
					VALUES (
						${stateCodeInt},
						${providerID},
						${record.location_id},
						${record.technology_code},
						${record.business_residential_code},
						${record.low_latency},
						${record.max_advertised_download_speed},
						${record.max_advertised_upload_speed},
						date("${revision}"),
						date("${vintage}")
					)`)

					readerProgressBar.increment()
					insertAverageProgressBar.increment()
					insertAverageProgressBar.markPerformance()
				}

				await reader.dispose()
				await readerProgressBar.dispose()
				remainingFilesToInsert.delete(file)

				await dataSource.query(/* sql */ `
					UPDATE bdc_file
					SET synchronized_at = CURRENT_TIMESTAMP
					WHERE file_id = ${file.fileID}
				`)
			},
			ServiceRepository.abortController.signal
		)

		for await (const _ of batchedInserts) {
			/* empty */
		}

		filesToInsertByProviderID.delete(providerID)
		insertProgressBar.increment()
	}

	await insertProgressBar.dispose()
	await insertAverageProgressBar.dispose()

	if (filesWithErrors.length > 0) {
		ConsoleLogger.error(`Failed to download ${filesWithErrors.length} files.`)
		ConsoleLogger.info(filesWithErrors)
	}
}
