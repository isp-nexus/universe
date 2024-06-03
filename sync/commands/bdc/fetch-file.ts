/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file Download a file from the FCC's Broadband Data Collection API
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { CommandHandler } from "@isp.nexus/sdk"
import { $BDCDataSource, BDCFileCacheDirectoryBuilder, BDCFileSchema, downloadBDCFile } from "@isp.nexus/sync/fcc"
import { CommandBuilder } from "yargs"

export const command = "bdc-fetch <fileID> [outDirectory]"
export const describe = "Fetch and parse a file from the FCC Broadband Data Collection API."

interface CommandArgs {
	outDirectory: string
	fileID: number
	skipCache: boolean
}

export const builder: CommandBuilder<CommandArgs, CommandArgs> = {
	fileID: {
		describe: "The ID of the file to download.",
		type: "number",
		demandOption: true,
		coerce: (value) => parseInt(value, 10),
		alias: "f",
	},

	skipCache: {
		describe: "Whether to skip the cache and download the file again.",
		type: "boolean",
	},
	json: {
		describe: "Output logs as JSON",
		type: "boolean",
	},
}

export const handler: CommandHandler<CommandArgs> = async ({ fileID, skipCache }) => {
	const dataSource = await $BDCDataSource
	const fileRepo = dataSource.getRepository(BDCFileSchema)

	ConsoleLogger.info(`Fetching file ${fileID}...`)
	const entry = await fileRepo.findOne({ where: { fileID } })

	if (!entry) throw ResourceError.from(404, `File with ID ${fileID} not found.`)

	const { fileName, providerID, category, subcategory, stateCode } = entry

	const fileCacheDirectory = BDCFileCacheDirectoryBuilder({
		stateCode,
		providerID,
		category,
		subcategory,
	})

	await downloadBDCFile({
		fileID,
		fileName,
		skipCache,
		fileCacheDirectory,
	})
}
