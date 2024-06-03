/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { createContext, SetStateAction, useCallback, useContext } from "react"
import type { ViewState } from "react-map-gl"

/**
 * Hook for using the VS Code webview API.
 */
export const useWebviewContext = () => useContext(WebviewContext)

export type PersistWebviewStateFn = (nextWebviewState: SetStateAction<NexusWebviewState>) => void

export interface WebviewContextValue {
	persistWebviewState: PersistWebviewStateFn
	vscode: VSCodeAPI
	initialWebviewState: NexusWebviewState
}

/**
 * React context for working with the VS Code webview.
 */
const WebviewContext = createContext<WebviewContextValue>(null as any)

export interface NexusWebviewState {
	version: number
	mapView: ViewState
}

const SERIALIZED_STATE_SCHEMA_VERSION = 1

/**
 * Default viewport state for the map,
 */
const DEFAULT_SERIALIZED_STATE = {
	version: SERIALIZED_STATE_SCHEMA_VERSION,
	mapView: {
		longitude: -94.38,
		latitude: 36.5,
		zoom: 4,
		pitch: 50,
		bearing: 0,
		padding: {
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
		},
	},
} as const satisfies NexusWebviewState

function validateSerializedState(input: unknown): asserts input is NexusWebviewState {
	if (!input) throw new Error("No serialized state found")

	if (typeof input !== "object") throw new Error("Serialized state is not an object")

	if (!("version" in input) || typeof input.version !== "number") throw new Error("Serialized state is missing version")

	if (input.version !== SERIALIZED_STATE_SCHEMA_VERSION) throw new Error("Serialized state schema version mismatch")
}

/**
 * Pluck the serialized state from the VS Code API.
 *
 * Should be called once on startup.
 */
export function pluckSerializedState(vscode: VSCodeAPI): NexusWebviewState {
	const serializedState = vscode.getState()

	try {
		validateSerializedState(serializedState)
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error"

		console.warn("Failed to pluck serialized state", message)
		return DEFAULT_SERIALIZED_STATE
	}

	console.log("Plucked serialized state", serializedState)
	return serializedState
}

export interface NexusStateProviderProps {
	vscode: VSCodeAPI
	initialWebviewState: NexusWebviewState
	children: React.ReactNode
}

/**
 * Provides the webview state context.
 */
export const NexusStateProvider: React.FC<NexusStateProviderProps> = ({ vscode, initialWebviewState, children }) => {
	const persistWebviewState = useCallback<PersistWebviewStateFn>(
		(nextWebviewState) => {
			const value =
				typeof nextWebviewState === "function"
					? nextWebviewState(vscode.getState() || DEFAULT_SERIALIZED_STATE)
					: nextWebviewState

			try {
				validateSerializedState(value)
			} catch (error) {
				console.warn("Failed to persist serialized state", error)
				return
			}

			vscode.setState(value)
		},
		[vscode]
	)

	const value = {
		vscode,
		persistWebviewState,
		initialWebviewState,
	}

	return (
		<>
			<WebviewContext.Provider value={value}>{children}</WebviewContext.Provider>
		</>
	)
}
