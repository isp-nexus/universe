/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { APIClient, APIClientConfig } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { ServiceRepository } from "@isp.nexus/core/lifecycle"
import { ConsoleLogger } from "@isp.nexus/core/logging"
import { $PeliasComposer, PeliasService } from "@isp.nexus/pelias/services/runtime"

const ELASTIC_URL = "http://localhost:9200"

export function dropElasticSchema() {
	return $PeliasComposer.runCommand(PeliasService.Schema, /* sh */ `node scripts/drop_index "$@" || true;`)
}

export async function createEliasticSchema() {
	return $PeliasComposer.runCommand(PeliasService.Schema, /* sh */ `./bin/create_index;`)
}

/**
 * Elasticsearch REST API client.
 *
 * @singleton
 */
export const $ElasticAPIClient = ServiceRepository.register(({ abortController }) => {
	return new APIClient({
		displayName: "Elasticsearch",
		axios: {
			signal: abortController.signal,
			baseURL: ELASTIC_URL,
		},
	} satisfies APIClientConfig as APIClientConfig)
})

export async function elasticStatus(): Promise<number> {
	return $ElasticAPIClient
		.fetch({
			url: "/_cluster/health",
			params: {
				wait_for_status: "yellow",
				timeout: "1s",
			},
		})
		.then((response) => response.status)
}

export async function startElastic(): Promise<void> {
	await $PeliasComposer.up(PeliasService.Schema, PeliasService.Elasticsearch)

	await waitForElastic()
}

export async function waitForElastic(interval = 1000, retryCount = 30): Promise<void> {
	let status = 0

	while (status !== 200 && retryCount > 0) {
		status = await elasticStatus()
		ConsoleLogger.info(`Elasticsearch status: ${status}`)

		if (status === 200) return

		await new Promise((resolve) => setTimeout(resolve, interval))
		retryCount--
	}

	throw ResourceError.from(500, "Elasticsearch failed to start.")
}

export async function elasticStats() {
	return $ElasticAPIClient.fetch({
		url: "/pelias/_search",
		params: {
			request_cache: true,
			timeout: "10s",
			pretty: true,
		},
		data: {
			aggs: {
				sources: {
					terms: {
						field: "source",
						size: 100,
					},
					aggs: {
						layers: {
							terms: {
								field: "layer",
								size: 100,
							},
						},
					},
				},
			},
			size: 0,
		},
	})
}
