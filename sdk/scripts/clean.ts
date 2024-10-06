/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   ISP Nexus SDK clean script
 */

import { ISPNexusPackages } from "@isp.nexus/core"
import { cleanCompiledArtifacts, cleanDistributionArtifacts } from "@isp.nexus/sdk/files"
import { runScript } from "@isp.nexus/sdk/reflection"

await runScript(() => {
	return Promise.all([
		...ISPNexusPackages.map(cleanDistributionArtifacts),
		...ISPNexusPackages.map(cleanCompiledArtifacts),
	])
})
