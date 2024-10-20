/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { findPostalAddress } from "./postal/operations.js"

const logger = ConsoleLogger.withPrefix("Test")

await findPostalAddress("1600 Pennsylvania Ave NW, Washington, DC 20500").then((result) => {
	logger.info(JSON.stringify(result, null, "\t"))
})

await ServiceRepository.dispose()
