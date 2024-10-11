/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { writeLocalJSONFile } from "@isp.nexus/sdk/files"
import { createHeadlessBrowser } from "@isp.nexus/sdk/headless"
import { repoRootPathBuilder } from "@isp.nexus/sdk/repo-paths"
import { runScript } from "@isp.nexus/sdk/runner"
import { AdminLevel1Abbreviation } from "@isp.nexus/tiger"
import * as fs from "node:fs/promises"

const { browser, createPage, logger } = await createHeadlessBrowser()

const downloadPath = repoRootPathBuilder("fcc", "scratch", "providers-sync")
await fs.mkdir(downloadPath, { recursive: true })

/**
 * States where SiFi Networks claims availability.
 */
const SIFI_AVAILABLE_STATES = new Map<AdminLevel1Abbreviation, string>([
	[AdminLevel1Abbreviation["California"], "https://sifinetworks.com/corporate/state-california/"],
	[AdminLevel1Abbreviation.Connecticut, "https://sifinetworks.com/corporate/state-connecticut/"],
	[AdminLevel1Abbreviation.Florida, "https://sifinetworks.com/residential/state-florida/"],
	[AdminLevel1Abbreviation.Illinois, "https://sifinetworks.com/corporate/state-illinois/"],
	[AdminLevel1Abbreviation.Massachusetts, "https://sifinetworks.com/corporate/state-massachusetts/"],
	[AdminLevel1Abbreviation.Michigan, "https://sifinetworks.com/corporate/state-michigan/"],
	[AdminLevel1Abbreviation["New Mexico"], "https://sifinetworks.com/corporate/state-new-mexico/"],
	[AdminLevel1Abbreviation["New York"], "https://sifinetworks.com/corporate/state-new-york/"],
	[AdminLevel1Abbreviation.Ohio, "https://sifinetworks.com/corporate/state-ohio/"],
	[AdminLevel1Abbreviation.Texas, "https://sifinetworks.com/corporate/state-texas/"],
	[AdminLevel1Abbreviation.Wisconsin, "https://sifinetworks.com/corporate/state-wisconsin/"],
])

export interface SiFiCity {
	locality: string
	state: string
	status: string
	units: number
	providers: string[]
}

export async function pluckCities(stateName: AdminLevel1Abbreviation, stateURL: URL) {
	const url = new URL(stateURL.href)
	logger.info(`Navigating to ${url}...`)

	const page = await createPage()
	await page.setJavaScriptEnabled(false)

	await page.goto(url.toString(), {
		waitUntil: "domcontentloaded",
	})

	const siFiCities: SiFiCity[] = []

	const $cityContainers = await page.$$(".city-description")

	for (const $cityContainer of $cityContainers) {
		const $cityName = await $cityContainer.$("h3 a")
		const locality =
			(await $cityName?.evaluate((node) => {
				return node.textContent?.split("FiberCity®")[0]?.trim()
			})) ?? "Unknown"

		const cityURL = (await $cityName?.evaluate((node) => node.href)) ?? "Unknown"

		const $status = await $cityContainer.$("h3 + p")
		const status =
			(await $status?.evaluate((node) => {
				return node.textContent?.split("Status: ")[1]?.trim().toUpperCase()
			})) ?? "Unknown"

		const $units = await $cityContainer.$("p:last-child")
		const units =
			(await $units?.evaluate((node) => {
				return parseInt(node.textContent?.split("Total Units: ")[1]?.trim().replace(/\D/g, "") || "-1", 10)
			})) ?? -1

		const providers = await pluckProviders(new URL(cityURL))

		const entry: SiFiCity = {
			locality,
			state: stateName,
			status,
			units,
			providers,
		}

		siFiCities.push(entry)

		logger.info(entry)
	}

	await page.close()

	return siFiCities
}

export async function pluckProviders(cityURL: URL) {
	logger.info(`Navigating to ${cityURL}...`)

	const page = await createPage()
	await page.setJavaScriptEnabled(false)

	await page.goto(cityURL.toString(), {
		waitUntil: "domcontentloaded",
	})

	const providerURLs: string[] = []

	const $ispLinks = await page.$$(".isp-grid .isp-column a")

	logger.info(`Found  ${$ispLinks.length} ISP(s)`)
	for (const $ispLink of $ispLinks) {
		const providerURL = (await $ispLink.evaluate((node) => node.href)) ?? "Unknown"
		logger.info(`Provider: ${providerURL}`)
		providerURLs.push(providerURL)
	}

	await page.close()

	return providerURLs
}

export async function syncSiFi() {
	const siFiCities: SiFiCity[] = []
	for (const [stateAbbreviation, url] of SIFI_AVAILABLE_STATES) {
		await pluckCities(stateAbbreviation, new URL(url)).then((cities) => siFiCities.push(...cities))
	}

	await writeLocalJSONFile(siFiCities, "scratch", "sifi-cities.json")
}

await runScript(() =>
	syncSiFi()
		.catch((error) => logger.error(error))
		.finally(() => browser.close())
)
