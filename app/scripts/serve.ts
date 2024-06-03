/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { readCertFiles } from "@isp.nexus/sdk/files"
import { runScript } from "@isp.nexus/sdk/reflection"
import { WebService } from "../web/WebService.js"

/**
 * Creates a new web service and listens for incoming requests.
 */
export async function initializeAppServer() {
	const tls = await readCertFiles()

	const webService = new WebService({
		tls,
	})

	await webService.ready()

	return webService.listen()
}

await runScript(async () => {
	const webService = await initializeAppServer()

	return webService.waitUntilClosed()
})
