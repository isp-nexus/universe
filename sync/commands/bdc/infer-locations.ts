/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { iterateInParallel, takeInParallel } from "@isp.nexus/core"
import { AsyncInitializable, ServiceRepository, ServiceSymbol } from "@isp.nexus/core/lifecycle"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { CommandHandler, createCLIProgressBar, ParquetReader } from "@isp.nexus/sdk"
import { PathBuilder } from "@isp.nexus/sdk/reflection"
import {
	$FabricDataSource,
	BDCFileCategory,
	BDCProviderSubCategory,
	buildFileCacheDirectoryMap,
	CensusBlockAvailabilityRecord,
	collectBDCFiles,
	FabricDataSourcePath,
} from "@isp.nexus/sync/fcc"
import { AdminLevel1Code, AdminLevel1CodeToAbbreviation, FIPSBlockGeoID } from "@isp.nexus/tiger"
import { bold, cyanBright, reset } from "colorette"
import * as fs from "node:fs/promises"
import { createClient, RedisClientType } from "redis"
import { CommandBuilder } from "yargs"

export const command = "geocode-bsl"
export const describe = "Infer all broadband servicable locations"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CommandArgs {}

export const builder: CommandBuilder<CommandArgs, CommandArgs> = {}

enum RedisDatabase {
	Locations = 10,
}

class RedisManager implements AsyncDisposable, AsyncInitializable {
	#client: RedisClientType | null = null

	public [Symbol.asyncDispose] = async () => {
		if (this.#client) {
			await this.#client.disconnect()
			this.#client = null
		}
	}

	public flush() {
		return this.#client?.flushDb()
	}

	public async *valuesOfSet<T extends string = string>(key: string): AsyncIterable<T> {
		let value: string | undefined

		while ((value = (await this.#client?.sPop(key)) as string | undefined)) {
			yield value as T
		}
	}

	public async appendToSet(key: string, value: string | number) {
		return this.#client?.sAdd(key, value.toString())
	}

	public incrementCount(key: string, value: number = 1) {
		return this.#client?.incrBy("counter_" + key, value)
	}

	public async getCount(key: string): Promise<number> {
		const value = await this.#client?.get("counter_" + key)

		return value ? parseInt(value, 10) : 0
	}

	public [ServiceSymbol.asyncInit] = async () => {
		this.#client = (await createClient({
			database: RedisDatabase.Locations,
		})
			.on("error", (err) => ConsoleLogger.error(err))
			.connect()) as RedisClientType

		return this
	}
}

export const $RedisManager = ServiceRepository.register(RedisManager)

export const handler: CommandHandler<CommandArgs> = async () => {
	const stateCodes = new Set<AdminLevel1Code>()

	const textDecoder = new TextDecoder()

	ConsoleLogger.info("Clearing existing data")

	await fs.rm(FabricDataSourcePath, { recursive: true, force: true })
	await fs.mkdir(FabricDataSourcePath.dirname(), { recursive: true })

	const fabricDataSource = await $FabricDataSource

	await fabricDataSource.query(/* sql */ `
		CREATE TABLE locations (
			location_id INT,
			geoid text(15)
		);
	`)

	const redisManager = await $RedisManager

	await redisManager.flush()

	const files = await collectBDCFiles({
		category: BDCFileCategory.Provider,
		subcategory: BDCProviderSubCategory.FixedBroadband,
		omit: "not-synchronized",
	})

	const fileProgressBar = await createCLIProgressBar(
		{
			total: files.size,
			displayName: "Files",
		},
		{
			stage: "Processing",
		}
	)

	const fileCacheDirectoryMap = buildFileCacheDirectoryMap(files.values())
	const fileCacheRecordCountMap = new Map<number, number>()

	fileProgressBar.update({
		stage: "Tallying",
	})

	const batchedCounters = takeInParallel(files.values(), 10, async (file) => {
		const fileCacheDirectory = fileCacheDirectoryMap.get(file)!
		const parquetFilePath = PathBuilder.from(fileCacheDirectory, file.fileName + ".parquet")

		const reader = await ParquetReader.openFile<CensusBlockAvailabilityRecord>(parquetFilePath)
		const recordCount = reader.getRowCount().toNumber()

		fileCacheRecordCountMap.set(file.fileID, recordCount)
		stateCodes.add(file.stateCode)
		fileProgressBar.increment()

		await reader.dispose()
	})

	await iterateInParallel(batchedCounters)

	const recordsProgressBar = await createCLIProgressBar(
		{
			total: Array.from(fileCacheRecordCountMap.values()).reduce((a, b) => a + b, 0),
			displayName: "Records",
			showPerformance: true,
		},
		{
			stage: "Processing",
			poolCount: 0,
		}
	)

	fileProgressBar.update(0, {
		stage: "Reading",
	})

	const batchedReaders = takeInParallel(
		files,
		1,
		async ([fileID, file]): Promise<number> => {
			let pool: Promise<void>[] = []

			const { fileName, fileType, stateCode, providerName } = file

			if (fileType !== "csv") return fileID

			const recordCount = fileCacheRecordCountMap.get(file.fileID)!

			const stateAbbreviation = AdminLevel1CodeToAbbreviation[stateCode]
			const displayName = cyanBright(bold([stateAbbreviation, providerName].join(" - "))) + reset("")

			const fileCacheDirectory = fileCacheDirectoryMap.get(file)!
			const parquetFilePath = PathBuilder.from(fileCacheDirectory, fileName + ".parquet")

			const reader = await ParquetReader.openFile<CensusBlockAvailabilityRecord>(parquetFilePath)

			const readerProgressBar = await createCLIProgressBar({
				total: recordCount,
				displayName,
				showDuration: false,
				showETA: false,
			})

			for await (const record of reader) {
				if (pool.length >= 30_000) {
					recordsProgressBar.update({
						stage: "Draining",
					})
					await Promise.all(pool)
					pool = []

					recordsProgressBar.update({
						stage: "Processing",
					})
				}

				const locationID = record.location_id.toString()
				const geoid = textDecoder.decode(record.geoid!) as FIPSBlockGeoID

				const redisTasks = Promise.all([
					redisManager.appendToSet(stateCode, geoid),
					redisManager.appendToSet(geoid, locationID),
					redisManager.incrementCount(stateCode),
				]).then(() => void 0)

				pool.push(redisTasks)

				readerProgressBar.increment()
				recordsProgressBar.increment(1, {
					poolCount: pool.length,
				})
				recordsProgressBar.markPerformance()
			}

			await reader.dispose()
			await readerProgressBar.dispose()

			await Promise.all(pool)

			return fileID
		},
		ServiceRepository.abortController.signal
	)

	for await (const fileID of batchedReaders) {
		files.delete(fileID)
		fileCacheRecordCountMap.delete(fileID)
		fileProgressBar.increment()
	}

	const statesProgressBar = await createCLIProgressBar({
		total: stateCodes.size,
		displayName: "States",
		showETA: false,
		showDuration: false,
	})

	const batchedInserts = takeInParallel(stateCodes, 1, async (stateCode): Promise<void> => {
		const stateAbbreviation = AdminLevel1CodeToAbbreviation[stateCode]
		const displayName = cyanBright(bold(stateAbbreviation)) + reset("")

		const stateProgressBar = await createCLIProgressBar({
			displayName,
			total: await redisManager.getCount(stateCode),
		})

		for await (const geoid of redisManager.valuesOfSet(stateCode)) {
			for await (const locationID of redisManager.valuesOfSet(geoid)) {
				await fabricDataSource.query(/* sql */ `
					INSERT INTO locations (geoid, location_id)
					VALUES (printf('%015d', '${geoid}'), ${locationID});
				`)
			}

			stateProgressBar.increment()
		}

		await stateProgressBar.dispose()
		statesProgressBar.increment()
	})

	await iterateInParallel(batchedInserts)
}
