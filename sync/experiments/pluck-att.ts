/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { formatPlanIdentifier, ParsedPlanIdentifier, pluckUniquePlanID } from "@isp.nexus/fcc"
import { checkIfExists, cleanDirectory, createCLIProgressBar, runScript } from "@isp.nexus/sdk"
import { createOpenAIClient } from "@isp.nexus/sdk/llm"
import { repoRootPathBuilder } from "@isp.nexus/sdk/monorepo"
import * as fs from "node:fs/promises"
import { zodResponseFormat } from "openai/helpers/zod"
import TurndownService from "turndown"
import { z } from "zod"

const openai = createOpenAIClient()
const assistant = await openai.beta.assistants.retrieve("asst_b9wpRbfEUxpIvjVYieSaElne")

const BASE_URL = "https://www.att.com/static-content-service-ui/v1/labelfeed/shared/nutrition/"
const fileCacheDirectory = repoRootPathBuilder("scratch", "att")

const planPaths: string[] = [
	"AIABUSSTD",
	"AIABUSPRE",
	"CONS/Express/88541733/IS5200/26",
	"CONS/Hsia18/88541733/IS5199/26",
	"CONS/Hsia24/88541733/IS5201/26",
	"CONS/Hsia45/88541733/IS5201/26",
	"CONS/Max/88541733/IS5199/26",
	"CONS/HSIA5X5/88541733/IS5199/26",
	"CONS/Hsia25x5/88541733/IS5199/26",
	"CONS/Elite/88541733/IS5201/26",
	"CONS/Hsia50x10/88541733/IS5201/26",
	"CONS/Max/88541733/IS5201/26",
	"CONS/HISA10X10/88541733/IS5199/26",
	"CONS/Hsia25x2/88541733/IS5201/26",
	"CONS/Hsia10x1/88541733/IS5199/26",
	"CONS/HSIA50X50/88541733/IS5199/26",
	"CONS/Hsia5x1/88541733/IS5199/26",
	"CONS/Hsia10x1/88541733/IS5201/26",
	"CONS/Pro/88541733/IS5199/26",
	"CONS/Elite/88541733/IS5199/26",
	"CONS/HISA25X25/88541733/IS5199/26",
	"CONS/Basic/88541733/IS5199/26",
	"CONS/Hsia25x2/88541733/IS5199/26",
	"CONS/Hsia100g/88541733/IS5199/26",
	"CONS/Hsia5x1/88541733/IS5201/26",
	"CONS/Hsia24/88541733/IS5199/26",
	"CONS/Hsia45/88541733/IS5199/26",
	"CONS/Hsia100s/88541733/IS5199/26",
	"CONS/Hsia75/88541733/IS5199/26",
	"CONS/Hsia18/88541733/IS5201/26",
	"CONS/Basic/88541733/IS5200/26",
	"CONS/Hsia25x5/88541733/IS5201/26",
	"CONS/Hsia50x10/88541733/IS5199/26",
	"CONS/Express/88541733/IS5199/26",
	"CONS/Pro/88541733/IS5200/26",
	"CONS/Hsia75x20/88541733/IS5199/26",
	"CONS/HSIA100s/88541733/N/25",
	"CONS/HSIA75X75/88541733/N/25",
	"SMB/HSIA5x1/33311/N",
	"SMB/500m500mg/33311/E",
	"SMB/2000m2000mg/33311/N",
	"SMB/Hsia75x20/33311/N",
	"SMB/500m500mg/33311/N",
	"SMB/Pro/33311/E",
	"SMB/50m10mg/33311/E",
	"SMB/Elite/33311/N",
	"SMB/Hsia75/33311/E",
	"SMB/Basic/33311/E",
	"SMB/1000M1000M/913416689/N",
	"SMB/Express/33311/E",
	"SMB/Hsia100x20/33311/N",
	"SMB/Hsia25x2/33311/N",
	"SMB/Hsia45/33311/E",
	"SMB/50m50mg/33311/E",
	"SMB/500M500M/913416689/N",
	"SMB/Hsia50x50/33311/E",
	"SMB/Hsia75x20/33311/E",
	"SMB/5000m5000mg/33311/N",
	"SMB/1000M1000M/913416689/E",
	"SMB/Hsia18/33311/E",
	"SMB/HSIA10x1/33311/N",
	"SMB/300m300mg/33311/E",
	"SMB/Hsia25x5/33311/E",
	"SMB/Express/33311/N",
	"SMB/2000m2000mg/33311/E",
	"SMB/300m300mg/33311/N",
	"SMB/1000m1000mg/33311/H",
	"SMB/500M500M/913416689/E",
	"SMB/HSIA10x1/33311/E",
	"SMB/Hsia24/33311/N",
	"SMB/100M100M/913416689/E",
	"SMB/Hsia45/33311/N",
	"SMB/Hsia24/33311/E",
	"SMB/100m100mg/33311/E",
	"SMB/Hsia18/33311/N",
	"SMB/Max/33311/E",
	"SMB/1000m1000mg/33311/E",
	"SMB/1000m1000mg/33311/N",
	"SMB/Hsia100/33311/N",
	"SMB/Hsia25x2/33311/E",
	"SMB/Hsia25x5/33311/N",
	"SMB/Hsia50x10/33311/N",
	"SMB/Hsia100x20/33311/E",
	"SMB/300M300M/913416689/N",
	"SMB/50m10mg/33311/N",
	"SMB/HSIA5x1/33311/E",
	"SMB/Max/33311/N",
	"SMB/300M300M/913416689/E",
	"SMB/Hsia100/33311/E",
	"SMB/Pro/33311/N",
	"SMB/5000m5000mg/33311/E",
	"SMB/Hsia50x10/33311/E",
	"SMB/Basic/33311/N",
	"SMB/100/33311/E",
	"SMB/Elite/33311/E",
	"SMB/Hsia75/33311/N",
	"SMB/1000M1000M/913416689/H",
	"CONS/227860ce-9be2-4a6f-80ff-150e4959dec1",
	"CONS/HSIA100s/88541733/N/26",
	"CONS/HSIA5X1/88541733/N/26",
	"CONS/Express/88541733/N/26",
	"CONS/HSIA10X1/88541733/N/26",
	"CONS/HSIA500g/88541733/N/26",
	"CONS/HSIA18/88541733/N/26",
	"CONS/HSIA5000g/88541733/N/26",
	"CONS/HSIA300g/88541733/N/26",
	"CONS/HSIA50X10/88541733/N/26",
	"CONS/HSIA25X2/88541733/N/26",
	"CONS/Max/88541733/N/26",
	"CONS/HSIA5X5/88541733/IS5200/26",
	"CONS/HSIA100g/88541733/N/26",
	"CONS/HSIA24/88541733/N/26",
	"CONS/Pro/88541733/N/26",
	"CONS/Basic/88541733/N/26",
	"CONS/HISA10X10/88541733/N/26",
	"CONS/Elite/88541733/N/26",
	"CONS/HSIA2000g/88541733/N/26",
	"CONS/HSIA75X20/88541733/N/26",
	"CONS/HSIA45/88541733/N/26",
	"CONS/HISA25X25/88541733/N/26",
	"CONS/HISA10X10/88541733/IS5201/26",
	"CONS/HSIA5X5/88541733/N/26",
	"CONS/HSIA1000g/88541733/N/26",
	"CONS/HSIA75/88541733/N/26",
	"CONS/HSIA50X50/88541733/N/26",
	"CONS/HSIA25X5/88541733/N/26",
	"SMB/50M50M/88992903/E",
]

const BroadbandLabelSchema = z.object({
	/**
	 * - The first character must be either 'F' or 'M', indicating fixed or mobile plan
	 * - The next 10 characters must be the provider's FCC Registration Number, zero-padded if
	 *   necessary.
	 * - The last 15 characters must be a unique identifier for the plan.
	 * - Letter characters must be capitalized
	 * - Only A-Z and 0-9 (ASCII 65-90 and 48-57)
	 * - No special characters can be used in the ID.
	 *
	 * @example F0005937974123ABC456EMC789
	 *
	 * @example F0030488753C75560000000000
	 */
	unique_plan_id: z.string(),

	/**
	 * This is an identifying number that is assigned to organizations doing business with the
	 * commission. This number should conform with the `unique_plan_id` field.
	 *
	 * @example 5937974
	 *
	 * @example 30488753
	 */
	frn: z.number(),

	/**
	 * The last 15 characters of the `unique_plan_id` field. This field is used to identify the plan
	 * in the provider's system.
	 *
	 * @example 123ABC456EMC789
	 *
	 * @example C75560000000000
	 */
	plan_id: z.string(),

	/**
	 * The name of the service plan. This field should be descriptive and unique to the plan.
	 *
	 * @example Unlimited Plus
	 *
	 * @example Unlimited Plus - Mobile Hotspot Device
	 *
	 * @example $20 Unlimited Wi-Fi Prepaid
	 *
	 * @example AT&T Internet Air
	 *
	 * @example Gigabit Extra, 1200 Mbps
	 */
	service_plan_name: z.string(),

	/**
	 * The plan speed tier name if applicable. NULL if no plan speed tier name.
	 *
	 * @example Gold
	 */
	tier_plan_name: z.nullable(z.string()),

	/**
	 * Indicates the type of connection,
	 *
	 * @example F, M
	 */
	connection_type: z.enum(["F", "M"]),

	/**
	 * The cost per month of the plan without any introductory rates.
	 *
	 * @example 39.95
	 */
	monthly_price: z.number(),

	/**
	 * Indicates whether the plan has an introductory rate option.
	 *
	 * @example 1
	 */
	intro_rate: z.boolean(),

	/**
	 * The cost per month of the plan during the introductory period. NULL if no introductory rate.
	 *
	 * @example 29.95
	 */
	intro_rate_price: z.nullable(z.number()),

	/**
	 * The length of time in months the introductory rate applies. NULL if no introductory rate.
	 *
	 * @example 6
	 */
	intro_rate_time: z.nullable(z.number()),

	/**
	 * Indicates whether the monthly price requires a contract or not.
	 *
	 * @example 1
	 */
	contract_req: z.boolean(),

	/**
	 * The required time in months for the contract for the monthly rate. NULL if no contract.
	 *
	 * @example 24
	 */
	contract_time: z.nullable(z.number()),

	/**
	 * The URL of the provider's webpage where the terms of service for the contract agreement are
	 * published.
	 *
	 * - NULL if no contract.
	 *
	 * @example https://acmedata.com/terms
	 */
	contract_terms_url: z.nullable(z.string()),

	/**
	 * The fee associated with ending the contract early.
	 *
	 * - NULL if no early termination fee.
	 *
	 * @example 90.00
	 */
	early_termination_fee: z.nullable(z.number()),

	/**
	 * JSON array of strings identifying the category of one-time fees associated with the plan.
	 *
	 * - Number and order of entries must match `single_purchase_fees`
	 * - NULL if no one-time fees
	 *
	 * @example {undefined} Equipment cost , "installation fee"
	 *
	 * @format json
	 */
	single_purchase_fee_descr: z.nullable(z.array(z.string())),

	/**
	 * JSON array of numbers for each one-time fee in dollars and cents.
	 *
	 * - Number and order of entries must match `single_purchase_fee_descr`
	 * - NULL if no one-time fees
	 *
	 * @example {undefined} 50.00, 99.95
	 *
	 * @format json
	 */
	single_purchase_fees: z.nullable(z.array(z.number())),

	/**
	 * JSON array of strings listing additional monthly fees associated with the plan.
	 *
	 * - NULL if no monthly fees
	 *
	 * @example {undefined} Equipment rental , "Virus protection subscription"
	 *
	 * @format json
	 */
	monthly_provider_fee_descr: z.nullable(z.array(z.string())),

	/**
	 * JSON array of numbers for each monthly fee in dollars and cents.
	 *
	 * - Number and order of entries must match `monthly_provider_fee_descr`
	 * - NULL if no monthly fees
	 *
	 * @example {undefined} 9.95, 4.00
	 *
	 * @format json
	 */
	monthly_provider_fees: z.nullable(z.array(z.number())),

	/**
	 * Either:
	 *
	 * - The value of the applicable state and federal taxes associated with the plan.
	 * - "Varies" if the taxes vary within the geographic area in which the plan is made available.
	 * - "Included" if all taxes are included in the monthly price of the plan entered in the
	 *   `monthly_price` field.
	 *
	 * @example Included
	 *
	 * @example Varies
	 *
	 * @example 5.00
	 */
	tax: z.union([z.literal("Included"), z.literal("Varies"), z.number()]),

	/**
	 * The URL for the provider's webpage that lists the available billing discounts and pricing
	 * options for service bundles or other discounts. For simplicity, providers should link from the
	 * label to a webpage explaining any discounts offered for the plan, instead of itemizing each
	 * discount or bundle of services available. Providers may also separately inform consumers about
	 * discounts as part of their marketing materials.
	 *
	 * - NULL if no discount.
	 *
	 * @example https://acmedata.com/discounts
	 */
	bundle_discounts_url: z.nullable(z.string()),

	/**
	 * The typical download speed associated with the plan measured in megabits per second (Mbps),
	 * with a maximum of two decimal places.
	 *
	 * @example 43.60
	 */
	typical_download_speed: z.number(),

	/**
	 * The typical upload speed associated with the plan measured in megabits per second (Mbps), with
	 * a maximum of two decimal places.
	 *
	 * @example 4.07
	 */
	typical_upload_speed: z.number(),

	/**
	 * The typical latency associated with the plan in milliseconds (ms).
	 *
	 * @example 139
	 */
	typical_latency: z.number(),

	/**
	 * The number of gigabytes (GB) of data included with the monthly price.
	 *
	 * - NULL if there are no monthly limits.
	 * - Can be zero if all usage is metered (pay-by-the-GB plans)
	 *
	 * @example 50
	 *
	 * @example 0
	 *
	 * @example NULL
	 */
	monthly_data_allow: z.nullable(z.number()),

	/**
	 * The charge in dollars and cents for additional data usage, beyond the value entered in the
	 * `monthly_data_allow` field, in $/GB.
	 *
	 * - NULL if no additional charge.
	 *
	 * @example 5.00
	 */
	over_usage_data_price: z.nullable(z.number()),

	/**
	 * Increment of data added in GB Note that total cost for an overage will be this value times the
	 * `over_usage_data_price`.
	 *
	 * - NULL if no additional increments of data.
	 *
	 * @example 10
	 */
	additional_data_increment: z.nullable(z.number()),

	/**
	 * The link to the provider's data allowance policy
	 *
	 * @example https://acmedata.com/data-allowance
	 */
	data_allowance_policy_url: z.nullable(z.string()),
})

type BroadbandLabelSchema = z.infer<typeof BroadbandLabelSchema>

const SQL = {
	boolean: (value: boolean) => (value ? "TRUE" : "FALSE"),
	text: (value: string | null) => (value ? `'${value}'` : "NULL"),
	number: (value: number | null | null) => (value ? value.toString() : "NULL"),
	array: (values: string[] | number[] | null) => {
		if (!values) return "NULL"

		const filtered = values.filter((value) => value !== null)

		if (filtered.length === 0) return "NULL"

		return `json_array(${filtered.map(toSQL).join(", ")})`
	},
} as const

/**
 * Very primitive SQL value conversion function.
 */
function toSQL(value: string | number | string[] | number[] | null | boolean): string {
	if (Array.isArray(value)) return SQL.array(value)

	switch (typeof value) {
		case "boolean":
			return SQL.boolean(value)
		case "string":
			return SQL.text(value)
		case "number":
			return SQL.number(value)
	}

	return "NULL"
}

async function fetchPlan(planPath: string): Promise<string> {
	const cachedFilePath = fileCacheDirectory(planPath, "index.html")

	await fs.mkdir(cachedFilePath.dirname().toString(), { recursive: true })

	const exists = await checkIfExists(cachedFilePath)

	if (exists) {
		return fs.readFile(cachedFilePath, "utf8")
	}

	const url = new URL(BASE_URL + planPath)
	const response = await fetch(url)

	if (!response.ok) {
		throw new Error(`Failed to fetch ${planPath}: ${response.statusText}`)
	}

	const content = await response.text()

	await fs.writeFile(cachedFilePath, content)

	return content
}

async function extractPlanData(planPath: string, planHTML: string): Promise<[ParsedPlanIdentifier, string]> {
	const turndown = new TurndownService({
		hr: "",
	})

	turndown.remove("style")
	turndown.remove("script")
	turndown.remove((element) => {
		return element.id.includes("fees-error")
	})

	const markdown = turndown.turndown(planHTML)

	const planID = pluckUniquePlanID(markdown)

	if (!planID) {
		throw new Error(`Failed to pluck plan ID from ${planPath}`)
	}

	const endIndex = markdown.indexOf("\n\n#### Network Management")
	const content = markdown.slice(0, endIndex)

	return [planID, content]
}

await runScript(async () => {
	await cleanDirectory(fileCacheDirectory("parsed"))

	const thread = await openai.beta.threads.create()

	const progress = await createCLIProgressBar({
		total: planPaths.length,
		displayName: "ATT Plans",
	})

	const writePath = fileCacheDirectory("parsed", "att.sql").toString()
	const writeHandle = await fs.open(writePath, "w")

	await writeHandle.write(
		/* sql */ `INSERT INTO broadband_label (unique_plan_id, service_plan_name, tier_plan_name, monthly_price, intro_rate, intro_rate_price, intro_rate_time, contract_req, contract_time, contract_terms_url, early_termination_fee, single_purchase_fee_descr, single_purchase_fees, monthly_provider_fee_descr, monthly_provider_fees, tax, bundle_discounts_url, typical_download_speed, typical_upload_speed, typical_latency, monthly_data_allow, over_usage_data_price, additional_data_increment, data_allowance_policy_url) VALUES\n`
	)

	for (const planPath of planPaths) {
		const planHTML = await fetchPlan(planPath)

		const planEntry = await extractPlanData(planPath, planHTML)

		const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
			assistant_id: assistant.id,
			response_format: zodResponseFormat(BroadbandLabelSchema, "broadband-label"),
			additional_messages: [
				{
					role: "user",
					content: JSON.stringify({
						action: "test",
					}),
				},
				{
					role: "assistant",
					content: JSON.stringify({
						unique_plan_id: "F00037681657FDTMPI8DRWF010",
						frn: 3768165,
						plan_id: "7FDTMPI8DRWF010",
						service_plan_name: "Gigabit Extra, 1200 Mbps",
						tier_plan_name: null,
						connection_type: "F",
						monthly_price: 126,
						intro_rate: false,
						intro_rate_price: null,
						intro_rate_time: null,
						contract_req: false,
						contract_time: null,
						contract_terms_url: null,
						early_termination_fee: null,
						single_purchase_fee_descr: ["Installation fees"],
						single_purchase_fees: [100.0],
						monthly_provider_fee_descr: [
							"Optional modem or gateway lease",
							"Optional xFi Complete",
							"Late Payment Fee",
						],
						monthly_provider_fees: [15.0, 25.0, 10.0],
						tax: "Varies",
						bundle_discounts_url: "https://www.xfinity.com/internet-service/disclaimer",
						typical_download_speed: 1302.26,
						typical_upload_speed: 40.52,
						typical_latency: 14.2,
						monthly_data_allow: 1200,
						over_usage_data_price: 10,
						additional_data_increment: 50,
						data_allowance_policy_url: null,
					} satisfies BroadbandLabelSchema),
				},
				{
					role: "user",
					content: JSON.stringify({
						action: "parse",
						source: "AT&T",
						plan_id: formatPlanIdentifier(planEntry[0]),
						format: "markdown",
						data: planEntry[1],
					}),
				},
			],
		})

		const messages = await openai.beta.threads.messages.list(thread.id, {
			run_id: run.id,
		})

		const message = messages.data.pop()!

		const content = message.content[0]
		if (content?.type !== "text") throw new Error(`Unexpected message type: ${content?.type}`)

		const result = JSON.parse(content.text.value) as BroadbandLabelSchema

		const {
			unique_plan_id,
			service_plan_name,
			tier_plan_name,
			monthly_price,
			intro_rate,
			intro_rate_price,
			intro_rate_time,
			contract_req,
			contract_time,
			contract_terms_url,
			early_termination_fee,
			single_purchase_fee_descr,
			single_purchase_fees,
			monthly_provider_fee_descr,
			monthly_provider_fees,
			tax,
			bundle_discounts_url,
			typical_download_speed,
			typical_upload_speed,
			typical_latency,
			monthly_data_allow,
			over_usage_data_price,
			additional_data_increment,
			data_allowance_policy_url,
		} = result

		await writeHandle.write(
			"(" +
				[
					unique_plan_id,
					service_plan_name,
					tier_plan_name,
					monthly_price,
					intro_rate,
					intro_rate_price,
					intro_rate_time,
					contract_req,
					contract_time,
					contract_terms_url,
					early_termination_fee,
					single_purchase_fee_descr,
					single_purchase_fees,
					monthly_provider_fee_descr,
					monthly_provider_fees,
					tax,
					bundle_discounts_url,
					typical_download_speed,
					typical_upload_speed,
					typical_latency,
					monthly_data_allow,
					over_usage_data_price,
					additional_data_increment,
					data_allowance_policy_url,
				].map(toSQL) +
				")\n"
		)

		progress.increment()
	}

	await writeHandle.write(";\n")

	await writeHandle.close()
	await progress.dispose()
})
