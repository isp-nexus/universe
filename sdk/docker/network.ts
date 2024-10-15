/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { assertShellResolvesPath } from "@isp.nexus/sdk/runner"
import { $ } from "zx"

export async function createNetwork(networkName: string): Promise<void> {
	await assertShellResolvesPath("docker")
	await $`docker network create ${networkName}_default &>/dev/null || true`
}
