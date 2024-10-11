/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Utilities for working with version control, such as Git.
 */

import { repoRootPathBuilder } from "@isp.nexus/sdk/repo-paths"
import { execSync } from "node:child_process"
import { existsSync } from "node:fs"

/**
 * Reads the last commit hash from the current git repository.
 *
 * @category Utilities
 * @category Version Control
 * @returns Git commitish if available, otherwise `null`.
 * @internal
 */
export function readLastGitCommit(): string | null {
	// Are we in a git repository?
	if (!existsSync(repoRootPathBuilder(".git"))) {
		return null
	}

	try {
		const commit = execSync("git rev-parse HEAD").toString().trim()

		return commit.slice(0, 7)
	} catch (_error) {
		console.debug("Git commit could not be read.")
	}

	return null
}
