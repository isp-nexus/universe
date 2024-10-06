#!/usr/bin/env node
/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Command-line interface ISP Nexus's data sync tool.
 */

import "urlpattern-polyfill"

import { logScriptError, postScriptCleanup } from "@isp.nexus/sdk/reflection"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { CLICommands } from "./commands/index.js"

process.on("SIGINT", postScriptCleanup)
process.on("SIGTERM", postScriptCleanup)

const yargsInstance = yargs(hideBin(process.argv))

yargsInstance
	// ---
	.scriptName("nexus-sync")
	.wrap(yargsInstance.terminalWidth())
	.version()
	.help()
	.demandCommand(1)
	.command(CLICommands)

try {
	await yargsInstance.parseAsync()
} catch (error) {
	logScriptError(error)
	postScriptCleanup("SIGTERM", 1)
}

await postScriptCleanup()
