/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ISPNexusPackage, ISPNexusPackages } from "@isp.nexus/core"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { PathBuilder, createPathBuilderResolver } from "path-ts"
import type { Join } from "type-fest"

//#region Type Constants

/**
 * Aliased path to the root of the repository.
 */
export type RepoRootAlias = "@isp.nexus"

/**
 * Compiled directory name for TS output files.
 *
 * @internal
 */
export const OutDirectoryName = "out"
export type OutDirectoryName = typeof OutDirectoryName

/**
 * Distribution directory name for production builds.
 *
 * @internal
 */
export const DistDirectoryName = "dist"
export type DistDirectoryName = typeof DistDirectoryName

export enum DistributionName {
	"schema",
	"app",
}

/**
 * Path segments to this file, post-compilation.
 *
 * @internal
 */
const PathReflection = ["sdk", "out", "reflection"] as const satisfies [ISPNexusPackage, OutDirectoryName, "reflection"]
type PathReflection = typeof PathReflection

/**
 * The directory path of the current file, post-compilation.
 */
const __dirname = dirname(fileURLToPath(import.meta.url)) as Join<[RepoRootAlias, ...PathReflection], "/">

/**
 * The absolute path to the root of the repository.
 */
const RepoRootAbsolutePath = resolve(__dirname, ...PathReflection.map(() => ".."))
type RepoRootAbsolutePath = RepoRootAlias

//#endregion

//#region Path Builders

/**
 * Path builder relative to the repo root.
 */
export const repoRootPathBuilder = createPathBuilderResolver<RepoRootAlias>(RepoRootAbsolutePath)

/**
 * Path builder relative to the package root.
 */
export function packagePathBuilder<P extends ISPNexusPackage, S extends string[]>(
	packageName: P,
	...pathSegments: S
): PathBuilder<Join<[RepoRootAlias, P, ...S], "/">> & string {
	return repoRootPathBuilder(packageName, ...pathSegments) as any
}

/**
 * Path builder relative to the package's output directory.
 */
export function packageOutPathBuilder<P extends ISPNexusPackage, S extends string[]>(
	packageName: P,
	...pathSegments: S
): PathBuilder<Join<[RepoRootAlias, P, OutDirectoryName, ...S], "/">> & string {
	return packagePathBuilder(packageName, OutDirectoryName, ...pathSegments)
}

/**
 * Path builder relative to the package's distribution directory.
 */
export function packageDistPathBuilder<P extends ISPNexusPackage, S extends string[]>(
	packageName: P,
	...pathSegments: S
): PathBuilder<Join<[RepoRootAlias, P, DistDirectoryName, ...S], "/">> & string {
	return packagePathBuilder(packageName, DistDirectoryName, ...pathSegments)
}

//#endregion

type ISPNexusPackagePathRecord = {
	[P in ISPNexusPackage]: Join<[RepoRootAlias, P], "/">
}

/**
 * Absolute paths to the root of each package in the ISP Nexus mono-repo.
 */
export const ISPNexusPackagePath = {
	[Symbol.for("nodejs.util.inspect.custom")]: () =>
		`ISPNexusPackagePath<${Object.keys(ISPNexusPackagePath).join(" | ")}>`,
} as ISPNexusPackagePathRecord

for (const packageName of ISPNexusPackages) {
	;(ISPNexusPackagePath as any)[packageName] = packagePathBuilder(packageName)
}

//#endregion
