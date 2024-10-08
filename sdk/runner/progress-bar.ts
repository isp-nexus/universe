/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ServiceRepository, ServiceSymbol } from "@isp.nexus/core/lifecycle"
import { MultiBar, SingleBar } from "cli-progress"
import { argv } from "node:process"
import { PathBuilderLike } from "../reflection/path-builders.js"

const prefersJSONLogging = argv.includes("--json")

const spinnerGlyphs = ["\uEE06", "\uEE07", "\uEE08", "\uEE09", "\uEE0A", "\uEE0B"]

/**
 * A character to use for the progress bar.
 *
 * @internal
 */
export enum BarCharacter {
	StartIncomplete = "\uEE00",
	StartComplete = "\uEE03",
	BodyIncomplete = "\uEE01",
	BodyComplete = "\uEE04",
	EndIncomplete = "\uEE02",
	EndComplete = "\uEE05",
}

/**
 * Payload for a progress bar.
 *
 * @internal
 */
export interface BarPayload {
	/**
	 * The character to use for the spinner glyph.
	 */
	spinnerGlyph: string
	/**
	 * The character to use for the start of the progress bar.
	 */
	start: BarCharacter
	/**
	 * The character to use for the end of the progress bar.
	 */
	end: BarCharacter

	performance?: string
}

/**
 * Child instance of a progress bar managed by a `ProgressBarManager`.
 */
export interface ChildProgressBar<P extends object | unknown = unknown> extends AsyncDisposable {
	/**
	 * The parent progress bar manager.
	 */
	parent: ProgressBarManager

	/**
	 * The unique identifier of the progress bar.
	 */
	id: number

	/**
	 * Dispose of the progress bar, removing it from the parent manager.
	 */
	dispose: () => PromiseLike<void>

	/**
	 * Sets the current progress value and optionally the payload with values of custom tokens as a
	 * second parameter
	 */
	update(current: number, payload?: Partial<P | BarPayload>): void
	update(payload: Partial<P | BarPayload>): void

	/**
	 * Marks the performance of the progress bar.
	 */
	markPerformance(step?: number): void

	/**
	 * Increases the current progress value by a specified amount (default +1).
	 *
	 * Update payload optionally.
	 */
	increment(step?: number, payload?: Partial<P | BarPayload>): void
	increment(payload: Partial<P | BarPayload>): void

	/**
	 * Set the total number of steps in the progress bar.
	 */
	setTotal(total: number): void

	/**
	 * Get the total number of steps in the progress bar.
	 */
	getTotal(): number
}

export interface ProgressBarManager extends MultiBar, AsyncDisposable {
	children: Map<number, ChildProgressBar>
	IDCounter: number
	dispose(): Promise<void>
}

/**
 * Progress bar manager for CLI task runners.
 *
 * @singleton
 */
export const $ProgressBarManager = ServiceRepository.register(() => {
	const manager = new MultiBar({
		etaAsynchronousUpdate: true,
		hideCursor: true,
		barsize: 100,
		etaBuffer: 500,
		barCompleteChar: BarCharacter.BodyComplete,
		barIncompleteChar: BarCharacter.BodyIncomplete,
	}) as ProgressBarManager

	manager.toString = () => "ProgressBarManager"
	manager.IDCounter = 0
	manager.children = new Map()

	manager[Symbol.asyncDispose] = async () => {
		let child: ChildProgressBar | undefined

		const children = Array.from(manager.children.values())

		while ((child = children.pop())) {
			await child?.dispose()
		}

		manager.children.clear()

		manager.stop()
	}

	return manager
})

export interface CreateCLIProgressBarOptions {
	/**
	 * The total number of steps in the progress bar.
	 *
	 * This is the maximum value of the progress bar, and denominates the total number of steps that
	 * will be taken to complete the task.
	 */
	total?: number

	/**
	 * The initial value of the progress bar.
	 *
	 * @default 0
	 */
	value?: number

	/**
	 * Number of updates to the progress bar before the ETA is recalculated.
	 */
	etaBuffer?: number

	/**
	 * Whether to show the completion count in the progress bar.
	 */
	showCount?: boolean

	/**
	 * Whether to show performance metrics in the progress bar.
	 */
	showPerformance?: boolean

	/**
	 * The display name of the progress bar.
	 */
	displayName?: PathBuilderLike | null

	/**
	 * Whether to show the duration of the progress bar.
	 */
	showDuration?: boolean
	/**
	 * Whether to show the estimated time of arrival of the progress bar.
	 */
	showETA?: boolean

	id?: number
}

/**
 * Create a new CLI progress bar.
 */
export async function createCLIProgressBar<P extends object | unknown = unknown>(
	{
		total = Infinity,
		value = 0,
		etaBuffer,
		showCount = true,
		showDuration = true,
		showETA = true,
		showPerformance,
		displayName,
		id,
	}: CreateCLIProgressBarOptions,
	/**
	 * The payload of values attach to the progress bar.
	 */
	payload: P = {} as P
): Promise<ChildProgressBar<P>> {
	const parent = await $ProgressBarManager

	const barPayload: BarPayload = {
		spinnerGlyph: "⊙",
		start: BarCharacter.StartComplete,
		end: BarCharacter.EndIncomplete,
		performance: "0",
	}

	const childBar = parent.create(
		total,
		value,
		{
			...(payload || {}),
			...barPayload,
		},
		{
			// etaAsynchronousUpdate: true,
			etaBuffer,
			format: [
				`{spinnerGlyph} {start}{bar}{end} {percentage}%`,

				showCount ? "{value}/{total}" : "",

				displayName?.toString() || "",

				...Object.keys(payload || {}).map((key) => `{${key}}`),
				showPerformance ? `{performance}/min` : "",
				showDuration ? `{duration_formatted}` : "",
				showETA ? `{eta_formatted}` : "",
			]
				.filter(Boolean)
				.join(" | "),
		}
	) as SingleBar & ChildProgressBar<P & BarPayload>

	if (prefersJSONLogging) {
		childBar.render = () => void 0
	}

	childBar.parent = parent
	childBar.id = id ?? parent.IDCounter++

	let performanceInterval: NodeJS.Timeout | undefined
	let incrementSampleCount = 0

	childBar.markPerformance = (step = 1) => {
		incrementSampleCount += step
	}

	if (showPerformance) {
		const intervalSeconds = 1000 // Sample once per second
		const intervalMinutes = intervalSeconds / 60

		performanceInterval = setInterval(() => {
			const incrementRate = incrementSampleCount / intervalMinutes || 0

			incrementSampleCount = 0

			childBar.update({
				performance: incrementRate.toFixed(2),
			})
		}, intervalSeconds)
	}

	childBar[Symbol.asyncDispose] = (): PromiseLike<void> => {
		clearInterval(performanceInterval)

		childBar.update({
			spinnerGlyph: "✓",
			start: BarCharacter.StartComplete,
			end: BarCharacter.EndComplete,
		})

		childBar.render = () => {}
		childBar.update = () => {}

		childBar.stop()

		parent.children.delete(childBar.id)

		ServiceSymbol.markAsDisposed(childBar)
		parent.remove(childBar)

		return Promise.resolve()
	}

	const baseRender = childBar.render

	let spinnerIndex = 0

	childBar.render = function render() {
		const _payload = (this as any).payload as BarPayload
		spinnerIndex = (spinnerIndex + 1) % spinnerGlyphs.length
		_payload.spinnerGlyph = spinnerGlyphs[spinnerIndex]!
		baseRender.call(this)
	}

	childBar.dispose = childBar[Symbol.asyncDispose].bind(childBar)

	return childBar
}
