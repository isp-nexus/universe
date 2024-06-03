/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file AI Internet Service Provider Support Bot.
 */

import { ConsoleLogger } from "@isp.nexus/core/logging"
import { ISPAssistantConfiguration, createOpenAIClient } from "@isp.nexus/sdk/llm"
import { ThreadCreateParams } from "openai/resources/beta/threads/threads"

const openai = createOpenAIClient()
const assistant = await openai.beta.assistants.create(ISPAssistantConfiguration)

export interface StartThreadOptions {
	initialMessages: string[]
}

export async function startThread({ initialMessages }: StartThreadOptions) {
	const abortController = new AbortController()

	const thread = await openai.beta.threads.create(
		{
			messages: [
				{
					role: "assistant",
					content: JSON.stringify(
						{
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
						},
						null,
						2
					),
				},
				...initialMessages.map(
					(content): ThreadCreateParams.Message => ({
						role: "user",
						content,
					})
				),
			],
		},
		{
			signal: abortController.signal,
		}
	)

	const run = openai.beta.threads.runs
		.stream(thread.id, {
			assistant_id: assistant.id,
		})
		.on("textCreated", (_text) => process.stdout.write("\nassistant > "))
		.on("textDelta", (textDelta, _snapshot) => {
			if (!textDelta.value) return

			process.stdout.write(textDelta.value)
		})
		.on("toolCallCreated", (toolCall) => process.stdout.write(`\nassistant > ${toolCall.type}\n\n`))
		.on("toolCallDelta", (toolCallDelta, _snapshot) => {
			if (toolCallDelta.type === "function" && toolCallDelta.function) {
				process.stdout.write(`\nassistant > ${toolCallDelta.function.name}\n\n`)
			}
		})

	await run.done()
	const messages = await run.finalMessages()

	ConsoleLogger.info("Final Messages:")

	for (const message of messages) {
		ConsoleLogger.info(`[${message.role}] ${message.content}`)
	}
	// const currentMessage = run.currentMessageSnapshot()

	// if (!currentMessage) {
	// 	ConsoleLogger.info(`GPT Says: Nothing!`)
	// } else {
	// 	ConsoleLogger.info(`GPT Says: ${currentMessage.content}`)
	// }
}

export async function createCompletion() {
	const runner = openai.beta.chat.completions
		.runTools({
			model: "gpt-4-turbo",
			messages: [
				{
					content: [
						"Associated subscriber information:",
						JSON.stringify(
							{
								subscriberID: "123456",
								phoneNumber: "555-555-5555",
								emailAddress: "jane.doe@gmail.com",
							},
							null,
							2
						),
					].join("\n"),
					role: "system",
				},
				{ role: "user", content: "What address do I have on file?" },
				// { role: "user", content: "I need help setting up my internet." },
				// { role: "user", content: "My internet isn't working." },
				// { role: "user", content: "I need to change my service address." },
				// { role: "user", content: "I'd like to speak with a representative." },
				// { role: "user", content: "When can I sign up for service?" },
				// { role: "user", content: "I need to cancel my service." },
				// { role: "user", content: "I need to change my billing information." },
				// { role: "user", content: "Why isn't my internet working?" },
			],
			tools: [
				// lookupSubscriberTool,
				// lookupOutageTool,
				// lookupServiceTool,
				// lookupBillingTool,
				// transferToRepresentativeTool,
				// beginSignupTool,
				// cancelServiceTool,
				// deviceTroubleshootingTool,
				// changeServiceAddressTool,
				// changeBillingInformationTool,
				// changeServiceTool,
			],
		})
		.on("message", (message) => console.log(message))

	const finalContent = await runner.finalContent()

	console.log("Final content:", finalContent)
}

// createCompletion()

// await startThread({
// 	initialMessages: ["What address do I have on file?"],
// })

// const assistants = await openai.beta.assistants.list()
// const assistants = await openai.beta.assistants.retrieve()

// ConsoleLogger.info(assistants, "Assistants")
