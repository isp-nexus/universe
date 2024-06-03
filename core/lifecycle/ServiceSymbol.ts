/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ConsoleLogger } from "../logging/index.js"

/**
 * Supplemental interface for objects which can be further initialized asynchronously.
 */
export interface AsyncInitializable extends AsyncDisposable {
	/**
	 * A method which can be called to asynchronously construct the object.
	 */
	[ServiceSymbol.asyncInit](...args: any[]): Promise<this>

	/**
	 * Alias for the `AsyncInitSymbol` method.
	 */
	ready?(...args: any[]): Promise<this>
}

/**
 * Type definition for a class which implements the AsyncInitializable interface.
 */
export type AsyncInitializableConstructor<T> = T extends new (...args: any[]) => AsyncInitializable
	? new (...args: ConstructorParameters<T>) => T
	: never

/**
 * Symbol extensions associated with a service lifecycle.
 *
 * @singleton
 * @static
 */
export class ServiceSymbol {
	private constructor() {
		throw new Error("Cannot instantiate static class.")
	}

	/**
	 * Global symbol for the AsyncConstructable interface.
	 */
	public static readonly asyncInit: unique symbol = Symbol.for("asyncInit")

	/**
	 * Global symbol to mark an object as disposed.
	 */
	public static readonly asyncDisposed: unique symbol = Symbol.for("asyncDisposed")

	/**
	 * Mark an object as disposed.
	 */
	public static markAsDisposed(disposable: AsyncDisposable): boolean {
		if (ServiceSymbol.asyncDisposed in disposable) {
			ConsoleLogger.warn(`[${disposable}] Already disposed!`)
			return false
		}

		Object.assign(disposable, { AsyncDisposedSymbol: true })

		return true
	}

	/**
	 * Type-predicate to determine if an object has been disposed.
	 */
	public static isDisposed(disposable: AsyncDisposable): boolean {
		return ServiceSymbol.asyncDisposed in disposable
	}

	/**
	 * Type-predicate to determine if a given input is an object which implements the
	 * `AsyncInitializable` interface.
	 */
	public static isAsyncInitializable(input: AsyncDisposable): input is AsyncInitializable {
		return ServiceSymbol.asyncInit in input && typeof input[ServiceSymbol.asyncInit] === "function"
	}

	public static toString() {
		return "ServiceSymbol"
	}
}
