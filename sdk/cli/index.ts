/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Utilities for working with Yargs CLI commands.
 */

import { CamelCase } from "type-fest"

/**
 * Convert literal string types like 'foo-bar' to 'fooBar', allowing all `PropertyKey` types.
 *
 * @internal
 */
export type CamelCaseKey<K extends PropertyKey> = K extends string ? Exclude<CamelCase<K>, ""> : K

/**
 * Command handler arguments, with all keys available in camelCase.
 */
export type StrictArgs<T> = { [key in keyof T as key | CamelCaseKey<key>]: T[key] } & {
	/**
	 * Non-option arguments
	 */
	_: Array<string | number>
	/**
	 * The script name or node command
	 */
	$0: string
}

/**
 * The keys of `StrictArgs`.
 */
export type StrictArgKeys<T> = keyof StrictArgs<T>

/**
 * A command handler, as used by yargs.
 */
export type CommandHandler<T = unknown> = (args: StrictArgs<T>) => void | Promise<void>
