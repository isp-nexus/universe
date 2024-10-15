/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { assertOptionalKeyPresent } from "@isp.nexus/core"
import { AsyncInitializable, ServiceRepository, ServiceSymbol } from "@isp.nexus/core/lifecycle"
import { delegateComposeResult } from "@isp.nexus/sdk/docker"
import { packagePathBuilder } from "@isp.nexus/sdk/monorepo"
import { assertShellResolvesPath } from "@isp.nexus/sdk/runner"
import { $private } from "@isp.nexus/sdk/runtime"
import { IDockerComposeOptions, pullAll, run, upMany } from "docker-compose"
import * as fs from "node:fs/promises"
import { PathBuilder } from "path-ts"
import { $ } from "zx"

export enum PeliasService {
	Libpostal = "libpostal",
	Schema = "schema",
	API = "api",
	Placeholder = "placeholder",
	WhosOnFirst = "whosonfirst",
	Openstreetmap = "openstreetmap",
	Openaddresses = "openaddresses",
	Geonames = "geonames",
	CSVImporter = "csv-importer",
	Transit = "transit",
	Polylines = "polylines",
	Interpolation = "interpolation",
	PIP = "pip",
	Elasticsearch = "elasticsearch",
	FuzzyTester = "fuzzy-tester",
}

export class PeliasComposer implements AsyncInitializable {
	readonly #dataPath: PathBuilder
	readonly #elasticDataPath: PathBuilder
	readonly #peliasPackagePath = packagePathBuilder("pelias")

	public readonly composerOptions: IDockerComposeOptions

	constructor() {
		assertOptionalKeyPresent($private, "PELIAS_DATA_PATH")

		this.#dataPath = PathBuilder.from($private.PELIAS_DATA_PATH)

		this.#elasticDataPath = this.#dataPath("elasticsearch")

		this.composerOptions = {
			log: true,
			cwd: this.#peliasPackagePath,
			config: this.#peliasPackagePath("docker-compose.json").toString(),
			env: {
				...$.env,
				PELIAS_DATA_PATH: $private.PELIAS_DATA_PATH,
			},
		}
	}

	public async [ServiceSymbol.asyncInit](): Promise<this> {
		await assertShellResolvesPath("docker")

		await fs.mkdir(this.#dataPath, { recursive: true })
		await fs.mkdir(this.#elasticDataPath, { recursive: true })

		return this
	}

	/**
	 * Run a command in a Pelias service.
	 *
	 * @param service - The Pelias service to run the command in.
	 * @param command - The shell command to run.
	 */
	public async runCommand(service: PeliasService, command: string): Promise<void> {
		await run(service, command, this.composerOptions).then(delegateComposeResult)
	}

	public async up(...serviceNames: PeliasService[]): Promise<void> {
		await upMany(serviceNames, this.composerOptions).then(delegateComposeResult)
	}

	public async pullAll(): Promise<void> {
		await pullAll(this.composerOptions).then(delegateComposeResult)
	}

	public async [Symbol.asyncDispose]() {
		return Promise.resolve()
	}
}

export const $PeliasComposer = ServiceRepository.register(PeliasComposer)
