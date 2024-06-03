/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import {
	CancellationToken,
	DataTransfer,
	DataTransferItem,
	Disposable,
	DocumentDropEdit,
	DocumentDropEditProvider,
	DocumentSelector,
	ExtensionContext,
	languages,
	Position,
	SnippetString,
	TextDocument,
} from "vscode"
import { GeoJSONMatcher, pluckFileExtension } from "../common/files"

/**
 * Provider that inserts a numbered list of the names of dropped files.
 *
 * Try dropping one or more files from:
 *
 * - VS Code's explorer
 * - The operating system
 * - The open editors view
 */
export class FileOnDropProvider implements DocumentDropEditProvider {
	public static register(_context: ExtensionContext): Disposable {
		const selector: DocumentSelector = [
			// ---
			{ language: "geojsons" },
			{ language: "plaintext" },
		]

		return languages.registerDocumentDropEditProvider(selector, new FileOnDropProvider())
	}

	protected async createSnippet(transferItem: DataTransferItem, token: CancellationToken): Promise<SnippetString> {
		const fileTransfer = transferItem.asFile()

		if (!fileTransfer) throw new Error("No file transfer")

		const extension = pluckFileExtension(fileTransfer?.uri?.fsPath)

		if (!extension || !GeoJSONMatcher.extensions.includes(extension)) {
			throw new Error("Unsupported file extension: " + extension)
		}

		const data = await fileTransfer.data()

		if (token.isCancellationRequested) throw new Error("createSnippet: Cancelled")

		const text = new TextDecoder().decode(data)

		const snippet = new SnippetString()

		snippet.appendText("Dropped text:\n")
		snippet.appendText(text)

		return snippet
	}

	public async provideDocumentDropEdits(
		_document: TextDocument,
		_position: Position,
		dataTransfer: DataTransfer,
		token: CancellationToken
	): Promise<DocumentDropEdit | null> {
		console.log("FileOnDropProvider!!!")

		// Check the data transfer to see if we have dropped a list of uris

		let textTransferItem: DataTransferItem | undefined

		for (const mimeType of GeoJSONMatcher.mimeTypes) {
			textTransferItem = dataTransfer.get(mimeType)
			if (textTransferItem) break
		}

		if (!textTransferItem) return null

		const snippetViaPlain = await this.createSnippet(textTransferItem, token).catch((error) => {
			console.error("Error creating snippet", error)
			return new SnippetString("Error creating snippet: " + error)
		})

		return new DocumentDropEdit(snippetViaPlain)
	}
}
