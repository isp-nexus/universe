/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import type * as http from "node:http"
import type * as https from "node:https"

import { IRuntimeLogger } from "@isp.nexus/core/logging"
import { FastifyInstance, FastifyTypeProviderDefault } from "fastify"

export type FastifyHTTPS = FastifyInstance<
	https.Server,
	http.IncomingMessage,
	http.ServerResponse,
	IRuntimeLogger,
	FastifyTypeProviderDefault
>
