/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import "urlpattern-polyfill"

import { commands, ExtensionContext, TextEditor, window } from "vscode"
import { CommandID } from "../common/commands.js"
import { matchFile, VectorLikeFileMatchers } from "../common/files.js"
import { FileOnDropProvider } from "./FileOnDropProvider.js"
import { ReactPanel } from "./ReactPanel.js"

/**
 * Extension activation handler.
 */
export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand(CommandID("displayVersion"), () => {
			window.showInformationMessage("Nexus extension: Version 0.0.1")
		})
	)

	context.subscriptions.push(
		commands.registerCommand(CommandID("viewMap"), () => {
			ReactPanel.createOrShow(context)
		})
	)

	const viewCommandID = CommandID("viewCurrentGeoJSON")

	const viewCurrentGeoJSON = (textEditor: TextEditor) => {
		if (!textEditor?.document) return
		// We only want to show the command if the active editor is a GeoJSON file.
		const match = matchFile(VectorLikeFileMatchers, textEditor.document.fileName, textEditor.document.languageId)

		if (!match) return

		const content = textEditor.document.getText()

		if (!content) return

		const panel = ReactPanel.createOrShow(context)

		panel.dispatchEvent("viewCurrentGeoJSON", {
			filename: textEditor.document.fileName,
			...match,
			content,
		})
	}

	context.subscriptions.push(commands.registerTextEditorCommand(viewCommandID, viewCurrentGeoJSON))

	context.subscriptions.push(FileOnDropProvider.register(context))

	console.log("Nexus extension activated.")
}

/**
 * Extension deactivation handler.
 */
export function deactivate() {
	console.log("Nexus extension deactivated.")
}
