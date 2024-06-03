/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { writeLocalBuffer } from "@isp.nexus/sdk/files"
import { createHeadlessBrowser, createWatermarkedScreenshot } from "@isp.nexus/sdk/headless"
import { runScript } from "@isp.nexus/sdk/reflection"

const { browser, page, logger } = await createHeadlessBrowser()

export async function checkBotDetection(url: URL) {
	logger.info(`Navigating to ${url}...`)

	await page
		.goto(url.toString(), {
			waitUntil: "networkidle2",
		})
		.catch((error) => {
			logger.error(error)
		})

	logger.info("Taking screenshot...")

	const screenshot = await createWatermarkedScreenshot(page)
	await writeLocalBuffer(screenshot, "scratch", "screenshots", url.host.replace(/[^a-z0-9]/gi, "_") + ".png")
}

await runScript(() =>
	checkBotDetection(new URL("https://broadbandmap.fcc.gov/data-download/nationwide-data?version=dec2023"))
		.catch((error) => logger.error(error))
		.finally(() => browser.close())
)
