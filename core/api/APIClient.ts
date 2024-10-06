/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import "@isp.nexus/core/polyfills/promises/withResolvers"

import { ConsoleLogger, type IRuntimeLogger } from "@isp.nexus/core/logging"
import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, CreateAxiosDefaults } from "axios"
import { delegateAxiosError } from "./responses.js"

export type { IRuntimeLogger }

/**
 * Configuration for an API client.
 */
export interface APIClientConfig {
	/**
	 * The logged display name of the API client.
	 */
	displayName: string

	/**
	 * The path a local cache directory.
	 */
	localCachePath?: string

	/**
	 * How many requests to make per minute before enforcing a cooldown.
	 */
	requestsPerMinute?: number

	/**
	 * Axios configuration.
	 */
	axios: CreateAxiosDefaults
}

/**
 * A base class for API clients used in ISP Nexus.
 */
export class APIClient<C extends APIClientConfig> extends EventTarget implements AsyncDisposable {
	public readonly config: C

	#cooldownWithResolvers: PromiseWithResolvers<void> | null = null
	#requestInterval = 0
	#requestCountWithinCooldown = 0
	#lastRequestTime = 0

	public get $cooldown(): Promise<void> {
		return this.#cooldownWithResolvers?.promise || Promise.resolve()
	}

	/**
	 * The prefixed logger for the API client.
	 */
	public readonly logger: IRuntimeLogger
	/**
	 * The Axios instance for the API client.
	 */
	public readonly axios: AxiosInstance

	public get baseURL(): string | undefined {
		return this.config.axios.baseURL
	}

	public get localCachePath(): C["localCachePath"] {
		return this.config.localCachePath
	}

	constructor(config: C) {
		super()

		this.config = config
		this.logger = ConsoleLogger.withPrefix(config.displayName)

		this.axios = Axios.create({
			...config.axios,
		})

		this.axios.interceptors.response.use(undefined, delegateAxiosError)

		this.#requestInterval = typeof config.requestsPerMinute === "number" ? 60000 / config.requestsPerMinute : 0

		if (this.#requestInterval) {
			this.axios.interceptors.response.use(this.updateCooldownAfterResponse)
		}
	}

	public fetch = async <T>(options: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
		await this.$cooldown

		const method = options.method?.toUpperCase() || "GET"
		this.logger.debug(`${method}: ${options.url}`)
		return this.axios(options)
	}

	protected setCooldown = (nextCooldown: number): void => {
		const nextCooldownWithResolvers = Promise.withResolvers<void>()

		setTimeout(() => {
			this.#requestCountWithinCooldown = 0
			nextCooldownWithResolvers.resolve()

			this.dispatchEvent(new Event("cooldown_end"))
		}, nextCooldown)

		this.#cooldownWithResolvers = nextCooldownWithResolvers
		this.dispatchEvent(new Event("cooldown_start"))
	}

	protected updateCooldownAfterResponse = (response: AxiosResponse): AxiosResponse<any, any> => {
		this.#cooldownWithResolvers?.resolve()
		const now = Date.now()
		const previousRequestTime = this.#lastRequestTime
		this.#lastRequestTime = now

		if (!this.config.requestsPerMinute) return response

		this.#requestCountWithinCooldown++

		const elapsed = now - previousRequestTime
		const cooldown = this.#requestInterval - elapsed

		if (this.#requestCountWithinCooldown >= this.config.requestsPerMinute) {
			this.setCooldown(cooldown)
		}

		return response
	}

	public [Symbol.asyncDispose](): Promise<void> {
		this.#cooldownWithResolvers?.resolve()
		return Promise.resolve()
	}

	public override toString() {
		return `${this.config.displayName} API Client`
	}
}
