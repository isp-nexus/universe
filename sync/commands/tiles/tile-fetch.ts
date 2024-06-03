/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { waitForTimeout } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { CommandHandler, createCLIProgressBar } from "@isp.nexus/sdk"
import { createHeadlessBrowser } from "@isp.nexus/sdk/headless"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import { CommandBuilder } from "yargs"

export const command = "tile-fetch <parentPageURL> <tileURL> <outDirectory>"
export const describe = "Scrapes all tiles from a MVT server"

interface CommandArgs {
	outDirectory: string
	tileURL: string
	parentPageURL: string
	minZoom: number
	maxZoom: number
	concurrency: number
}

export const builder: CommandBuilder<CommandArgs, CommandArgs> = {
	tileURL: {
		describe: "The URL of the tile server with a path containing {z}/{x}/{y}.pbf",
		type: "string",
		demandOption: true,
		alias: "u",
	},
	parentPageURL: {
		describe: "The URL of the parent page, used to get the access token",
		type: "string",
		demandOption: true,
		alias: "p",
	},
	outDirectory: {
		describe: "The output directory",
		type: "string",
		demandOption: true,
		alias: "o",
		normalize: true,
	},
	minZoom: {
		describe: "The minimum zoom level",
		type: "number",
		default: 0,
		alias: "min",
	},
	maxZoom: {
		describe: "The maximum zoom level",
		type: "number",
		default: 12,
		alias: "max",
	},
	concurrency: {
		describe: "The number of concurrent requests to make",
		type: "number",
		default: 75,
		alias: "c",
	},
}

export const handler: CommandHandler<CommandArgs> = async ({
	tileURL,
	parentPageURL,
	minZoom,
	maxZoom,
	outDirectory,
	concurrency,
}) => {
	ConsoleLogger.info(`Fetching tiles from ${tileURL}...`)
	ConsoleLogger.info(`Zoom Levels: ${minZoom} - ${maxZoom}`)
	ConsoleLogger.info(`Output Directory: ${outDirectory}`)
	ConsoleLogger.info(`Concurrency: ${concurrency}`)

	const mapboxData = await pluckMapboxData(parentPageURL)

	const zoomTaskProgress = await createCLIProgressBar({
		displayName: `Tile Fetch`,
		total: maxZoom - minZoom + 1,
	})

	for (let zoomLevel = minZoom; zoomLevel <= maxZoom; zoomLevel++) {
		const tilesPerRow = Math.pow(2, zoomLevel)

		const tileProgressForZoom = await createCLIProgressBar(
			{
				displayName: `Zoom Level ${zoomLevel}`,
				total: tilesPerRow * tilesPerRow,
			},
			{
				stage: "Fetching Tiles",
			}
		)

		let promises: Promise<void>[] = []

		for (let x = 0; x < tilesPerRow; x++) {
			for (let y = 0; y < tilesPerRow; y++) {
				const cached = await checkIfTileCached(outDirectory, zoomLevel, x, y)
				if (cached) {
					tileProgressForZoom.increment(1)
					continue
				}

				const promise = fetchTile({
					tileURL,
					accessToken: mapboxData.accessToken,
					referrer: parentPageURL,
					zoomLevel,
					x,
					y,
				})
					.then((response) => response.arrayBuffer())
					.then((buffer) => saveTile(Buffer.from(buffer), outDirectory, zoomLevel, x, y))
					.catch((error) => console.error(`Error saving tile ${zoomLevel}/${x}/${y}:`, error))
					.finally(() => tileProgressForZoom.increment(1))

				promises.push(promise)

				if (promises.length >= concurrency) {
					await Promise.all(promises)

					tileProgressForZoom.update({
						stage: "Cooling Down",
					})
					await waitForTimeout(1_500)
					tileProgressForZoom.update({
						stage: "Fetching Tiles",
					})

					promises = []
				}
			}
		}

		await Promise.all(promises)

		await tileProgressForZoom.dispose()
		zoomTaskProgress.increment(1)
	}

	await zoomTaskProgress.dispose()

	ConsoleLogger.info("Completed fetching tiles")
}

interface MapboxData {
	accessToken: string
	styleURL: string
}

/**
 * Plucks the Mapbox access token and style URL from the DOM.
 */
async function pluckMapboxData(url: string): Promise<MapboxData> {
	const { browser, createPage } = await createHeadlessBrowser()

	const page = await createPage()

	await page.goto(url, {
		waitUntil: "networkidle0",
	})

	const { accessToken, styleURL } = await page.$eval(".cmp-mapbox", (element) => {
		return {
			accessToken: element.getAttribute("data-access-token"),
			styleURL: element.getAttribute("data-style-url"),
		}
	})

	await browser.close()

	if (!accessToken) throw ResourceError.from(404, "Mapbox access token not found")
	if (!styleURL) throw ResourceError.from(404, "Mapbox style URL not found")

	return { accessToken, styleURL }
}

interface FetchTileOptions {
	tileURL: string
	accessToken: string
	referrer: string
	zoomLevel: number
	x: number
	y: number
}

/**
 * Fetch a single tile based on zoom level, x, and y coordinates
 */
async function fetchTile({ tileURL, accessToken, referrer, zoomLevel, x, y }: FetchTileOptions): Promise<Response> {
	const url = new URL(
		tileURL
			// ---
			.replace("{z}", zoomLevel.toString())
			.replace("{x}", x.toString())
			.replace("{y}", y.toString())
	)

	url.searchParams.set("access_token", accessToken)

	const response = await fetch(url, {
		headers: {
			"sec-ch-ua": '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": '"macOS"',
			Referer: referrer,
			"Referrer-Policy": "strict-origin-when-cross-origin",
		},
	})
	if (!response.ok) {
		throw new Error(`Failed to fetch tile ${zoomLevel}/${x}/${y}: ${response.statusText}`)
	}
	return response
}

function checkIfTileCached(outDirectory: string, zoomLevel: number, x: number, y: number): Promise<boolean> {
	return fs
		.access(path.join(outDirectory, zoomLevel.toString(), x.toString(), y.toString()))
		.then(() => true)
		.catch(() => false)
}

async function saveTile(pbf: Buffer, outDirectory: string, zoomLevel: number, x: number, y: number): Promise<void> {
	const outFilePath = path.join(outDirectory, zoomLevel.toString(), x.toString(), y.toString())

	await fs.mkdir(path.dirname(outFilePath), { recursive: true })
	return fs.writeFile(outFilePath, pbf)
}
