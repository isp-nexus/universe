/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Download a file from the FCC's Broadband Data Collection API
 */

import { URLRoutePattern } from "@isp.nexus/core/routing"
import { ProviderID } from "@isp.nexus/fcc"
import { checkIfExists, createCLIProgressBar, extractSingleFileZip, ParquetReader, ParquetWriter } from "@isp.nexus/sdk"
import * as fs from "node:fs/promises"
import { PathBuilder, PathBuilderLike } from "path-ts"
import { CensusBlockAvailabilityRecord, CensusBlockAvailabilitySchema } from "./block-aggregator.js"
import { $BCDClient } from "./client.js"
import { BDCFilingDataType } from "./common.js"
import { takeAvailabilityLine } from "./parsing.js"

export interface BDCFileCacheCheckParams {
	fileCacheDirectory: PathBuilderLike
	fileName: string
	fileExtension?: string
}

/**
 * Check if a file is in the BDC file cache.
 */
export async function checkIfBFCFileCached({
	fileCacheDirectory,
	fileName,
	fileExtension,
}: BDCFileCacheCheckParams): Promise<boolean> {
	const cachedFilePath = PathBuilder.from(fileCacheDirectory, fileName + fileExtension)

	return checkIfExists(cachedFilePath)
}

export interface BDCFileParquetCheckParams {
	fileCacheDirectory: PathBuilderLike
	fileName: PathBuilderLike
	expectedRowCount: number
}

/**
 * Check if a cached file is a valid Parquet file.
 *
 * This can aid in confirming that Parquet files are not corrupted.
 */
export async function checkBDCFileParquetValid({
	fileCacheDirectory,
	fileName,
	expectedRowCount,
}: BDCFileParquetCheckParams): Promise<boolean> {
	const cachedFilePath = PathBuilder.from(fileCacheDirectory, fileName + ".parquet")

	const exists = await checkIfExists(cachedFilePath)

	if (!exists) return false

	const reader = await ParquetReader.openFile<CensusBlockAvailabilityRecord>(cachedFilePath).catch(() => null)

	if (!reader) return false

	const rowCount = reader.getRowCount().toNumber()

	if (rowCount !== expectedRowCount) {
		await reader.dispose()
		return false
	}

	await reader.dispose()

	return true
}

export interface DownloadFileParams {
	fileCacheDirectory: PathBuilderLike
	fileID: number
	fileName: string
	dataType?: BDCFilingDataType
	skipCache?: boolean
}

const DownloadFileRouteBuilder = URLRoutePattern.from("/map/downloads/downloadFile/:dataType/:fileID")

/**
 * Download and cache a file from the FCC Broadband Data Collection API.
 *
 * @returns The file buffer, usually zipped.
 */
export async function downloadBDCFile({
	dataType = BDCFilingDataType.Availability,
	fileID,
	fileName,
	fileCacheDirectory,
	skipCache,
}: DownloadFileParams): Promise<Buffer> {
	const bdc = await $BCDClient

	const archiveCached = Boolean(
		skipCache &&
			(await checkIfBFCFileCached({
				fileCacheDirectory,
				fileName,
				fileExtension: ".zip",
			}))
	)

	const cachedFilePath = PathBuilder.from(fileCacheDirectory, fileName + ".zip")

	if (archiveCached) {
		return fs.readFile(cachedFilePath)
	}

	bdc.logger.debug(`Downloading file ${fileName} ${fileID} of type ${dataType}`)

	const progressBar = await createCLIProgressBar(
		{
			etaBuffer: 1000,
			displayName: fileName,
		},
		{
			stage: "Downloading",
		}
	)

	const fileBuffer = await bdc
		.fetch<ArrayBuffer>({
			url: DownloadFileRouteBuilder.compile({ dataType, fileID }),
			responseType: "arraybuffer",
			onDownloadProgress: (progressEvent) => {
				const total = progressEvent.total ?? 0
				const percentCompleted = (progressEvent.loaded * 100) / total
				progressBar.setTotal(total || percentCompleted)

				progressBar.update(percentCompleted)
			},
		})
		.then((response) => Buffer.from(response.data))

	progressBar.update({ stage: "Writing" })
	await fs.mkdir(fileCacheDirectory, { recursive: true })
	await fs.writeFile(cachedFilePath, fileBuffer)

	await progressBar.dispose()

	return fileBuffer
}

export interface WriteProviderAvailabilityOptions {
	zippedCSVBuffer: Buffer
	fileName: PathBuilderLike
	providerID: ProviderID
	recordCount: number
	fileCacheDirectory: PathBuilderLike
	skipCache?: boolean
}

export async function writeProviderAvailability({
	zippedCSVBuffer,
	fileName,
	providerID,
	fileCacheDirectory,
	recordCount,
	skipCache,
}: WriteProviderAvailabilityOptions): Promise<void> {
	const progressBar = await createCLIProgressBar(
		{ total: recordCount, etaBuffer: 10_000, displayName: fileName },
		{
			stage: "Downloading",
		}
	)

	const cachedFilePath = PathBuilder.from(fileCacheDirectory, fileName + ".parquet")

	if (!skipCache) {
		const validParquet = await checkBDCFileParquetValid({
			fileCacheDirectory,
			fileName,
			expectedRowCount: recordCount,
		})

		if (validParquet) {
			progressBar.update({ stage: "Cached" })
			await progressBar.dispose()
			return
		}

		// It's likely that the file is corrupted, so we'll delete and re-parse.
		progressBar.update({ stage: "Cleaning" })

		await fs.rm(cachedFilePath, { force: true }).catch(() => null)
	}

	progressBar.update({ stage: "Preparing Read Stream" })

	progressBar.update({ stage: "Extracting" })

	const csvBuffer = await extractSingleFileZip(zippedCSVBuffer)

	progressBar.update({ stage: "Writing" })

	const writer = await ParquetWriter.openFile<CensusBlockAvailabilityRecord>(
		CensusBlockAvailabilitySchema,
		cachedFilePath
	)
	for (const record of takeAvailabilityLine(csvBuffer, providerID)) {
		progressBar.increment(1, { stage: record.location_id.toString() })

		await writer.appendRow(record)
	}

	await writer.dispose()
	await progressBar.dispose()
}
