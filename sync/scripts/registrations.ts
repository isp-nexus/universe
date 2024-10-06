/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ConsoleLogger } from "@isp.nexus/core/logging"
import { BroadbandProvider, FRN, ProviderID } from "@isp.nexus/fcc"
import { formatOrganizationName, Organization } from "@isp.nexus/mailwoman"
import { upsertOrganization } from "@isp.nexus/mailwoman/sdk"
import { dataSourcePathBuilder, writeLocalTextFile } from "@isp.nexus/sdk"
import { runScript } from "@isp.nexus/sdk/runner"
import {
	$UniversalServiceFundCache,
	lookupEntityRegistration,
	normalizeDataCell,
	RawFCCForm499Filing,
	supplementOrganization,
} from "@isp.nexus/sync/fcc"
import {} from "@isp.nexus/tiger/sdk"
import * as csv from "csv"
import { deepmergeInto } from "deepmerge-ts"
import FastGlob from "fast-glob"
import * as fs from "node:fs/promises"

export interface RawProviderRecord {
	frn: FRN
	provider_id: ProviderID
	holding_company: string
}

export interface ProcessedProvidersResult {
	[providerID: string]: BroadbandProvider
}

/**
 * Parses a given CSV file containing BDC provider records.
 */
export async function parseProvidersCSV(bdcProviderListFilePath: string) {
	ConsoleLogger.info(`Parsing ${bdcProviderListFilePath}...`)

	const parsedCSV: RawProviderRecord[] = await fs
		.readFile(bdcProviderListFilePath)
		.then((contents) => csv.parse(contents, { columns: true }).toArray())

	return parsedCSV
}

export async function parseBDCProvidersFiles() {
	const pattern = dataSourcePathBuilder("fcc", "bdc", "bdc_us_provider_list_*.csv")
	ConsoleLogger.info(`Reading provider list files from ${pattern}...`)
	const bdcProviderListFilePaths = await FastGlob.async(pattern)

	bdcProviderListFilePaths.sort((a, b) => a.localeCompare(b))

	ConsoleLogger.info(`Found ${bdcProviderListFilePaths.length} provider list files.`)

	const providerRecords = await Promise.all(bdcProviderListFilePaths.map(parseProvidersCSV)).then((records) =>
		records.flat()
	)

	const uniqueProviderIDs = new Set(providerRecords.map((record) => record.provider_id))
	ConsoleLogger.info(`Unique FRNs: ${uniqueProviderIDs.size}`)

	const providerRecordMap = new Map<ProviderID, BroadbandProvider>(
		Array.from(uniqueProviderIDs, (providerID) => {
			const provider: BroadbandProvider = {
				holdingCompany: "",
				id: providerID,
				frns: new Set(),
				technologyCodes: new Set(),
				divisionsByFRN: {},
				doingBusinessAsByFRN: {},
			}

			return [providerID, provider]
		})
	)

	const holdingCompanyProviderIDsMap = new Map<string, Set<ProviderID>>()

	for (const record of providerRecords) {
		const providerRecord = providerRecordMap.get(record.provider_id)!

		providerRecord.frns.add(record.frn)

		if (providerRecord.holdingCompany && providerRecord.holdingCompany !== record.holding_company) {
			ConsoleLogger.warn(
				`${record.provider_id} has multiple holding companies, ${providerRecord.holdingCompany} and ${record.holding_company}`
			)
		}

		providerRecord.holdingCompany = record.holding_company
		providerRecordMap.set(record.provider_id, providerRecord)

		if (!holdingCompanyProviderIDsMap.has(record.holding_company)) {
			holdingCompanyProviderIDsMap.set(record.holding_company, new Set())
		}

		holdingCompanyProviderIDsMap.get(record.holding_company)!.add(record.provider_id)
	}

	ConsoleLogger.info(`Mapped ${providerRecordMap.size} provider records.`)

	return {
		providerRecordMap,
		holdingCompanyProviderIDsMap,
	}
}

export async function synchronizeProvider(provider: BroadbandProvider): Promise<void> {
	const { findByFRN } = await $UniversalServiceFundCache

	// Our FRNs may have drifted, but the filing can give us a hint as to where we should go.
	const frnForm499Pairings = await Promise.all(
		Array.from(provider.frns, (frn) => {
			return [frn, findByFRN(frn)] as [FRN, RawFCCForm499Filing | null]
		})
	)

	ConsoleLogger.info(`[${provider.id}] ${frnForm499Pairings.length} entities...`)

	for (const [originalFRN, usfFiling] of frnForm499Pairings) {
		const usfFilingFRN = usfFiling?.frn ? (parseInt(usfFiling.frn) as FRN) : null

		const currentFRN = usfFilingFRN || originalFRN

		ConsoleLogger.info(`[${provider.id}] Synchronizing entity ${currentFRN}...`)

		const [registration, supplementalRegistration] = await Promise.all([
			lookupEntityRegistration(currentFRN, true),
			usfFiling ? supplementOrganization(usfFiling) : ({} as Partial<Organization>),
		])

		deepmergeInto<Partial<Organization>>(registration, supplementalRegistration, {
			frn: currentFRN,
			providerID: provider.id,
			predecessorFRN: originalFRN !== currentFRN ? originalFRN : undefined,
		})

		registration.headquartersAddressID ||= registration.headquartersAddress?.id

		registration.holdingCompany ||=
			formatOrganizationName(normalizeDataCell(provider.holdingCompany)) || "Unknown Legal Name"

		registration.providerID = provider.id

		const serializedRegistration = JSON.stringify(registration, null, "\t")
		const writers: Promise<unknown>[] = [upsertOrganization(registration)]

		if (registration.frn) {
			writers.push(
				writeLocalTextFile(
					serializedRegistration,
					dataSourcePathBuilder("fcc", "entities", registration.frn.toString(), "index.json")
				)
			)
		}

		if (registration.providerID) {
			writers.push(
				writeLocalTextFile(
					serializedRegistration,
					dataSourcePathBuilder("fcc", "provider", registration.providerID.toString(), "index.json")
				)
			)
		}

		await Promise.all(writers)
	}
}

export async function synchronizeProviders() {}

await runScript(async () => {
	const { providerRecordMap } = await parseBDCProvidersFiles()

	const providers = Array.from(providerRecordMap.values())

	const recordCount = providers.reduce((acc, provider) => acc + provider.frns.size, 0)
	let syncedCount = 0

	ConsoleLogger.info(`Synchronizing ${recordCount} provider FCC registrations...`)

	for (const provider of providers) {
		await synchronizeProvider(provider)
		syncedCount += provider.frns.size

		ConsoleLogger.info(`Synchronized ${syncedCount} of ${recordCount} provider FCC registrations.`)

		// await waitForTimeout(1000)

		// if (syncedCount % 50 === 0) {
		// 	ConsoleLogger.info(`Backing off for 5 seconds...`)
		// 	await waitForTimeout(5000)
		// }
	}
})
