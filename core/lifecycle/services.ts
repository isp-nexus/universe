/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file Utilities for creating branded nominal types.
 */

import { ResourceError } from "../errors/schema.js"
import { ConsoleLogger } from "../logging/index.js"
import { ServiceSymbol } from "./ServiceSymbol.js"

//#region Asynchronous

/**
 * Type definition for a class which implements the AsyncDisposable interface.
 *
 * @category Utilities
 * @internal
 */
export type ServiceConstructor<T> = new (...args: any[]) => T & AsyncDisposable

/**
 * Type-predicate to determine if a given input is a ServiceConstructor, i.e. a function which is a
 * constructor for a class which implements the AsyncDisposable interface.
 */
export function isServiceConstructor<T>(input: unknown): input is ServiceConstructor<T> {
	return typeof input === "function" && typeof input.prototype?.[Symbol.asyncDispose] === "function"
}

//#endregion

//#region Service Registry

/**
 * Type definition for a function which returns an instance which implements the AsyncDisposable
 * interface.
 *
 * @category Utilities
 * @internal
 */
export type ServiceCallback<T extends AsyncDisposable> = {
	(abortController: AbortController): Promise<T> | T
}

export type ServiceResolver<T extends AsyncDisposable = AsyncDisposable> =
	| T
	| ServiceCallback<T>
	| ServiceConstructor<T>

/**
 * Utility class for managing the lifecycle of services.
 */
export class ServiceRepository<T extends AsyncDisposable = AsyncDisposable> implements PromiseLike<T>, AsyncDisposable {
	static #Registry = new Map<ServiceResolver<any>, ServiceRepository<any>>()

	/**
	 * Inspect the current state of the service registry.
	 */
	static inspect(): ServiceRepository<any>[] {
		const services = [...this.#Registry.values()].reverse()

		return services
	}

	/**
	 * Dispose of all services in the registry.
	 */
	static async [Symbol.asyncDispose](): Promise<void> {
		const services = ServiceRepository.inspect()

		ConsoleLogger.debug(`🚮 Disposing ${services.length} services...`)

		for (const service of services) {
			const label = String(service.#instance)
			ConsoleLogger.debug(`[${label}] Disposing...`)

			const marked = ServiceSymbol.markAsDisposed(service.#instance)

			if (!marked) continue

			await service[Symbol.asyncDispose]()
		}

		this.#Registry.clear()
	}

	/**
	 * Dispose of all services in the registry.
	 */
	static dispose(): Promise<void> {
		return this[Symbol.asyncDispose]()
	}

	/**
	 * Internal instance of the service.
	 */
	#instance: T | null = null

	/**
	 * Internal resolver for the service.
	 */
	#resolver?: ServiceResolver<T>

	static register<T extends AsyncDisposable>(interfaceLike?: never): ServiceRepository<T>
	static register<T extends AsyncDisposable>(service: T): ServiceRepository<T>
	static register<T extends AsyncDisposable>(serviceCallback: ServiceCallback<T>): ServiceRepository<T>
	static register<T extends AsyncDisposable>(ServiceConstructor: ServiceConstructor<T>): ServiceRepository<T>
	static register<T extends AsyncDisposable>(resolver: ServiceResolver<T>): ServiceRepository<T>
	static register<T extends AsyncDisposable>(resolver: ServiceResolver<T>): ServiceRepository<T> {
		return new ServiceRepository<T>(resolver)
	}

	/**
	 * Abort controller for the service repository.
	 */
	static readonly abortController = new AbortController()

	protected constructor(resolver: ServiceResolver<T>) {
		this.#resolver = resolver
	}

	/**
	 * Given an instance of a service, attach it to the resolver.
	 *
	 * This can be used to attach a service that was created outside of the resolver, such as when a
	 * resolver is defined from a TypeScript interface.
	 */
	public attach(service: T): void {
		this.#instance = service
	}

	protected async resolve(): Promise<T> {
		if (this.#instance) return this.#instance

		if (!this.#resolver)
			throw ResourceError.from(
				500,
				"Cannot resolve service without a resolver. Did you mean to call `attach` before calling `resolve`?"
			)

		if (typeof this.#resolver === "function") {
			if (isServiceConstructor(this.#resolver)) {
				this.#instance = new this.#resolver()
				return this.#instance
			}

			const nextInstance = await this.#resolver(ServiceRepository.abortController)

			if (ServiceSymbol.isAsyncInitializable(nextInstance)) {
				await nextInstance[ServiceSymbol.asyncInit]()
			}

			this.#instance = nextInstance
			return this.#instance
		}

		if (typeof this.#resolver === "object") {
			const nextInstance = this.#resolver

			if (ServiceSymbol.isAsyncInitializable(nextInstance)) {
				await nextInstance[ServiceSymbol.asyncInit]()
			}

			this.#instance = nextInstance

			return this.#instance
		}

		throw ResourceError.from(500, `Invalid resolver type. ${this.#resolver}`)
	}

	public then<TResult1 = T, TResult2 = never>(
		onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
	): PromiseLike<TResult1 | TResult2> {
		return this.resolve()
			.then((instance) => {
				if (!this.#resolver) {
					throw ResourceError.from(500, "Service resolver was disposed before service was resolved.")
				}

				ServiceRepository.#Registry.set(this.#resolver, this)
				return instance
			})
			.then(onfulfilled, onrejected)
	}

	public async [Symbol.asyncDispose](): Promise<void> {
		if (!this.#instance) {
			ConsoleLogger.warn("Attempted to dispose a service resolver without a service!")
			return
		}

		if (typeof this.#instance[Symbol.asyncDispose] !== "function") {
			ConsoleLogger.warn("Attempted to dispose a service resolver without a disposable service!")
			return
		}

		await this.#instance[Symbol.asyncDispose]()
	}
}
