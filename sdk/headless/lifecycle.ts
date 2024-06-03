/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { UserAgent, waitForTimeout } from "@isp.nexus/core"
import { ConsoleLogger, IRuntimeLogger } from "@isp.nexus/core/logging"
import puppeteer from "puppeteer"
import { PuppeteerExtra } from "puppeteer-extra"
import { PuppeteerExtraPluginAdblocker } from "puppeteer-extra-plugin-adblocker"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

/**
 * Screen dimensions for the headless browser.
 */
export interface ScreenDimensions {
	width: number
	height: number
}

/**
 * Default screen size for the headless browser.
 */
export const DEFAULT_PUPPETEER_SCREEN_SIZE = {
	width: 1024,
	height: 1366,
} as const satisfies ScreenDimensions

/**
 * Default launch options for the headless browser.
 */
export const DEFAULT_PUPPETEER_LAUNCH_OPTIONS = {
	headless: true,
	waitForInitialPage: false,
	args: [
		"--disable-accelerated-2d-canvas", // Disable hardware acceleration.
		"--disable-background-timer-throttling", // Disable throttling.
		"--disable-backgrounding-occluded-windows", // Disable backgrounding.
		"--disable-breakpad", // Disable crash reporting.
		"--disable-component-extensions-with-background-pages", // Disable extensions.
		"--disable-dev-shm-usage", // Disable shared memory.
		"--disable-extensions", // Disable extensions.
		"--disable-features=TranslateUI,BlinkGenPropertyTrees", // Disable features.
		"--disable-gpu", // Disable GPU.
		"--disable-infobars", // Disable infobars.
		"--disable-ipc-flooding-protection", // Disable IPC flooding protection.
		"--disable-notifications", // Disable notifications.
		"--disable-renderer-backgrounding", // Disable backgrounding.
		"--disable-setuid-sandbox", // Disable sandbox.
		"--enable-features=NetworkService,NetworkServiceInProcess", // Enable features.
		"--force-color-profile=srgb", // Force color profile.
		"--hide-scrollbars", // Hide scrollbars.
		"--metrics-recording-only", // Metrics recording only.
		"--mute-audio", // Mute audio.
		"--no-first-run", // No first run.
		"--no-sandbox", // No sandbox.
		"--no-startup-window", // No startup window.
		"--no-zygote", // No zygote, i.e. no child processes.
		"--single-process", // Use a single process.
		"--window-position=0,0", // Initial window position.
	],
	timeout: 15_000,
	ignoreHTTPSErrors: true,
} as const satisfies puppeteer.PuppeteerLaunchOptions

export interface BrowserResult {
	browser: puppeteer.Browser
	page: puppeteer.Page
	logger: IRuntimeLogger
	createPage: () => Promise<puppeteer.Page>
}

export async function createHeadlessBrowser(
	overrides?: puppeteer.LaunchOptions,
	dimensions: ScreenDimensions = DEFAULT_PUPPETEER_SCREEN_SIZE
): Promise<BrowserResult> {
	const options = { ...DEFAULT_PUPPETEER_LAUNCH_OPTIONS, ...overrides }

	const puppet = new PuppeteerExtra(puppeteer as any)
	puppet.use(StealthPlugin())
	puppet.use(new PuppeteerExtraPluginAdblocker({ blockTrackers: true }))

	const browser = await puppeteer.launch(options)

	await waitForTimeout(1500) // Fixes race condition.

	const createPage = async () => {
		const page = await browser.newPage()
		await page.setUserAgent(UserAgent.iPadSafari)
		await page.setViewport(dimensions)
		await waitForTimeout(500) // Fixes race condition.

		return page
	}

	const page = await createPage()
	const logger = ConsoleLogger.withPrefix("Puppeteer")

	return {
		logger,
		browser,
		page,
		createPage,
	}
}
