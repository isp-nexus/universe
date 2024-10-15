/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createPathBuilderResolver } from "path-ts"
import type { Join } from "type-fest"

//#region Type Constants

/**
 * Aliased path to the root of the repository.
 */
export type RepoRootAlias = "@isp.nexus"

/**
 * ISP Nexus SDK package name.
 *
 * @internal
 */
export const SDKDirectoryName = "sdk"
export type SDKDirectoryName = typeof SDKDirectoryName

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
const PathReflection = [SDKDirectoryName, OutDirectoryName, "monorepo"] as const
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

//#endregion
