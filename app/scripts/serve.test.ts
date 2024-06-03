/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ConsoleLogger } from "@isp.nexus/core/logging"
import { $public } from "@isp.nexus/sdk"
import { runScript } from "@isp.nexus/sdk/reflection"
import { createISPNexusClient } from "../trpc/client.js"
import { initializeAppServer } from "./serve.js"

// const result = await client.findGeoFeatureByBlockID.query("360610100002001").catch(logScriptError)
// logger.info(JSON.stringify(result, null, "\t"))
// const result = await client.findGeoFeaturesWithinBBox
// 	.query([-73.78394710709753, 40.85496734268477, -73.78061811293166, 40.85636234845039])
// 	.catch(logScriptError)

// logger.info(result)

await runScript(async () => {
	const _webService = await initializeAppServer()

	const logger = ConsoleLogger.withPrefix("app")

	logger.info("Starting client...")
	const _client = createISPNexusClient({
		batchLinkURL: $public.ISP_NEXUS_APP_URL,
	})

	logger.info("Querying...")
})
