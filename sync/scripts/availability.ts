/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

// import { take } from "@isp.nexus/core"
// import { ConsoleLogger } from "@isp.nexus/core/logging"
// import { createCLIProgressBar } from "@isp.nexus/sdk"
// import { runIfScript } from "@isp.nexus/sdk/runtime"
// import {
// 	$BCDClient,
// 	BCDFileCache,
// 	BDCFileCategory,
// 	BDCFilingDataType,
// 	BDCProviderSubCategory,
// 	retrieveAvailabilityFiles,
// 	retrieveFilingDates,
// 	synchronizeProviderEntry,
// } from "@isp.nexus/sync/fcc"
// import { FIPSStateCode } from "@isp.nexus/tiger"

// runIfScript(import.meta, async () => {
// 	const logger = ConsoleLogger.withPrefix("FCC", "Providers")

// 	// if (!process.env.WORKER_KEY) throw new Error("WORKER_KEY is required")
// 	// const WORKER_KEY = parseInt(process.env.WORKER_KEY)

// 	// if (isNaN(WORKER_KEY)) throw new Error("FLIP must be a number")

// 	// const STATE_CODE = process.env.STATE_CODE || "26"
// 	// const PROVIDER_ID = parseInt(process.env.PROVIDER_ID || "130317", 10)

// 	// if (!STATE_CODE) throw new Error("STATE_CODE is required")
// 	// if (!PROVIDER_ID) throw new Error("PROVIDER_ID is required")

// 	const bdc = await $BCDClient

// 	const filingDates = await retrieveFilingDates({
// 		filingType: BDCFilingDataType.Availability,
// 	})

// 	const fileCache = await Promise.all(
// 		filingDates.map((asOfDate) =>
// 			retrieveAvailabilityFiles({
// 				asOfDate,
// 				category: BDCFileCategory.Provider,
// 				subcategory: BDCProviderSubCategory.FixedBroadband,
// 			})
// 		)
// 	).then((files) => BCDFileCache.from(files.flat()))

// 	const providers = fileCache.collectProviders()

// 	const taskBar = await createCLIProgressBar(
// 		{
// 			total: providers.length,
// 			etaBuffer: 1000,
// 		},
// 		{ stage: "Sync" }
// 	)

// 	bdc.addEventListener("cooldown_start", () => {
// 		taskBar.update({ stage: "Cooldown" })
// 	})

// 	bdc.addEventListener("cooldown_end", () => {
// 		taskBar.update({
// 			stage: "Sync",
// 		})
// 	})

// 	for (const stateCode of Object.values(FIPSStateCode)) {
// 		// if (STATE_CODE && STATE_CODE !== stateCode) continue

// 		for (const providersBatch of take(providers, 1)) {
// 			await Promise.all(
// 				providersBatch.map(async (provider) => {
// 					// if (PROVIDER_ID && PROVIDER_ID !== provider.id) return
// 					// if (provider.id % 2 === WORKER_KEY) {
// 					// 	taskBar.increment(1, { providerID: provider.id })
// 					// 	return
// 					// }

// 					const files = fileCache.findFilesByStateCode(stateCode, provider.id)
// 					const recordCounts = files.reduce((sum, file) => sum + file.recordCount, 0)

// 					const fileProgressBar = await createCLIProgressBar({
// 						total: recordCounts,
// 						displayName: provider.holdingCompany,
// 					})

// 					for (const fileBatch of take(files, 1)) {
// 						await Promise.all(
// 							fileBatch.map((entry) => {
// 								return synchronizeProviderEntry({ entry })
// 									.catch((error) => {
// 										throw new Error(
// 											`Failed to sync file ${entry.fileID} ${entry.providerID} ${entry.providerName}: ${error.message}`
// 										)
// 									})
// 									.finally(() => {
// 										fileProgressBar.increment(entry.recordCount)
// 									})
// 							})
// 						)
// 					}

// 					await fileProgressBar.dispose()

// 					taskBar.increment(1, { providerID: provider.id })
// 				})
// 			)
// 		}
// 	}

// 	await taskBar.dispose()

// 	// for (const stateCode of Object.values(FIPSStateCode)) {
// 	// 	// if (STATE_CODE && STATE_CODE !== stateCode) continue

// 	// 	await writeStateBlockGeoJSON(stateCode, FIPSStateLevelPath(stateCode, "availability.json"))
// 	// }

// 	logger.info("All providers synchronized.")
// })
