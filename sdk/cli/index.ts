/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file Utilities for working with Yargs CLI commands.
 */

import { ArgumentsCamelCase } from "yargs"

/**
 * A command handler, as used by yargs.
 */
export type CommandHandler<T = {}> = (args: ArgumentsCamelCase<T>) => void | Promise<void>
