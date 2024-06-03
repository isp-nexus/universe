/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { ResourceError } from "@isp.nexus/core/errors"
import type { LayerSpecification } from "@maplibre/maplibre-gl-style-spec"

const kNext: unique symbol = Symbol("next")
const kPrev: unique symbol = Symbol("prev")

/**
 * Declares a namespaced layer identifier.
 */
export function LayerID<Namespace extends string, LayerID extends string>(
	namespace: Namespace,
	layer: LayerID
): `${Namespace}/${LayerID}` {
	return `${namespace}/${layer}`
}

export type LayerSpecificationListInput<T extends LayerSpecification = LayerSpecification> = T &
	({ beforeID?: string; afterID?: never } | { afterID?: string; beforeID?: never })

export type LayerSpecificationListItem<T extends LayerSpecification = LayerSpecification> = T & {
	[kNext]?: LayerSpecificationListItem
	[kPrev]?: LayerSpecificationListItem
}

export class LayerSpecificationList {
	#layersByID = new Map<string, LayerSpecificationListItem>()
	#headLayer: LayerSpecificationListItem | undefined

	constructor(layers: LayerSpecification[]) {
		if (layers.length === 0) {
			throw new Error("No layers provided")
		}

		layers.forEach((item, index) => {
			const prev: LayerSpecificationListItem | undefined = layers[index - 1]
			const next: LayerSpecificationListItem | undefined = layers[index + 1]

			if (prev) {
				prev[kNext] = item
			}

			if (next) {
				next[kPrev] = item
			}

			this.#layersByID.set(item.id, item)

			if (index === 0) {
				this.#headLayer = item
			}
		})
	}

	public *takeLayer(fromID?: string): Iterable<LayerSpecificationListItem> {
		let item: LayerSpecificationListItem | undefined

		if (fromID) {
			item = this.#layersByID.get(fromID)

			if (!item) {
				throw ResourceError.from(404, `Layer with ID ${fromID} not found`)
			}
		} else {
			if (!this.#headLayer) return

			item = this.#headLayer
		}

		while (item) {
			yield item

			item = item[kNext]
		}
	}

	public *[Symbol.iterator](): Iterator<LayerSpecificationListItem> {
		yield* this.takeLayer()
	}

	public insert(input: LayerSpecificationListInput) {
		const layerToInsert: LayerSpecificationListItem = input

		if (input.beforeID && input.afterID) {
			throw ResourceError.from(400, `Layer (${layerToInsert.id}) cannot provide both \`beforeID\` and \`afterID\``)
		}

		if (input.beforeID) {
			const beforeLayer = this.#layersByID.get(input.beforeID)

			if (!beforeLayer) {
				throw ResourceError.from(404, `Cannot insert layer (${input.id}) before non-existent layer (${input.beforeID})`)
			}

			const prev = beforeLayer[kPrev]

			if (prev) {
				prev[kNext] = layerToInsert
			}

			beforeLayer[kPrev] = layerToInsert
			layerToInsert[kNext] = beforeLayer
		} else if (input.afterID) {
			const afterLayer = this.#layersByID.get(input.afterID)

			if (!afterLayer) {
				throw ResourceError.from(404, `Cannot insert layer (${input.id}) after non-existent layer (${input.afterID})`)
			}

			const next = afterLayer[kNext]

			if (next) {
				next[kPrev] = layerToInsert
				layerToInsert[kNext] = next
			}

			afterLayer[kNext] = layerToInsert
			layerToInsert[kPrev] = afterLayer
		} else {
			throw ResourceError.from(400, `Layer (${input.id}) must provide either \`beforeID\` or \`afterID\``)
		}

		this.#layersByID.set(layerToInsert.id, layerToInsert)
	}

	public remove(layerID: string) {
		const item = this.#layersByID.get(layerID)
		if (!item) return

		const prev = item[kPrev]
		const next = item[kNext]

		if (prev) {
			prev[kNext] = next
		}

		if (next) {
			next[kPrev] = prev
		}

		this.#layersByID.delete(layerID)
	}
}
