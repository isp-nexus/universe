/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ConsoleLogger } from "@isp.nexus/core/logging"
import { createEliasticSchema, startElastic } from "@isp.nexus/pelias/services/elasticsearch"
import { $PeliasComposer } from "@isp.nexus/pelias/services/runtime"
import { runScript } from "@isp.nexus/sdk/runner"

await runScript(async () => {
	ConsoleLogger.info("Pulling Pelias Docker images...")

	await $PeliasComposer.pullAll()

	ConsoleLogger.info("Starting Elasticsearch...")

	await startElastic()
	await createEliasticSchema()

	ConsoleLogger.info("Pelias ready.")
})
