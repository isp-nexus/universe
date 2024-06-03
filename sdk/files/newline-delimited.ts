/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 * @file Utilities for working with newline-delimited files.
 */

import "@isp.nexus/core/polyfills/promises/withResolvers"

import { createWriteStream, read, WriteStream } from "node:fs"
import { FileHandle, open } from "node:fs/promises"

/**
 * Commonly used character codes for newline-delimited files.
 */
export enum LineDelimitedCharacter {
	Newline = 10,
	CarriageReturn = 13,
	Comma = 44,
	One = 49,
	Zero = 48,
	DoubleQuote = 34,
}

/**
 * Given a buffer containing newline-delimited data, yield each line.
 */
export function* takeBufferLines(input: Buffer): Iterable<string> {
	let currentByteIndex = 0
	let lastNewlineIndex = 0

	while (currentByteIndex < input.length) {
		const byte = input[currentByteIndex]

		if (byte === LineDelimitedCharacter.Newline) {
			const line = input.subarray(lastNewlineIndex, currentByteIndex).toString()
			yield line

			lastNewlineIndex = currentByteIndex + 1
		}

		currentByteIndex++
	}

	if (lastNewlineIndex < currentByteIndex) {
		const line = input.subarray(lastNewlineIndex, currentByteIndex).toString()
		yield line
	}
}

export function readRange(fileHandle: FileHandle, start: number, end: number, buffer?: Buffer): Promise<Buffer> {
	buffer ||= Buffer.alloc(end - start)

	return new Promise((resolve, reject) => {
		read(fileHandle.fd, buffer, 0, end - start, start, (error) => {
			if (error) {
				reject(error)
			} else {
				resolve(buffer)
			}
		})
	})
}

interface TakeReadStreamLinesOptions {
	/**
	 * A file handle to use for reading the file. Useful for reusing a file handle across multiple
	 * reads.
	 */
	fileHandle?: FileHandle

	/**
	 * The character to use for newlines. Defaults to the system's newline character.
	 */
	newlineCharacter?: string

	/**
	 * Whether to close the file handle after completion.
	 *
	 * @default true
	 */
	closeFileHandle?: boolean

	/**
	 * The maximum number of lines to yield. Useful for limiting the number of lines read from a file.
	 *
	 * @default Infinity
	 */
	lineLimit?: number
}

/**
 * Given a readable stream containing newline-delimited data, yield each line.
 */
export async function* takeReadStreamLines(
	/**
	 * The path to the CSV, NDJSON, or other newline-delimited file.
	 */
	ndFilePath: string,
	{ fileHandle, lineLimit = Infinity, closeFileHandle = true }: TakeReadStreamLinesOptions = {}
): AsyncIterable<Buffer> {
	fileHandle ??= await open(ndFilePath, "r")

	const stats = await fileHandle.stat()
	const previousCharacterBuffer = Buffer.alloc(1)
	const currentCharacterBuffer = Buffer.alloc(1)
	let lineStartIndex = 0
	let lineCount = 0

	for (let byteIndex = 0; byteIndex < stats.size; byteIndex++) {
		previousCharacterBuffer[0] = currentCharacterBuffer[0]!

		// Read in the current character to determine if it is a newline...
		await readRange(fileHandle, byteIndex, byteIndex + 1, currentCharacterBuffer)

		if (currentCharacterBuffer[0] === LineDelimitedCharacter.Newline || byteIndex === stats.size - 1) {
			const lineEndIndex =
				previousCharacterBuffer[0] === LineDelimitedCharacter.CarriageReturn ? byteIndex - 1 : byteIndex

			// Looks like we're at the end of a line, so we yield the content.
			const line = await readRange(fileHandle, lineStartIndex, lineEndIndex)
			yield line

			lineCount++
			// Finally, we update the start index to the next character.
			lineStartIndex = byteIndex + 1
		}

		if (lineCount >= lineLimit) break
	}

	if (closeFileHandle) {
		await fileHandle.close()
	}
}

export interface CreateNewlineWriterOptions {}

export interface NewlineWriter extends AsyncDisposable {
	writeLine(line: string): Promise<void>
	dispose(): Promise<void>
	writer: WriteStream
}

/**
 * Creates a writer for newline-delimited files.
 */
export function createNewlineWriter(filePath: string): NewlineWriter {
	const writer = createWriteStream(filePath)

	const writeLine = (line: string): Promise<void> => {
		const withResolvers = Promise.withResolvers<void>()

		writer.write(line, "utf8", (error) => {
			if (error) {
				withResolvers.reject(error)
			} else {
				withResolvers.resolve()
			}
		})

		return withResolvers.promise
	}

	const dispose = () => {
		const withResolvers = Promise.withResolvers<void>()

		writer.close((error) => {
			if (error) {
				withResolvers.reject(error)
			} else {
				withResolvers.resolve()
			}
		})

		return withResolvers.promise
	}

	return {
		writeLine,
		writer,
		dispose,
		[Symbol.asyncDispose]: dispose,
	}
}
