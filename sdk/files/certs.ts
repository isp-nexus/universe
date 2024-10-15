/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 *
 *   Utilities for working with SSL certificates.
 */

import { repoRootPathBuilder } from "@isp.nexus/sdk/monorepo"
import * as fs from "node:fs/promises"
import type { TlsOptions } from "node:tls"

/**
 * Result of reading local development cert files.
 */
export type TLSCertResult = Required<Pick<TlsOptions, "key" | "cert">>

/**
 * Attempts to read local development cert files if they are available.
 *
 * ```sh
 * mkcert dev.isp.nexus localhost 127.0.0.1 ::1
 * ```
 *
 * @category Utilities
 * @category Certificates
 */
export function readCertFiles(): Promise<TLSCertResult | null> {
	return Promise.all([
		fs.readFile(repoRootPathBuilder("certs", "dev.isp.nexus+3-key.pem")),
		fs.readFile(repoRootPathBuilder("certs", "dev.isp.nexus+3.pem")),
	])
		.then(([key, cert]) => ({ key, cert }))
		.catch(() => null)
}
