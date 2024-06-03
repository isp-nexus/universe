/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { Static, TObject, TProperties, Type } from "@sinclair/typebox"
import { Assistants } from "openai/resources/beta/assistants"
import { ParsingToolFunction } from "openai/resources/beta/chat/completions"
import { FunctionDefinition } from "openai/resources/shared"

export const lookupSubscriber = (_params: LookupSubscriberParameters) => {
	return {
		subscriberID: "123456",
		phoneNumber: "555-555-5555",
		emailAddress: "jane.doe@gmail.com",
		displayName: "Jane Doe",
		serviceAddress: {
			formattedAddress: "123 Main St, Anytown, USA",
			locality: "Anytown",
			region: "USA",
			postalCode: "12345",
			streetName: "Main St",
		},
	}
}

export interface TFunctionDefinitionProperties<
	ParameterProperties extends TProperties = TProperties,
	TResponseProperties extends TProperties = TProperties,
> {
	/**
	 * Parameters schema this function expects.
	 */
	parameters: TObject<ParameterProperties>
	/**
	 * Response schema this function returns.
	 */
	response: TObject<TResponseProperties>

	/**
	 * Name of the function, used to reference it in the assistant.
	 */
	name: string

	/**
	 * Description used by the assistant to consider using this function.
	 */
	description: string
}

export interface TFunctionDefinition<
	ParameterProperties extends TProperties = TProperties,
	TResponseProperties extends TProperties = TProperties,
> extends FunctionDefinition {
	parameters: TObject<ParameterProperties>
	response: TObject<TResponseProperties>
}

/**
 * Given tool function schema, plucks the parameters type.
 */
export type PluckFunctionDefinitionParameters<T extends TFunctionDefinition> = T["parameters"]

export function pluckFunctionDefinitionParameters<T extends TFunctionDefinition>(
	functionDefinitionSchema: T
): PluckFunctionDefinitionParameters<T> {
	return functionDefinitionSchema.parameters
}
/**
 * Given tool function schema, plucks the response type.
 */
export type PluckFunctionDefinitionResponse<T extends TFunctionDefinitionProperties> =
	T extends TFunctionDefinitionProperties<any, infer ResponseProperties> ? TObject<ResponseProperties> : never

export function PluckFunctionDefinitionResponse<T extends TFunctionDefinitionProperties>(definition: T) {
	return definition.response
}

/**
 * Given tool function schema, infers the function call signature.
 */
export type PluckFunctionDefinitionCall<T extends TFunctionDefinitionProperties> =
	T extends TFunctionDefinitionProperties<infer ParameterProperties, infer ResponseProperties>
		? (params: TObject<ParameterProperties>) => TObject<ResponseProperties>
		: never

/**
 * Creates a tool function definition schema.
 */
export function FunctionDefinitionSchema<
	ParameterProperties extends TProperties = TProperties,
	TResponseProperties extends TProperties = TProperties,
>({
	parameters,
	response,
	description,
	name,
}: TFunctionDefinitionProperties<ParameterProperties, TResponseProperties>) {
	const functionDefinition = {
		name,
		description,
		parameters,
		response,
	} as const satisfies TFunctionDefinition<ParameterProperties, TResponseProperties>

	return functionDefinition
}

export const LookupSubscriber = FunctionDefinitionSchema({
	name: "lookupSubscriber",
	description: "Look up a subscriber by their unique identifier, phone number, or email address.",
	parameters: Type.Partial(
		Type.Object({
			subscriberID: Type.String(),
			phoneNumber: Type.String(),
			emailAddress: Type.String(),
		})
	),
	response: Type.Object({
		subscriberID: Type.String({
			description: "The unique identifier for the subscriber.",
		}),
		phoneNumber: Type.String({
			description: "The primary phone number for the subscriber.",
		}),
		emailAddress: Type.String({
			description: "The primary email address for the subscriber.",
			format: "email",
		}),
		displayName: Type.String({
			description: "The name of the subscriber.",
		}),

		serviceAddress: Type.Object({
			formattedAddress: Type.String({
				description: "The subscriber's service address.",
			}),
			locality: Type.String({
				description: "The city, town, or village where the subscriber lives.",
			}),
			region: Type.String({
				description: "The state, province, or other region where the subscriber lives.",
			}),
			postalCode: Type.String({
				description: "The postal code for the subscriber's service address.",
			}),

			streetName: Type.String({
				description: "The name of the street where the subscriber lives.",
			}),
		}),
	}),
})

export const LookupSubscriberParameters = pluckFunctionDefinitionParameters(LookupSubscriber)
export type LookupSubscriberParameters = PluckFunctionDefinitionParameters<typeof LookupSubscriber>

export const LookupSubscriberResponse = PluckFunctionDefinitionResponse(LookupSubscriber)
export type LookupSubscriberResponse = PluckFunctionDefinitionResponse<typeof LookupSubscriber>

const _lookupAccount: Assistants.FunctionTool = {
	type: "function",
	function: {
		name: LookupSubscriber.name,
		parameters: LookupSubscriber.parameters,
		description: LookupSubscriber.description,
	},
}

const _lookupSubscriberTool = new ParsingToolFunction<Static<LookupSubscriberParameters>>({
	name: "lookupSubscriber",
	description: "Lookup account information.",
	function: (_args) => {
		return {
			subscriberID: "123456",
			phoneNumber: "+19294443334",
			emailAddress: "teffen@sister.software",
			displayName: "Teffen Ellis",
			serviceAddress: {
				formattedAddress: "1178 Broadway Suite, 3rd Floor, #1418, NY 10001",
				locality: "New York",
				region: "NY",
				postalCode: "10001",
				streetName: "Broadway",
			},
		}
	},
	parameters: LookupSubscriberParameters,
	parse: JSON.parse,
})

/**
 * Assistant configuration for an ISP broadband support bot.
 *
 * @category OpenAI
 * @category AIM
 */
export const ISPAssistantConfiguration = {
	name: "ISP Broadband Support Bot",
	description: "You are a support agent for a broadband company.",
	instructions: "Help customers with their internet issues, such as troubleshooting, billing, and service upgrades.",
	tools: [
		{
			type: "function",
			function: {
				name: LookupSubscriber.name,
				parameters: LookupSubscriber.parameters,
				description: LookupSubscriber.description,
			},
		},
	],
	model: "gpt-4-turbo",
} as const satisfies Assistants.AssistantCreateParams
