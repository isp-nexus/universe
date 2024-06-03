/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file LRU cache utilities.
 */

import { LRUCache } from "lru-cache"

export interface AsyncDisposableLRUCacheOptions {
	max: number
	displayName?: string
}

/**
 * An LRU cache that automatically disposes of its values when they are evicted.
 */
export class AsyncDisposableLRUCache<K extends {}, V extends AsyncDisposable>
	extends LRUCache<K, V>
	implements AsyncDisposable
{
	public readonly displayName: string

	constructor({ max, displayName }: AsyncDisposableLRUCacheOptions) {
		super({
			max,
			dispose: (value) => value[Symbol.asyncDispose](),
		})

		this.displayName = displayName ?? "cache"
	}

	public async [Symbol.asyncDispose]() {
		for (const [key, value] of this.entries()) {
			await value[Symbol.asyncDispose]()
			this.delete(key)
		}
	}

	public override toString() {
		return `Async LRU ${this.displayName}`
	}
}
