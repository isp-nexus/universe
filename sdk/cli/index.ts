/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Utilities for working with Yargs CLI commands.
 */

import { ArgumentsCamelCase } from "yargs"

/**
 * A command handler, as used by yargs.
 */
export type CommandHandler<T = unknown> = (args: ArgumentsCamelCase<T>) => void | Promise<void>
