/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { IRuntimeLogger, pluckOrCreatePrefixedLogger } from "@isp.nexus/core/logging"
import chalk from "chalk"
import { AbstractLogger, LogLevel, LogMessage, QueryRunner } from "typeorm"

/**
 * Performs logging of the events in TypeORM. This version of logger uses console to log events and
 * use syntax highlighting.
 */
export class TypeORMLogger extends AbstractLogger {
	static DefaultLevels: LogLevel[] = ["warn", "error"] as const
	private logger: IRuntimeLogger
	constructor(logger: IRuntimeLogger | string, levels: LogLevel[] = TypeORMLogger.DefaultLevels) {
		super(levels)
		this.logger = pluckOrCreatePrefixedLogger(logger)
	}
	/**
	 * Logging functions needed by AdvancedConsoleLogger
	 */
	#logInfo(prefix: string, info: any) {
		this.logger.info(`${chalk.gray.underline(prefix)} ${info}`)
	}

	#logError(prefix: string, error: any) {
		this.logger.error(`${chalk.underline.red(prefix)} ${error}`)
	}

	#logWarn(prefix: string, warning: any) {
		this.logger.warn(`${chalk.underline.yellow(prefix)} ${warning}`)
	}

	#log(message: string) {
		this.logger.info(chalk.underline(message))
	}

	#error(error: any) {
		return chalk.red(error)
	}

	#warn(message: string) {
		return chalk.yellow(message)
	}

	/**
	 * Write log to specific output.
	 */
	protected writeLog(level: LogLevel, logMessage: LogMessage | LogMessage[], _queryRunner?: QueryRunner) {
		const messages = this.prepareLogMessages(logMessage)

		for (const message of messages) {
			switch (message.type ?? level) {
				case "log":
				case "schema-build":
				case "migration":
					this.#log(String(message.message))
					break

				case "info":
				case "query":
					if (typeof message.message === "string" && message.message.includes("PRAGMA")) {
						break
					}

					if (message.prefix) {
						this.#logInfo(message.prefix, `\n${message.message}`)
					} else {
						this.#log(`\n${message.message}`)
					}
					break

				case "warn":
				case "query-slow":
					if (message.prefix) {
						this.#logWarn(message.prefix, message.message)
					} else {
						this.logger.warn(this.#warn(String(message.message)))
					}
					break

				case "error":
				case "query-error":
					if (message.prefix) {
						this.#logError(message.prefix, `\n${message.message}`)
					} else {
						this.logger.error(this.#error(`\n${message.message}`))
					}
					break
			}
		}
	}
}
