/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

type DelegatedWeakMap = WeakMap<NexusEventListener, (event: MessageEvent<NexusMessageData>) => void>

export class NexusClient implements INexusClient {
	#listenerMapByName = new Map<NexusEventName, DelegatedWeakMap>()
	#vscode: VSCodeAPI
	constructor(vscode: VSCodeAPI) {
		this.#vscode = vscode
	}

	dispatchEvent<K extends keyof NexusEventMap>(eventName: K, detail: NexusEventMap[K]): void {
		const message: NexusMessageData<K> = { eventName, detail }

		this.#vscode.postMessage(message)
	}

	/**
	 * Listen for a message event, and dispatch it to the listener.
	 */
	public addEventListener<K extends keyof NexusEventMap>(
		eventName: K,
		listener: NexusEventListener<K>,
		options?: boolean | AddEventListenerOptions
	): void {
		const messageDelegate = (event: MessageEvent<NexusMessageData<K>>) => {
			if (!event.data || typeof event.data !== "object") return
			if (event.data.eventName !== eventName) return

			const customEvent = new CustomEvent(eventName, { detail: event.data.detail })

			listener(customEvent)
		}

		let eventListeners = this.#listenerMapByName.get(eventName)

		if (!eventListeners) {
			eventListeners = new WeakMap()
			this.#listenerMapByName.set(eventName, eventListeners)
		}

		eventListeners.set(listener as any, messageDelegate as any)

		self.addEventListener("message", messageDelegate, options)
	}

	/**
	 * Remove a listener from the event bus.
	 */
	public removeEventListener<K extends keyof NexusEventMap>(
		eventName: K,
		listener: NexusEventListener<K>,
		options?: boolean | EventListenerOptions
	): void {
		const eventListeners = this.#listenerMapByName.get(eventName)

		if (!eventListeners) {
			console.warn("No listeners for event", eventName)
			return
		}

		const messageDelegate = eventListeners?.get(listener as any)

		if (!messageDelegate) {
			console.warn("No message delegate for listener", listener.name)
			return
		}

		self.removeEventListener("message", messageDelegate, options)
	}
}
