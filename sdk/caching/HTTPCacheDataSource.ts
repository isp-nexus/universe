/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { SetLike, simpleSHA3, smartSnakeCase, tryParsingJSON } from "@isp.nexus/core"
import { ServiceSymbol } from "@isp.nexus/core/lifecycle"
import { MemoryDBStoragePath, NexusDataSource } from "@isp.nexus/sdk"
import { Method } from "axios"
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
import { PathBuilderLike } from "path-ts"
import { configure as createStringifier } from "safe-stable-stringify"
import { JsonObject, JsonPrimitive, JsonValue, Stringified } from "type-fest"

/**
 * Serialized Axios request.
 *
 * @category API
 */
export interface SerializedAxiosRequest {
	method: Method
	url?: string
	params?: JsonObject
	data?: JsonValue
}

export interface HTTPRequestCacheEntry {
	cache_key: string
	storage_value: StorageValue
	expires_at: number | null
	created_at: number
	ttl: number
	request: SerializedAxiosRequest | null
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

	/**
	 * A set of values to omit from the serialization, such as sensitive data.
	 */
	omissions?: SetLike<JsonPrimitive>
}

export class HTTPCacheDataSource extends NexusDataSource implements BuildStorage {
	protected static readonly stringifyJSON = createStringifier({
		bigint: false,
	})
	/**
	 * Generate a cache key for a request.
	 */
	public static generateCacheKey<R = unknown, D = unknown>(config: CacheRequestConfig<R, D>): string {
		if (config.id) return config.id

		return simpleSHA3([HTTPCacheDataSource.stringifyJSON(config)])
	}

	/**
	 * Serialize a request configuration into a string.
	 */
	protected serializeRequest<R = unknown, D = unknown>(
		config?: CacheRequestConfig<R, D>
	): SerializedAxiosRequest | null {
		if (!config) return null

		let url: URL | undefined

		if (config.baseURL) {
			url = config.url ? new URL(config.url, config.baseURL) : new URL(config.baseURL)
		} else if (config.url) {
			url = config.url.startsWith("http") ? new URL(config.url) : new URL(config.url, "http://localhost")
		}

		const method = (config.method?.toLowerCase() || "GET") as Method

		let params: JsonObject | undefined

		if (config.params && typeof config.params === "object") {
			params = {}

			for (const [key, value] of Object.entries(config.params)) {
				params[key] = this.#omissions?.has(value) ? "[REDACTED]" : (value as JsonPrimitive)
			}
		}

		return {
			url: url?.toString(),
			params,
			method,
			data: config.data as any,
		}
	}

	#evictionTimeout: NodeJS.Timeout | undefined
	#evictionInterval: number
	#omissions: SetLike<JsonPrimitive> | null

	protected tableName: string

	constructor({ storagePath, namespace, omissions, evictionInterval = 60_000 }: HTTPCacheDataSourceOptions) {
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

		this.tableName = smartSnakeCase(`${namespace}_http_requests`)
		this.#evictionInterval = evictionInterval
		this.#omissions = omissions ?? null
	}

	public override async ready(): Promise<this> {
		if (this.storagePath !== MemoryDBStoragePath) {
			await fs.mkdir(this.storagePath.dirname(), { recursive: true })
		}

		await super.ready()

		const { tableName } = this

		await this.query(/* sql */ `
			CREATE TABLE IF NOT EXISTS ${tableName} (
				'cache_key'				TEXT PRIMARY KEY NOT NULL,
				'expires_at'			INTEGER,
				'storage_value' 	BLOB NOT NULL,
				'request'					BLOB,
				'created_at'			INTEGER	AS (storage_value -> 'createdAt') VIRTUAL,
				'ttl'							INTEGER	AS (storage_value -> 'ttl') VIRTUAL,
				'request_method'	TEXT 		AS (request -> 'method') VIRTUAL,
				'request_url'			TEXT 		AS (request -> 'url') VIRTUAL,
				'request_params'	TEXT 		AS (request -> 'params') VIRTUAL,
				'response_body'		TEXT 		AS (storage_value -> 'data' -> 'data') VIRTUAL
			);

			CREATE INDEX IF NOT EXISTS "${tableName}_created_at_idx" 			ON ${tableName} (created_at);
			CREATE INDEX IF NOT EXISTS "${tableName}_request_params_idx"	ON ${tableName} (request_params);
			CREATE INDEX IF NOT EXISTS "${tableName}_response_body_idx"		ON ${tableName} (response_body);
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
			DELETE FROM ${this.tableName}
			WHERE expires_at < :now;
		`,
			[Date.now()]
		)
	}

	public find = async (cacheKey: string, _config?: CacheRequestConfig): Promise<StorageValue | undefined> => {
		// Note that we have to use the query builder to perform a jsonb select.

		const query = await this.query<Stringified<HTTPRequestCacheEntry>[]>(
			/* sql */ `
			SELECT
				cache_key,
				expires_at,
				json(storage_value) as storage_value
			FROM ${this.tableName}
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
			DELETE FROM ${this.tableName};
			DELETE FROM SQLITE_SEQUENCE WHERE name='TableName';
		`)
	}

	public set = async (
		cacheKey: string,
		storageValue: NotEmptyStorageValue,
		config?: CacheRequestConfig
	): Promise<void> => {
		// Note that we have to use the query builder to perform a jsonb upsert.
		const now = Date.now()
		let expiresAt: number | null = null

		if (storageValue.state === "loading") {
			const ttl = config?.cache && typeof config.cache.ttl === "number" ? config.cache.ttl : 60_000
			expiresAt = now + ttl
		} else if (
			(storageValue.state === "stale" && storageValue.ttl) ||
			(storageValue.state === "cached" && !canStale(storageValue))
		) {
			// When a stale state has a determined value to expire, we can use it.
			// Or if the cached value cannot enter in stale state...

			expiresAt = storageValue.createdAt + storageValue.ttl!
			// otherwise, we can't determine when it should expire, so we keep it indefinitely.
		}

		await this.query(
			/* sql */ `
			INSERT INTO ${this.tableName} (cache_key, expires_at, storage_value, request)
			VALUES (:cache_key, :expires_at, jsonb(:storage_value), jsonb(:request))
			ON CONFLICT (cache_key)
			DO UPDATE SET
				expires_at = EXCLUDED.expires_at,
				storage_value = EXCLUDED.storage_value,
				request = EXCLUDED.request;
			`,
			[
				cacheKey,
				expiresAt,
				HTTPCacheDataSource.stringifyJSON(storageValue),
				HTTPCacheDataSource.stringifyJSON(this.serializeRequest(config)),
			]
		)
	}

	public remove = async (cacheKey: string, _config?: CacheRequestConfig): Promise<void> => {
		await this.query(
			/* sql */ `
			DELETE FROM ${this.tableName}
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
