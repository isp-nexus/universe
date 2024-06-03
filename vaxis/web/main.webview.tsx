/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import "./main.webview.css"

import "urlpattern-polyfill"

import { createRoot } from "react-dom/client"
import { NexusClient } from "./NexusClient"
import DashboardMap from "./components/DashboardMap/index.js"
import { NexusStateProvider, pluckSerializedState } from "./contexts/WebviewContext"

console.profile("Webview render")

const vscode = acquireVsCodeApi()
window.nexus = new NexusClient(vscode)

const root = document.getElementById("root")

if (!root) {
	throw new Error("Cannot render React app: no root element found")
}

createRoot(root).render(
	<NexusStateProvider vscode={vscode} initialWebviewState={pluckSerializedState(vscode)}>
		<DashboardMap />
	</NexusStateProvider>
)

window.nexus.dispatchEvent("webview-ready", { timestamp: Date.now() })

console.profileEnd("Webview render")
