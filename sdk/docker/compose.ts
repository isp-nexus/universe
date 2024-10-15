/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { IDockerComposeResult } from "docker-compose"

/**
 * Delegate the result of a Docker Compose operation.
 *
 * @throws {ResourceError} If the operation failed.
 */
export function delegateComposeResult(result: IDockerComposeResult): IDockerComposeResult {
	if (result.exitCode !== 0) {
		ConsoleLogger.error(result.err)
		throw ResourceError.from(500, "Docker Compose failed.")
	}

	if (result.out) {
		ConsoleLogger.info(result.out)
	}

	return result
}
