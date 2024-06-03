/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { renderToStaticMarkup } from "react-dom/server"
import { Disposable, ExtensionContext, Uri, ViewColumn, WebviewPanel, window } from "vscode"
import { CSPDirective, WebviewDocument } from "./WebviewDocument.js"
import { generateNonce } from "./csp.js"

/**
 * Manages react webview panels
 */
export class ReactPanel implements INexusEventDispatcher, Disposable {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: ReactPanel | undefined

	private static readonly viewType = "react"

	readonly #panel: WebviewPanel
	readonly #context: ExtensionContext

	/**
	 * Path to the extension directory.
	 */
	protected get extensionUri() {
		return this.#context.extensionUri
	}

	/**
	 * Path to the public directory, i.e. the directory containing the webview's assets.
	 */
	protected get publicDirectory() {
		return Uri.joinPath(this.extensionUri, "dist", "public")
	}

	#disposables: Disposable[] = []

	/**
	 * Build a URI to an asset in the public directory.
	 */
	protected assetPath(...pathSegments: string[]): Uri {
		const onDiskPath = Uri.joinPath(this.publicDirectory, ...pathSegments)

		// And get the special URI to use with the webview
		const webUri = this.#panel.webview.asWebviewUri(onDiskPath)

		return webUri
	}

	public static createOrShow(context: ExtensionContext): ReactPanel {
		const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined

		if (!ReactPanel.currentPanel) {
			console.log("Creating new panel...")
			ReactPanel.currentPanel = new ReactPanel(context, column || ViewColumn.One)
		}

		ReactPanel.currentPanel.#panel.reveal(column)

		return ReactPanel.currentPanel
	}

	private constructor(context: ExtensionContext, column: ViewColumn) {
		this.#context = context

		// Create and show a new webview panel
		this.#panel = window.createWebviewPanel(ReactPanel.viewType, "ISP Nexus", column, {
			enableScripts: true,
			// enableCommandUris: true,
			enableForms: true,
			retainContextWhenHidden: true,

			localResourceRoots: [this.publicDirectory],
		})

		// Set the webview's initial html content
		this.#panel.webview.html = this.renderHTMLDocument()
		this.#panel.iconPath = {
			light: Uri.joinPath(this.extensionUri, "media", "icon-light.svg"),
			dark: Uri.joinPath(this.extensionUri, "media", "icon-dark.svg"),
		}

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this.#panel.onDidDispose(() => this.dispose(), null, this.#disposables)

		// Handle messages from the webview
		this.#panel.webview.onDidReceiveMessage(
			(message: NexusMessageData) => {
				console.log("RECIEVED MESSAGE", message)
				// switch (message.command) {
				// 	case "alert":
				// 		window.showErrorMessage(message.text)
				// 		return
				// }
			},
			null,
			this.#disposables
		)
	}

	/**
	 * Dispatch event to the webview.
	 */
	public dispatchEvent<K extends keyof NexusEventMap>(eventName: K, detail: NexusEventMap[K]): void {
		const message: NexusMessageData<K> = { eventName, detail }

		this.#panel.webview.postMessage(message)
	}

	public dispose() {
		ReactPanel.currentPanel = undefined

		// Clean up our resources
		this.#panel.dispose()

		while (this.#disposables.length) {
			const x = this.#disposables.pop()
			if (x) {
				x.dispose()
			}
		}
	}

	private renderHTMLDocument(): string {
		const mainScriptPath = this.assetPath("main.webview.cjs")
		const mainStylePath = this.assetPath("main.webview.css")
		const { cspSource } = this.#panel.webview

		const nonce = generateNonce()

		const csp: CSPDirective[] = [
			["default-src", ["https://public.isp.nexus", "https://tiles.isp.nexus"]],
			["img-src", [cspSource, "https:", "data:"]],

			["font-src", [cspSource, "https://public.isp.nexus", "https:", "data:"]],
			["script-src", [cspSource, "https://tiles.isp.nexus", `'nonce-${nonce}'`]],
			[
				"connect-src",
				[
					cspSource,
					"https://public.isp.nexus",
					"https://tiles.isp.nexus",
					"https://elevation-tiles-prod.s3.amazonaws.com",
					"https://atlas.lumen.com",
				],
			],
			["worker-src", [cspSource, "blob:"]],

			["style-src", [cspSource, `'unsafe-inline'`, "https:", "data:"]],
		]

		const baseHref = this.assetPath() + "/"

		const htmlTemplate = renderToStaticMarkup(
			<WebviewDocument
				csp={csp}
				baseHref={baseHref}
				nonce={nonce}
				links={
					<>
						<link rel="stylesheet" type="text/css" href={mainStylePath.toString()} />
					</>
				}
			>
				<script nonce={nonce} src={mainScriptPath.toString()}></script>
			</WebviewDocument>
		)

		return `<!DOCTYPE html>${htmlTemplate}`
	}
}
