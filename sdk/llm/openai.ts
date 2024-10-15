/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { $private } from "@isp.nexus/sdk/runtime"
import { OpenAI } from "openai"

/**
 * Creates an instance of the OpenAI API client.
 */
export function createOpenAIClient() {
	return new OpenAI({
		apiKey: $private.OPENAI_API_KEY,
		organization: $private.OPENAI_ORGANIZATION_ID,
		project: $private.OPENAI_PROJECT_ID,
	})
}
