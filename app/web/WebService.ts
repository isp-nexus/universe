/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file A Fastify server for the AIM application.
 */

import type * as http from "node:http"
import type * as https from "node:https"

import corsPlugin from "@fastify/cors"
import formBodyPlugin from "@fastify/formbody"
import multipartPlugin from "@fastify/multipart"
import fastifyStatic from "@fastify/static"
import { AsyncInitializable, ServiceSymbol } from "@isp.nexus/core/lifecycle"
import { ConsoleLogger, IRuntimeLogger } from "@isp.nexus/core/logging"
import {
	$public,
	TLSCertResult,
	dataSourcePathBuilder,
	developmentEnvironment,
	productionEnvironment,
} from "@isp.nexus/sdk"
import { FastifyTRPCPluginOptions, fastifyTRPCPlugin } from "@trpc/server/adapters/fastify"
import Fastify, { type FastifyTypeProviderDefault } from "fastify"
import { parseTwilioSMSReplyBody } from "../sms/index.js"
import { TRPCRoutePrefix } from "../trpc/constants.js"
import { createContext } from "../trpc/context.js"
import { AppRouter, appRouter } from "../trpc/server.js"
import { FastifyHTTPS } from "./fastify/interfaces.js"
import { handleInternalError, requestLogHandler, responseLogHandler } from "./fastify/logging.js"

export interface WebServiceOptions {
	tls?: TLSCertResult | null
}

export class WebService implements AsyncInitializable, AsyncDisposable {
	#logger = ConsoleLogger.withPrefix("Web Server")

	#fastify: FastifyHTTPS
	constructor({ tls }: WebServiceOptions) {
		this.#fastify = Fastify<
			https.Server,
			http.IncomingMessage,
			http.ServerResponse,
			IRuntimeLogger,
			FastifyTypeProviderDefault
		>({
			disableRequestLogging: true, // Handled manually.
			logger: this.#logger,
			https: tls!,
		})
	}

	public async [ServiceSymbol.asyncInit](): Promise<this> {
		this.#fastify.addHook("onRequest", requestLogHandler)
		this.#fastify.addHook("onResponse", responseLogHandler)

		this.#fastify.setErrorHandler(handleInternalError)

		this.#fastify.register(corsPlugin, {
			origin: true,
			credentials: true,
			methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "SEARCH", "OPTIONS"],
		})

		this.#fastify.register((context, _, done) => {
			context.register(fastifyStatic, {
				immutable: true,
				maxAge: developmentEnvironment ? 0 : 31_536_000, // 1 year
				root: dataSourcePathBuilder("tiger", "static"),
				prefix: "/tiles",
				wildcard: true,
				setHeaders: (res, path) => {
					if (path.endsWith(".pbf")) {
						res.setHeader("Content-Type", "application/x-protobuf")
						res.setHeader("Content-Encoding", "gzip")
					}
				},
			})

			context.setNotFoundHandler((_req, reply) => {
				reply.header("Content-Type", "text/plain")
				reply.status(204).send(`Tile not found`)
			})

			done()

			return this
		})

		this.#fastify.register(multipartPlugin, {
			attachFieldsToBody: true,
			limits: {
				fieldNameSize: 100, // Max field name size in bytes
				fieldSize: 100, // Max field value size in bytes
				fields: 10, // Max number of non-file fields
				fileSize: 1000000, // For multipart forms, the max file size in bytes
				files: 1, // Max number of file fields
				headerPairs: 2000, // Max number of header key=>value pairs
				parts: 1000, // For multipart forms, the max number of parts (fields + files)
			},
		})

		this.#fastify.register(formBodyPlugin)

		this.#fastify.get("/heartbeat", async () => {
			return { hello: "world" }
		})

		this.#fastify.register(fastifyTRPCPlugin, {
			prefix: TRPCRoutePrefix,
			trpcOptions: {
				router: appRouter,
				createContext,

				onError: ({ path }) => {
					this.#logger.error(`Error in tRPC handler on path '${path}'`)
				},
			} satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
		})

		this.#fastify.post(
			"/sms/reply",
			{
				schema: {
					content: ["application/x-www-form-urlencoded", "multipart/form-data"],

					body: {
						type: "object",
						properties: {
							From: { type: "string" },
							Body: { type: "string" },
						},
						required: ["From", "Body"],
					},
				},
			},
			async (req) => {
				const parsedBody = await parseTwilioSMSReplyBody(req.body as any).catch((error) => {
					ConsoleLogger.error(error, "Failed to parse incoming SMS body")
					return null
				})

				ConsoleLogger.info(parsedBody, "Incoming SMS Query")

				// ConsoleLogger.info(req.body, "Incoming SMS Body")
			}
		)

		await this.#fastify.ready()

		return this
	}

	public ready(): Promise<this> {
		return this[ServiceSymbol.asyncInit]()
	}

	public async listen(): Promise<this> {
		const serverAddress = new URL($public.ISP_NEXUS_APP_URL)
		const { hostname, port, protocol } = serverAddress

		if (protocol === "https:") {
			this.#logger.info(`🔒 Using HTTPS`)
		} else {
			this.#logger.info(`🔓 Using HTTP (No certificate files found)`)
		}

		this.#logger.info(`🚏 Registered routes\n` + this.#fastify.printRoutes({ commonPrefix: false }))

		this.#fastify.listen({
			host: productionEnvironment ? "0.0.0.0" : hostname,
			port: productionEnvironment ? 80 : parseInt(port, 10),
			listenTextResolver: (address) => `Listening on ${address}`,
		})

		return this
	}

	public async waitUntilClosed(): Promise<void> {
		return new Promise((resolve) => {
			this.#fastify.server.on("close", resolve)
		})
	}

	public [Symbol.asyncDispose](): Promise<void> {
		return this.#fastify.close()
	}
}
