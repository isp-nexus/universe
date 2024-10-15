/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

/**
 * Extracts the property keys of an object that are of type `number`.
 */
export type NumericProperties<T> = {
	[K in keyof T]: T[K] extends number ? K : never
}[keyof T]

/**
 * Given an iterable of objects, returns the sum of the specified property.
 */
export function sumOf<T extends object>(iterable: Iterable<T>, prop: NumericProperties<T>): number {
	let total = 0

	for (const item of iterable) {
		total += item[prop] as number
	}

	return total
}

/**
 * Given an iterable, returns an array of arrays of the specified size.
 *
 * This is useful for batching asynchronous operations.
 *
 * @param collection The collection to batch.
 * @param batchSize The size of each batch.
 *
 * @returns An iterable of arrays of the specified size.
 */
export function* take<T>(collection: Iterable<T>, batchSize: number): Iterable<T[]> {
	const batch: T[] = []

	for (const item of collection) {
		batch.push(item)

		if (batch.length === batchSize) {
			yield batch

			batch.length = 0
		}
	}

	if (batch.length > 0) {
		yield batch
	}
}

/**
 * Given an iterable collection, returns an async iterable, executing the callback on each batch.
 *
 * This is useful for batching asynchronous operations.
 *
 * @param collection The collection to batch.
 * @param batchSize The size of each batch.
 * @param callback The async callback to execute on each batch.
 */
export async function* takeInParallel<T, C extends (entry: T) => Promise<any>>(
	collection: Iterable<T>,
	batchSize: number,
	callback: C,
	abortSignal?: AbortSignal
): AsyncIterable<Awaited<ReturnType<C>>> {
	const entriesRemaining = Array.from(collection)
	const runningTasks = new Map<T, Promise<any>>()
	const results = new Map<T, ReturnType<C>>()

	while ((entriesRemaining.length || results.size) && !abortSignal?.aborted) {
		for (const [key, result] of results) {
			yield result

			results.delete(key)
		}

		if (runningTasks.size >= batchSize) {
			await Promise.race(runningTasks.values())
			continue
		}

		if (entriesRemaining.length === 0) {
			await Promise.all(runningTasks.values())

			break
		}

		const entry = entriesRemaining.shift()!

		const futureResult = callback(entry).then((result) => {
			runningTasks.delete(entry)

			results.set(entry, result)
		})

		runningTasks.set(entry, futureResult)
	}

	if (!abortSignal || !abortSignal.aborted) {
		await Promise.all(runningTasks.values())

		for (const [key, result] of results) {
			yield result

			results.delete(key)
		}
	}
}

/**
 * Convenience function to await an async iterable.
 */
export async function iterateInParallel<T>(asyncIterable: AsyncIterable<T>): Promise<void> {
	for await (const _ of asyncIterable) {
		/* empty */
	}
}

/**
 * Given an iterable of values, maps each value to a record of the value and the result of the
 * callback.
 *
 * This is a convenience function when an iterable needs mapping to an object-like structure.
 *
 * @category Collections
 * @category Object
 */
export function pivot<T extends PropertyKey, C extends (value: T) => Promise<unknown> | unknown>(
	/**
	 * The iterable to pivot.
	 */
	iterable: Iterable<T>,
	/**
	 * The callback to transform each value.
	 */
	callback: C
): ReturnType<C> extends Thenable<infer U> ? Promise<Record<T, U>> : Record<T, ReturnType<C>> {
	const entries: Array<[T, ReturnType<C>]> = []
	let foundThenable = false

	for (const value of iterable) {
		const result = callback(value)

		if (result && typeof result === "object" && "then" in result) {
			foundThenable = true
		}

		entries.push([value, result as any])
	}

	if (foundThenable) {
		return Promise.all(
			entries.map(([key, value]) => {
				return Promise.resolve(value).then((resolvedValue) => [key, resolvedValue] as const)
			})
		).then(Object.fromEntries) as any
	}

	const pivotedRecord = Object.fromEntries(entries)

	return pivotedRecord as any
}

/**
 * Type-predicate for checking if a value is iterable.
 *
 * @category Type Guard
 * @category Object
 */
export function isIterable<T>(input: unknown): input is Iterable<T> {
	return Symbol.iterator in Object(input)
}

/**
 * Iterable that can be checked for the existence of a member.
 */
export interface IndexedIterable<T = unknown> extends Iterable<T> {
	has(value: T): boolean
}

/**
 * Type-predicate for checking if an member within an iterable can be checked for existence.
 */
export function isIndexedIterable<T>(value: Iterable<T>): value is IndexedIterable<T> {
	return value && typeof (value as IndexedIterable).has === "function"
}
