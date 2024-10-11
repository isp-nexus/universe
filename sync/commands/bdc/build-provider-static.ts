/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import { BroadbandProvider } from "@isp.nexus/fcc"
import { cleanDirectory, CommandHandler, takeBufferLines } from "@isp.nexus/sdk"
import { BDCDataSourcePath } from "@isp.nexus/sync/fcc"
import { StateName } from "@isp.nexus/tiger"
import * as fs from "node:fs/promises"
import { PathBuilder } from "path-ts"
import { CommandBuilder } from "yargs"
import { $ } from "zx"

export const command = "build-provider-static [outDirectory]"
export const describe = "Generate static files for each broadband provider."

interface CommandArgs {
	"out-directory": PathBuilder<"~out-directory">
}

export const builder: CommandBuilder<CommandArgs, CommandArgs> = {
	outDirectory: {
		describe: "The output directory",
		type: "string",
		demandOption: true,
		alias: "o",
		coerce: (value: string) => PathBuilder.from(process.cwd(), value),
		normalize: true,
	},
}

export const handler: CommandHandler<CommandArgs> = async ({ outDirectory }) => {
	console.log("outDirectory", outDirectory)

	await cleanDirectory(outDirectory)

	const stateNamePattern = Object.values(StateName)
		.map((s) => s.toUpperCase())
		.join("|")

	const template = /* sql */ `
		ATTACH DATABASE '${BDCDataSourcePath}?mode=ro' AS bdc;

		CREATE TEMP VIEW parsed_provider AS
		SELECT
			holding_company,
			provider_name,
			provider_id,
			frn,
			dba_name,
			MAX(ilec_tag) AS ilec_tag,
			MAX(clec_tag) AS clec_tag,
			-- Association
			(comparision_name REGEXP 'ASSOCIATION|ASSN') AS association_tag,
			-- Telephone
			(comparision_name REGEXP 'TELEPHONE| PHONE') AS telephone_tag,
			-- Rural
			comparision_name LIKE '%RURAL%' AS rural_tag,
			-- Co-op
			(comparision_name REGEXP 'COOP|CO-OPERATIVE') AS coop_tag,
			-- Municipality
			(comparision_name REGEXP 'STATE|COUNTY|CITY|MUNICIPAL|UTILITY|TOWN|VILLAGE|BOROUGH|PARISH|TOWNSHIP|COUNTY') AS municipal_tag,
			-- State
			(comparision_name REGEXP '${stateNamePattern}') AS state_tag
		FROM
			(
				SELECT
					*,
					-- Concatenate for later comparison
					concat (UPPER(provider_name), ' ', UPPER(holding_company)) AS comparision_name,
					-- Doing-business-as name
					CASE
						WHEN UPPER(provider_name) LIKE '% DBA %' THEN
						-- Extract the DBA name
						TRIM(SUBSTR (provider_name, INSTR (UPPER(provider_name), 'DBA') + 3))
						ELSE NULL
					END AS dba_name
				FROM
					(
						SELECT
							replace (replace (replace (replace (p.holding_company, '.', ''), ',', ''), '/', ''), '  ', ' ') AS holding_company,
							replace (replace (replace (replace (p.provider_name, '.', ''), ',', ''), '/', ''), '  ', ' ') AS provider_name,
							p.provider_id,
							p.frn,
							-- Incumbent Local Exchange Carrier
							CASE UPPER(p.operation_type)
								WHEN 'ILEC' THEN TRUE
								ELSE FALSE
							END AS ilec_tag,
							-- Competitive Local Exchange Carrier
							CASE UPPER(p.operation_type)
								WHEN 'NON-ILEC' THEN TRUE
								ELSE FALSE
							END AS clec_tag
						FROM
							bdc.providers_base AS p
					)
			)
		GROUP BY
			provider_id,
			holding_company,
			frn
		ORDER BY
			provider_id,
			holding_company,
			provider_name;

		CREATE TEMP VIEW grouped_provider AS
		SELECT
			holding_company,
			provider_id,
			MAX(ilec_tag) AS ilec_tag,
			MAX(clec_tag) AS clec_tag,
			MAX(association_tag) AS association_tag,
			MAX(telephone_tag) AS telephone_tag,
			MAX(rural_tag) AS rural_tag,
			MAX(coop_tag) AS coop_tag,
			MAX(municipal_tag) AS municipal_tag,
			MAX(ilec_tag) IS FALSE
			AND MAX(state_tag) AS state_tag,
			json_object (
				'id',
				provider_id,
				'holdingCompany',
				holding_company,
				'frns',
				json_group_array (DISTINCT frn),
				'divisionsByFRN',
				json_group_object (frn, provider_name),
				'tags',
				json (
					printf (
						'[%s]',
						concat_ws (
							',',
							iif (ilec_tag, json_quote ('ilec'), NULL),
							iif (clec_tag, json_quote ('clec'), NULL),
							iif (association_tag, json_quote ('association'), NULL),
							iif (telephone_tag, json_quote ('telephone'), NULL),
							iif (rural_tag AND NOT ilec_tag, json_quote ('rural'), NULL),
							iif (coop_tag AND NOT ilec_tag, json_quote ('coop'), NULL),
							iif (municipal_tag AND NOT ilec_tag, json_quote ('municipal'), NULL),
							iif (state_tag AND NOT ilec_tag, json_quote ('state'), NULL)
						)
					)
				),
				'doingBusinessAsByFRN',
				json_patch ('{}', json_group_object (frn, dba_name))
			) as provider_json
		FROM
			parsed_provider
		GROUP BY
			provider_id,
			holding_company
		ORDER BY
			provider_id,
			holding_company,
			provider_name;

		CREATE TEMP VIEW combined_provider AS
		SELECT
			grouped.holding_company,
			grouped.provider_id,
			bdcp.claimed_record_count,
			bdcp.state_record_count,
			bdcp.technology_codes,
			grouped.ilec_tag,
			grouped.clec_tag,
			grouped.association_tag,
			grouped.telephone_tag,
			grouped.rural_tag,
			grouped.coop_tag,
			grouped.municipal_tag,
			grouped.state_tag,
			json_patch (
				grouped.provider_json,
				json_object (
					'technologyCodes',
					json (bdcp.technology_codes),
					'claimedRecordCount',
					bdcp.claimed_record_count,
					'claimedRecordCountByStateCode',
					json (bdcp.state_record_count)
				)
			) as provider_json
		FROM
			grouped_provider AS grouped
			INNER JOIN bdc.bdc_provider bdcp ON grouped.provider_id = bdcp.provider_id
		WHERE
			bdcp.provider_id IS NOT NULL;

		SELECT provider_json from combined_provider;
		`

	// avoiding the need to load the entire result set into memory
	const child = $`echo ${template} | sqlite3 -batch -noheader :memory:`

	const result = await child.nothrow()

	if (result.exitCode !== 0) {
		throw ResourceError.from(500, result.stderr, "bdc", "generate-provider-static")
	}

	for await (const line of takeBufferLines(result.buffer())) {
		const provider = JSON.parse(line) as BroadbandProvider

		await writeProviderFiles(provider, outDirectory)
	}
}

async function writeProviderFiles(provider: BroadbandProvider, outDirectory: PathBuilder): Promise<void> {
	const providerDirectory = outDirectory("by", "id", provider.id)
	const outFilename = `${provider.id}.json`
	const serializedProvider = JSON.stringify(provider, null, "\t")

	await fs.mkdir(providerDirectory, { recursive: true })

	await fs.writeFile(providerDirectory("index.json"), serializedProvider)

	for (const technologyCode of provider.technologyCodes) {
		const technologyDirectory = outDirectory("by", "technology", technologyCode)

		await fs.mkdir(technologyDirectory, { recursive: true })

		await fs.writeFile(technologyDirectory(outFilename), serializedProvider)
	}

	for (const stateCode of Object.keys(provider.claimedRecordCountByStateCode ?? {})) {
		const stateDirectory = outDirectory("by", "state", stateCode)

		await fs.mkdir(stateDirectory, { recursive: true })

		await fs.writeFile(stateDirectory(outFilename), serializedProvider)
	}

	for (const frn of provider.frns) {
		const frnDirectory = outDirectory("by", "frn")

		await fs.mkdir(frnDirectory, { recursive: true })

		await fs.writeFile(frnDirectory(`${frn}.json`), serializedProvider)
	}

	for (const tag of provider.tags ?? []) {
		const tagDirectory = outDirectory("by", "tag", tag)

		await fs.mkdir(tagDirectory, { recursive: true })

		await fs.writeFile(tagDirectory(outFilename), serializedProvider)
	}
}
