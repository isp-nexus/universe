/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Mono-repo package names and utilities.
 */

import { InferTupleMember, tuple } from "@isp.nexus/core"
import { PathBuilder } from "path-ts"
import { Join } from "type-fest"
import { DistDirectoryName, OutDirectoryName, RepoRootAlias, repoRootPathBuilder } from "./root.js"

/**
 * Packages used in the ISP Nexus mono-repo.
 *
 * @internal
 */
export const ISPNexusPackages = tuple(
	// ---
	"core",
	"path-ts",
	"spatial",
	"tiger",
	"fcc",
	"mailwoman",
	"cartographer",
	"sdk",
	"sync",
	"pelias",
	"api",
	"vaxis",
	"site",
	"schema"
)

/**
 * Valid package names for ISP Nexus.
 *
 * @internal
 */
export type ISPNexusPackage = InferTupleMember<typeof ISPNexusPackages>

/**
 * Type-signature for a package-scoped function.
 *
 * This is used to ensure that the function is only called with a valid package name, while avoiding
 * the ceremony of carrying around the package name as a typed parameter.
 *
 * @internal
 */
export type ISPNexusPackageFn<PackageName extends ISPNexusPackage = ISPNexusPackage, Result = unknown> = (
	packageName: PackageName
) => Promise<Result>

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
