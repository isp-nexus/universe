/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { platform } from "node:os"
import { $ } from "zx"
/**
 * Copy the given input to the OS clipboard.
 */
export async function copyToClipboard(json: object): Promise<void>
export async function copyToClipboard(input: string): Promise<void>
export async function copyToClipboard(input: unknown): Promise<void> {
	if (platform() !== "darwin") return

	const normalizedInput = typeof input === "string" ? input : JSON.stringify(input, null, "\t")

	$.env["LC_CTYPE"] = "UTF-8" // Ensure pbcopy works with UTF-8

	const command = $`echo ${normalizedInput} | pbcopy`

	await command
}
