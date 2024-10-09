/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { smartSnakeCase, tryParsingJSON } from "@isp.nexus/core"
import { ServiceSymbol } from "@isp.nexus/core/lifecycle"
import { NexusDataSource } from "@isp.nexus/sdk"
import { PathBuilderLike } from "@isp.nexus/sdk/reflection"
import {
	AxiosStorage,
	buildStorage,
	BuildStorage,
	CacheRequestConfig,
	canStale,
	NotEmptyStorageValue,
	StorageValue,
} from "axios-cache-interceptor"
import * as fs from "node:fs/promises"
import { Stringified } from "type-fest"

interface HTTPRequestCacheEntry {
	cache_key: string
	storage_value: StorageValue
	expires_at: number | null
	created_at: number
	ttl: number
}

export interface HTTPCacheDataSourceOptions {
	storagePath: PathBuilderLike
	/**
	 * The namespace for the cache. This is used to separate caches in the same database.
	 */
	namespace: string

	/**
	 * The interval in milliseconds to evict expired entries.
	 *
	 * Set to -1 to disable eviction.
	 */
	evictionInterval?: number
}

export class HTTPCacheDataSource extends NexusDataSource implements BuildStorage {
	#evictionTimeout: NodeJS.Timeout | undefined
	#evictionInterval: number

	#tableName: string

	constructor({ storagePath, namespace, evictionInterval = 60_000 }: HTTPCacheDataSourceOptions) {
		super({
			displayName: "HTTP Cache",
			storagePath,
			pragmas: {
				auto_vacuum: "FULL",
				journal_mode: "WAL",
				locking_mode: "NORMAL",
				synchronous: "NORMAL",
			},
		})

		this.#tableName = smartSnakeCase(`${namespace}_http_requests`)
		this.#evictionInterval = evictionInterval
	}

	public override async ready(): Promise<this> {
		await fs.mkdir(this.storagePath.dirname(), { recursive: true })
		await super.ready()

		await this.query(/* sql */ `
			CREATE TABLE IF NOT EXISTS ${this.#tableName} (
				'cache_key' text PRIMARY KEY NOT NULL,
				'storage_value' blob NOT NULL,
				'expires_at' integer,
				'created_at' integer AS (storage_value -> 'createdAt') VIRTUAL,
				'ttl' integer AS (storage_value -> 'ttl') VIRTUAL
			)`)

		await this.query(/* sql */ `
			CREATE INDEX IF NOT EXISTS "${this.#tableName}_http_requests_created_at_idx" ON
			${this.#tableName} (created_at)
		`)

		await this.query(/* sql */ `
			CREATE INDEX IF NOT EXISTS "${this.#tableName}_http_requests_expires_at_idx" ON
			${this.#tableName} (expires_at)
		`)

		this.#startEvictionInterval(this.#evictionInterval)

		return this
	}

	#startEvictionInterval = (nextEvivtionInternal: number) => {
		clearInterval(this.#evictionTimeout)

		if (nextEvivtionInternal === -1) return

		this.#evictionTimeout = setInterval(this.evictExpiredEntries, nextEvivtionInternal)
	}

	public evictExpiredEntries = async (): Promise<void> => {
		if (ServiceSymbol.isDisposed(this)) return

		await this.query(
			/* sql */ `
			DELETE FROM ${this.#tableName}
			WHERE expires_at < :now;
		`,
			[Date.now()]
		)
	}

	public find = async (cacheKey: string, _currentRequest?: CacheRequestConfig): Promise<StorageValue | undefined> => {
		// Note that we have to use the query builder to perform a jsonb select.

		const query = await this.query<Stringified<HTTPRequestCacheEntry>[]>(
			/* sql */ `
			SELECT
				cache_key,
				expires_at,
				json(storage_value) as storage_value
			FROM ${this.#tableName}
			WHERE cache_key = :cache_key
			LIMIT 1;
			`,
			[cacheKey]
		)

		const [entry] = query

		if (!entry) return

		return tryParsingJSON<StorageValue>(entry.storage_value, undefined)
	}
	public clear = async (): Promise<void> => {
		await this.query(/* sql */ `
			DELETE FROM ${this.#tableName};
			DELETE FROM SQLITE_SEQUENCE WHERE name='TableName';
		`)
	}

	public set = async (cacheKey: string, value: NotEmptyStorageValue, req?: CacheRequestConfig): Promise<void> => {
		// Note that we have to use the query builder to perform a jsonb upsert.
		const now = Date.now()
		let expiresAt: number | null = null

		if (value.state === "loading") {
			const ttl = req?.cache && typeof req.cache.ttl === "number" ? req.cache.ttl : 60_000
			expiresAt = now + ttl
		} else if ((value.state === "stale" && value.ttl) || (value.state === "cached" && !canStale(value))) {
			// When a stale state has a determined value to expire, we can use it.
			// Or if the cached value cannot enter in stale state...

			expiresAt = value.createdAt + value.ttl!
			// otherwise, we can't determine when it should expire, so we keep it indefinitely.
		}

		await this.query(
			/* sql */ `
			INSERT INTO ${this.#tableName} (cache_key, expires_at, storage_value)
			VALUES (:cache_key, :expires_at, jsonb(:storage_value))
			ON CONFLICT (cache_key)
			DO UPDATE SET
				expires_at = EXCLUDED.expires_at,
				storage_value = EXCLUDED.storage_value;
			`,
			[cacheKey, expiresAt, JSON.stringify(value)]
		)
	}

	public remove = async (cacheKey: string, _currentRequest?: CacheRequestConfig): Promise<void> => {
		await this.query(
			/* sql */ `
			DELETE FROM ${this.#tableName}
			WHERE cache_key = :cache_key;
		`,
			[cacheKey]
		)
	}

	/**
	 * Converts this data source to an storage instance for Axios Cache Interceptor.
	 */
	public toAxiosStorage(): AxiosStorage {
		return buildStorage(this)
	}

	public override [Symbol.asyncDispose](): Promise<void> {
		clearInterval(this.#evictionTimeout)

		return super[Symbol.asyncDispose]()
	}
}
