/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Utilities for creating branded nominal types.
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
	if (typeof input !== "function") return false
	if (!input.prototype || typeof input.prototype !== "object") return false

	return Object.hasOwn(input.prototype, Symbol.asyncDispose) || Object.hasOwn(input.prototype, ServiceSymbol.asyncInit)
}

//#endregion

//#region Service Registry

/**
 * Stateful context for a service registry.
 *
 * This is used to provide a context for services during resolution.
 */
export interface ServiceRegistryContext {
	abortController: AbortController
}

/**
 * Type definition for a function which returns an instance which implements the AsyncDisposable
 * interface.
 *
 * @category Utilities
 * @internal
 */
export type ServiceCallback<T extends AsyncDisposable> = {
	(context: ServiceRegistryContext): Promise<T> | T
}

export type ServiceResolver<T extends AsyncDisposable = AsyncDisposable> =
	| T
	| ServiceCallback<T>
	| ServiceConstructor<T>

const kInstance = Symbol.for("ServiceInstance")
const kResolver = Symbol.for("ServiceResolver")
const kRegistryMap = Symbol.for("ServiceRepositoryMap")

/**
 * Given a service which may not yet be resolved, intercept any method calls and resolve the service
 * before invoking the method.
 *
 * @category Services
 */
export type ServiceMethodResolver<T> = {
	[K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => Promise<Awaited<R>> : T[K]
}

/**
 * Promise-like wrapper for asynchronous services.
 *
 * @see {@linkcode ServiceRepository} for usage.
 */
export class Service<T extends AsyncDisposable = AsyncDisposable> implements PromiseLike<T>, AsyncDisposable {
	/**
	 * Instance of the service.
	 *
	 * @internal
	 */
	public [kInstance]: T | null = null

	/**
	 * Resolver for the service.
	 *
	 * @internal
	 */
	public [kResolver]?: ServiceResolver<T>

	/**
	 * Context for the parent service registry.
	 */
	public readonly context: ServiceRegistryContext

	protected constructor(resolver: ServiceResolver<T>) {
		this[kResolver] = resolver

		this.context = {
			abortController: ServiceRepository.abortController,
		}
	}

	/**
	 * Given an instance of a service, attach it to the resolver.
	 *
	 * This can be used to attach a service that was created outside of the resolver, such as when a
	 * resolver is defined from a TypeScript interface.
	 *
	 * @internal
	 */
	public attach(service: T): void {
		this[kInstance] = service
	}

	/**
	 * Resolve the service instance.
	 *
	 * This method is called implicitly when the service is awaited.
	 */
	protected async resolve(): Promise<T> {
		if (this[kInstance]) return this[kInstance]

		if (!this[kResolver])
			throw ResourceError.from(
				500,
				"Cannot resolve service without a resolver. Did you mean to call `attach` before calling `resolve`?"
			)

		if (typeof this[kResolver] === "function") {
			if (isServiceConstructor(this[kResolver])) {
				this[kInstance] = new this[kResolver]()
				return this[kInstance]
			}

			const nextInstance = await this[kResolver](this.context)

			if (ServiceSymbol.isAsyncInitializable(nextInstance)) {
				await nextInstance[ServiceSymbol.asyncInit]()
			}

			this[kInstance] = nextInstance
			return this[kInstance]
		}

		if (typeof this[kResolver] === "object") {
			const nextInstance = this[kResolver]

			if (ServiceSymbol.isAsyncInitializable(nextInstance)) {
				await nextInstance[ServiceSymbol.asyncInit]()
			}

			this[kInstance] = nextInstance

			return this[kInstance]
		}

		throw ResourceError.from(500, `Invalid resolver type. ${this[kResolver]}`)
	}

	/**
	 * Resolve the service instance. Called implicitly when the service is awaited.
	 */
	public then<TResult1 = T, TResult2 = never>(
		onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
	): Promise<TResult1 | TResult2> {
		return this.resolve()
			.then((instance) => {
				if (!this[kResolver]) {
					throw ResourceError.from(500, "Service resolver was disposed before service was resolved.")
				}

				ServiceRepository[kRegistryMap].set(this[kResolver], this)
				return instance
			})
			.then(onfulfilled, onrejected)
	}

	public async [Symbol.asyncDispose](): Promise<void> {
		if (!this[kInstance]) {
			ConsoleLogger.warn("Attempted to dispose a service resolver without a service!")
			return
		}

		if (typeof this[kInstance][Symbol.asyncDispose] !== "function") {
			ConsoleLogger.warn("Attempted to dispose a service resolver without a disposable service!")
			return
		}

		await this[kInstance][Symbol.asyncDispose]()
	}
}

/**
 * Service repository for managing asynchronous services.
 *
 * @singleton
 */
export class ServiceRepository extends Service<AsyncDisposable> {
	static readonly [kRegistryMap] = new Map<ServiceResolver<any>, Service<any>>()

	/**
	 * Abort controller for the service repository.
	 */
	static readonly abortController = new AbortController()

	/**
	 * Inspect the current state of the service registry.
	 */
	static inspect(): Service<any>[] {
		const services = [...this[kRegistryMap].values()].reverse()

		return services
	}

	/**
	 * Dispose of all services in the registry.
	 */
	static async [Symbol.asyncDispose](): Promise<void> {
		const services = ServiceRepository.inspect()

		ConsoleLogger.debug(`🚮 Disposing ${services.length} services...`)

		for (const service of services) {
			const label = String(service[kInstance])
			ConsoleLogger.debug(`[${label}] Disposing...`)

			const marked = ServiceSymbol.markAsDisposed(service[kInstance])

			if (!marked) continue

			await service[Symbol.asyncDispose]()
		}

		this[kRegistryMap].clear()
	}

	/**
	 * Dispose of all services in the registry.
	 */
	static dispose(): Promise<void> {
		return this[Symbol.asyncDispose]()
	}

	/**
	 * Register a pre-initialized service with the service repository.
	 *
	 * @param service - An instance of a service.
	 */
	static register<T extends AsyncDisposable>(service: T): Service<T> & ServiceMethodResolver<T>
	/**
	 * Register a service resolver with the service repository.
	 *
	 * @param serviceCallback - A callback which returns a service instance.
	 */
	static register<T extends AsyncDisposable>(serviceCallback: ServiceCallback<T>): Service<T> & ServiceMethodResolver<T>

	/**
	 * Register a service constructor with the service repository.
	 *
	 * @param ServiceConstructor - A constructor which returns a service instance.
	 */
	static register<T extends AsyncDisposable>(
		ServiceConstructor: ServiceConstructor<T>
	): Service<T> & ServiceMethodResolver<T>
	/**
	 * Register a service with the service repository.
	 *
	 * @param resolver - A service resolver, instance, or constructor.
	 */
	static register<T extends AsyncDisposable>(resolver: ServiceResolver<T>): Service<T> & ServiceMethodResolver<T>
	static register<T extends AsyncDisposable>(resolver: ServiceResolver<T>): Service<T> & ServiceMethodResolver<T> {
		const service = new Service<T>(resolver)

		const serviceMethodResolver = new Proxy(service as Service<T> & T, {
			get(target, prop) {
				if (prop in target) {
					return (target as any)[prop]
				}

				return async (...args: any[]) => {
					const instance = (await target) as T

					if (typeof (instance as any)[prop] === "function") {
						return (instance as any)[prop](...args)
					}

					return (instance as any)[prop]
				}
			},

			[Symbol.for("nodejs.util.inspect.custom")]() {
				return "ServiceMethodResolver"
			},
		})

		return serviceMethodResolver as Service<T> & ServiceMethodResolver<T>
	}

	constructor() {
		if (new.target === ServiceRepository) {
			throw new TypeError("Cannot instantiate static class `ServiceRepository`.")
		}

		super(null as never)
	}
}
