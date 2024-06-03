/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

// import {Tagged} from 'type-fest'
// const CommandPrefix = "nexus."
// type CommandPrefix = typeof CommandPrefix

/**
 * Convenience function for creating command IDs.
 */
export function CommandID<T extends string>(command: T): CommandID<T> {
	return command as CommandID<T>
}

export type CommandID<T extends string = string> = T & { __commandID: never }
