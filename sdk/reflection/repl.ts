/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   ISP Nexus SDK reflection REPL
 *
 *   This script is used to inject Nexus modules into Node.js's interactive REPL environment, allowing
 *   developers to interact with the SDK's modules without having to import them manually.
 */

type MonorepoPackageJSON = typeof import("../../package.json")
import type { ISPNexusPackage } from "@isp.nexus/core"

type NexusREPL = {
	[P in ISPNexusPackage]: Record<string, unknown>
}

if (!process.env["REPL_ID"]) {
	process.env["REPL_ID"] = crypto.randomUUID()

	const { readLocalJSONFile } = await import("@isp.nexus/sdk/files")
	const { repoRootPathBuilder } = await import("@isp.nexus/sdk/reflection")

	const monorepoPackageJSON = await readLocalJSONFile<MonorepoPackageJSON>(repoRootPathBuilder("package.json"))
	const workspaces = monorepoPackageJSON.workspaces as ISPNexusPackage[]

	const nexus: NexusREPL = {} as NexusREPL
	const loadedModuleNames: ISPNexusPackage[] = []

	for (const workspace of workspaces) {
		const moduleName = `@isp.nexus/${workspace}`
		const mod = await import(moduleName).catch(() => null)

		if (!mod || typeof mod !== "object") continue

		nexus[workspace] = mod
		loadedModuleNames.push(workspace)
	}

	Object.assign(nexus, {
		[Symbol.for("nodejs.util.inspect.custom")]: () => {
			return Object.fromEntries(loadedModuleNames.map((name) => [name, Object.keys(nexus[name])]))
		},
	})

	Object.assign(globalThis, { nexus })
}
