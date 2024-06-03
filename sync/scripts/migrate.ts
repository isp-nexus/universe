/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file Database migration script.
 */

import { $ContactsDataSource, $PostalDataSource } from "@isp.nexus/mailwoman/sdk"
import { NexusDataSource } from "@isp.nexus/sdk"
import { runScript } from "@isp.nexus/sdk/reflection"
import { $BDCDataSource, $FabricDataSource } from "@isp.nexus/sync/fcc"

interface ProcessDatabaseServiceOptions {
	migrate: boolean
	synchronize: boolean
}

async function processDBService(dataSource: NexusDataSource, options: ProcessDatabaseServiceOptions) {
	if (options.migrate) {
		await dataSource.runMigrations()
	}
	if (options.synchronize) {
		await dataSource.synchronize()
	}
}

await runScript(async () => {
	const postal = await $PostalDataSource
	const contacts = await $ContactsDataSource
	const bdc = await $BDCDataSource
	const fabric = await $FabricDataSource

	const tasks = new Map<NexusDataSource, ProcessDatabaseServiceOptions>([
		[postal, { migrate: false, synchronize: false }],
		[contacts, { migrate: false, synchronize: false }],
		[bdc, { migrate: false, synchronize: false }],
		[fabric, { migrate: false, synchronize: false }],
	])

	for (const [service, options] of tasks) {
		await processDBService(service, options)
	}
})
