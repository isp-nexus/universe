/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

export {}

/**
 * Global augmentation for the Nexus client.
 *
 * @internal
 */
declare global {
	interface NexusEventMap {
		"webview-ready": { timestamp: number }
		viewCurrentGeoJSON: EditorFileMatch
	}

	type NexusEventName = keyof NexusEventMap
	type NexusEventListener<T extends NexusEventName = NexusEventName> = (
		this: unknown,
		nexusEvent: CustomEvent<NexusEventMap[T]>
	) => void

	type NexusMessageData<T extends NexusEventName = NexusEventName> = { eventName: T; detail: NexusEventMap[T] }

	interface INexusEventDispatcher {
		dispatchEvent<K extends keyof NexusEventMap>(eventName: K, detail: NexusEventMap[K]): void
	}

	interface INexusEventTarget {
		addEventListener<K extends keyof NexusEventMap>(
			eventName: K,
			listener: NexusEventListener<K>,
			options?: boolean | AddEventListenerOptions
		): void

		removeEventListener<K extends keyof NexusEventMap>(
			eventName: K,
			listener: NexusEventListener<K>,
			options?: boolean | EventListenerOptions
		): void
	}

	interface INexusClient extends INexusEventDispatcher, INexusEventTarget {}

	interface Window {
		nexus: INexusClient
	}
}
