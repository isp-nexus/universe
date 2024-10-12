/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import "@isp.nexus/core/polyfills/promises/withResolvers"

import { iterateInParallel, sumOf, takeInParallel } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { ProviderID } from "@isp.nexus/fcc"
import { sanitizeOrganizationName } from "@isp.nexus/mailwoman"
import { checkIfExists, CommandHandler, createCLIProgressBar } from "@isp.nexus/sdk"
import { repoRootPathBuilder } from "@isp.nexus/sdk/repo-paths"
import { collectBDCProviders } from "@isp.nexus/sync/fcc"
import { AdminLevel1Code, AdminLevel1CodeToAbbreviation } from "@isp.nexus/tiger"
import * as fs from "node:fs/promises"
import { PathBuilder } from "path-ts"
import { CommandBuilder } from "yargs"
import { $ } from "zx"
export const command = "generate-geojson [out-directory]"
export const describe = "Generate GeoJSON for all broadband providers."

interface CommandArgs {
	"out-directory": PathBuilder<"~out-directory">
}

export const builder: CommandBuilder<CommandArgs, CommandArgs> = {
	outDirectory: {
		describe: "The output directory",
		type: "string",
		demandOption: true,
		alias: "o",
		coerce: (value: string) => PathBuilder.from(process.cwd(), value),
		normalize: true,
	},
}

const SatelliteProviders = new Set<ProviderID>([
	290111, //	Viasat, Inc.
	130627, //	Hughes Network Systems, LLC
	430076, //	Space Exploration Technologies Corp.
	460087, //	UnWired Broadband Holding LLC
] as ProviderID[])

export const handler: CommandHandler<CommandArgs> = async ({ outDirectory }) => {
	const bdcProviders = await collectBDCProviders().then((providers) =>
		providers.filter((provider) => !SatelliteProviders.has(provider.providerID))
	)

	await fs.mkdir(outDirectory, { recursive: true })

	ConsoleLogger.info(`Generating GeoJSON for ${bdcProviders.length} providers...`)

	const providersProgress = await createCLIProgressBar({
		total: bdcProviders.length,
		displayName: "Providers Remaining",
	})

	const totalRecordsProgress = await createCLIProgressBar({
		total: sumOf(bdcProviders, "totalRecordCount"),
		displayName: "Records Remaining",
	})

	$.cwd = repoRootPathBuilder().toString()

	const providerBatches = takeInParallel(
		bdcProviders,
		1,
		async ({ providerID, providerName, stateRecordCount, totalRecordCount }) => {
			const providerRecordsProgress = await createCLIProgressBar({
				total: totalRecordCount,
				displayName: providerName,
			})

			const providerNameLabel = sanitizeOrganizationName(providerName).replace(/\s+/g, "_").toLowerCase()

			const stateBatches = takeInParallel(Object.entries(stateRecordCount), 1, async ([stateCode, recordCount]) => {
				const outputFile = outDirectory(`${providerID}_${stateCode}_${providerNameLabel}.geojsons`)

				const exists = await checkIfExists(outputFile)

				const increment = () => {
					providerRecordsProgress.increment(recordCount)
					totalRecordsProgress.increment(recordCount)
				}

				if (exists) {
					increment()
					return
				}

				const stateAbbreviation = AdminLevel1CodeToAbbreviation[stateCode as AdminLevel1Code]

				const stateRecordsProgress = await createCLIProgressBar(
					{
						total: recordCount,
						displayName: `${providerName} ${stateAbbreviation}`,
					},
					{
						fileSize: `0.00 GB`,
					}
				)

				await fs.mkdir(outputFile.dirname().toString(), { recursive: true })
				const child = $`yarn nexus-sync generate-provider-geojson ${providerID} ${stateCode} ${outputFile}`

				child.stdout.on("data", () => {
					fs.stat(outputFile)
						.then((stats) => {
							stateRecordsProgress.update({
								fileSize: `${(stats.size / 1_000_000_000).toFixed(2)} GB`,
							})
						})
						.catch(() => void 0)
				})

				const result = await child.nothrow()

				if (result.exitCode !== 0) {
					throw ResourceError.from(500, result.stderr, "bdc", "generate-geojson-provider", providerID.toString())
				}

				stateRecordsProgress.dispose()
				increment()
			})

			await iterateInParallel(stateBatches)
			providersProgress.increment()
			await providerRecordsProgress.dispose()
		}
	)

	await iterateInParallel(providerBatches)

	await providersProgress.dispose()
	await totalRecordsProgress.dispose()
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function pluckLineCount(filePath: string): Promise<number> {
	const result = await $`wc -l ${filePath}`

	if (result.exitCode !== 0) return 0

	const [, count] = result.stdout.match(/^\s+(\d+)\s/) ?? []

	return typeof count === "string" ? parseInt(count, 10) : 0
}
