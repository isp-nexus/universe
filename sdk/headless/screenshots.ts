/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import Jimp from "jimp"
import puppeteer from "puppeteer"

export interface WatermarkedScreenshotOptions {
	puppeteerPageOptions?: puppeteer.ScreenshotOptions
}

const LINE_HEIGHT = 1.45
const FONT_SIZE = 16
const PADDING = 10

const [fontForeground, fontBackground] = await Promise.all([
	Jimp.loadFont(Jimp.FONT_SANS_16_BLACK),
	Jimp.loadFont(Jimp.FONT_SANS_16_WHITE),
])

/**
 * Given a Puppeteer page, take a screenshot and add a watermark.
 */
export async function createWatermarkedScreenshot(
	page: puppeteer.Page,
	{ puppeteerPageOptions }: WatermarkedScreenshotOptions = {}
) {
	const url = new URL(page.url())

	const screenshot = await page
		// ---
		.screenshot({
			fullPage: true,
			optimizeForSpeed: true,
			...puppeteerPageOptions,
		})
		.then((buffer) => Jimp.read(buffer))

	const bottom = screenshot.getHeight() - PADDING
	const left = PADDING

	const lines = [new Date().toISOString().replace(/:/g, "-"), url.href]

	for (let i = 0; i < lines.length; i++) {
		const x = left
		const y = bottom - Math.floor(FONT_SIZE * LINE_HEIGHT) * (lines.length - i)
		const line = lines[i]

		for (let j = 0; j < 2; j++) {
			screenshot.print(fontBackground, x + j, y, line)
		}

		for (let j = 0; j < 2; j++) {
			screenshot.print(fontBackground, x - j, y, line)
		}

		for (let j = 0; j < 2; j++) {
			screenshot.print(fontBackground, x, y + j, line)
		}

		for (let j = 0; j < 2; j++) {
			screenshot.print(fontBackground, x, y - j, line)
		}

		screenshot.print(fontForeground, x, y, line)
	}

	// const left = 10

	// screenshot.print(font, left, bottom - 32 * 3, url)
	// screenshot.print(font, left, bottom - 40, date)

	return screenshot.getBufferAsync(Jimp.MIME_PNG)
}

// export function applyWatermark() {
// 	return Jimp.read("raw/originalimage.png")
// 		.then((tpl) => tpl.clone().write(imgActive))
// 		.then(() => Jimp.read(imgActive))
// 	//   .then((tpl) =>
// 	//       Jimp.read('raw/logo.png').then((logoTpl) => {
// 	//           logoTpl.opacity(0.2)
// 	//           return tpl.composite(logoTpl, 512, 512, [Jimp.BLEND_DESTINATION_OVER])
// 	//       }),
// 	//   )
// 	//   .then((tpl) => tpl.write('raw/watermark.png'))
// 	// }
// }
