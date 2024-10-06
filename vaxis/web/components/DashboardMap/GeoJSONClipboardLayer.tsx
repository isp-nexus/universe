/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

import { tryParsingJSON } from "@isp.nexus/core"
import { ResourceError } from "@isp.nexus/core/errors"
import { Feature, FeatureCollection } from "geojson"
import "maplibre-gl/dist/maplibre-gl.css"
import React, { memo, useCallback, useEffect, useRef, useState } from "react"
import { Layer, Source, useMap } from "react-map-gl/maplibre"

export const GeoJSONClipboardLayer: React.FC = memo(() => {
	const [featureCollections, setSources] = useState<FeatureCollection[]>([])
	const featureCollectionGeometryTypes = useRef<WeakMap<FeatureCollection, Set<Feature["geometry"]["type"]>>>()
	const map = useMap()

	const appendGeoJSON = useCallback((geoJSON: Feature | FeatureCollection) => {
		let featureCollection: FeatureCollection

		if (Array.isArray(geoJSON)) {
			featureCollection = {
				type: "FeatureCollection",
				features: geoJSON,
			}
		} else if (geoJSON.type === "FeatureCollection") {
			featureCollection = geoJSON
		} else if (geoJSON.type === "Feature") {
			featureCollection = {
				type: "FeatureCollection",
				features: [geoJSON],
			}
		} else {
			throw ResourceError.from(400, "Invalid GeoJSON")
		}

		if (featureCollectionGeometryTypes.current) {
			const geometryTypes = new Set<Feature["geometry"]["type"]>()

			for (const feature of featureCollection.features) {
				geometryTypes.add(feature.geometry.type)
			}

			featureCollectionGeometryTypes.current.set(featureCollection, geometryTypes)
		}

		console.log(featureCollection)

		setSources((currentSources) => [...currentSources, featureCollection])
	}, [])

	useEffect(() => {
		featureCollectionGeometryTypes.current = new WeakMap()
	}, [])

	useEffect(() => {
		const handleGeoJSONViewCommand = (event: CustomEvent<EditorFileMatch>) => {
			const possibleJSON = tryParsingJSON<Feature | FeatureCollection>(event.detail.content)

			if (!possibleJSON) {
				console.log("Command content doesn't appear to be GeoJSON")
				return
			}

			appendGeoJSON(possibleJSON)
		}

		window.nexus.addEventListener("viewCurrentGeoJSON", handleGeoJSONViewCommand)

		return () => {
			window.nexus.removeEventListener("viewCurrentGeoJSON", handleGeoJSONViewCommand)
		}
	})

	useEffect(() => {
		const handlePaste = async ({ clipboardData }: ClipboardEvent) => {
			if (!clipboardData) return

			const textDataIndex = clipboardData.types.indexOf("text/plain")

			if (textDataIndex === -1) return

			const item = clipboardData.items[textDataIndex]
			if (!item) return

			const data = await new Promise<string>((resolve) => item.getAsString(resolve))

			if (!data) {
				console.log("No clipboard data")
				return
			}

			const possibleJSON = tryParsingJSON<Feature | FeatureCollection>(data)

			if (!possibleJSON) {
				console.log("Clipboard doesn't appear to be GeoJSON")
				return
			}

			appendGeoJSON(possibleJSON)
		}

		document.addEventListener("paste", handlePaste)

		return () => {
			document.removeEventListener("paste", handlePaste)
		}
	}, [appendGeoJSON])

	useEffect(() => {
		const mapInstance = map.current
		if (!mapInstance) return

		const canvasContainer = mapInstance.getCanvasContainer()

		const handleDragStart = (event: DragEvent) => {
			event.preventDefault()
		}

		const handleDragOver = (event: DragEvent) => {
			event.preventDefault()

			canvasContainer.dataset.status = "dragging"
		}

		const handleDragEnd = (event: DragEvent) => {
			event.preventDefault()
			canvasContainer.dataset.status = "waiting"
		}

		const handleDrop = async (event: DragEvent) => {
			event.preventDefault()

			const { dataTransfer } = event
			if (!dataTransfer) return

			for (const file of dataTransfer.files) {
				const data = await file.text()

				const possibleJSON = tryParsingJSON<Feature | FeatureCollection>(data)

				if (!possibleJSON) continue

				appendGeoJSON(possibleJSON)
				return
			}

			console.log("Clipboard doesn't appear to be GeoJSON")
		}

		window.addEventListener("dragover", handleDragOver)
		window.addEventListener("drop", handleDrop)
		window.addEventListener("dragend", handleDragEnd)
		window.addEventListener("dragstart", handleDragStart)

		return () => {
			window.removeEventListener("dragover", handleDragOver)
			window.removeEventListener("drop", handleDrop)
			window.removeEventListener("dragend", handleDragEnd)
			window.removeEventListener("dragstart", handleDragStart)
		}
	}, [appendGeoJSON, map])

	return (
		<>
			{featureCollections.map((featureCollection, featureCollectionIdx) => {
				// const geometryTypes = featureCollectionGeometryTypes.current?.get(featureCollection)

				return (
					<React.Fragment key={featureCollectionIdx}>
						<Source type="geojson" data={featureCollection} id={`clipboard-${featureCollectionIdx}`} />
						<Layer
							filter={["==", "$type", "Point"]}
							key={`clipboard-${featureCollectionIdx}-point`}
							id={`clipboard-${featureCollectionIdx}-point`}
							type="circle"
							source={`clipboard-${featureCollectionIdx}`}
							paint={{
								"circle-color": "orange",
								"circle-stroke-color": "hsl(0, 0%, 100%)",
								"circle-stroke-width": 2,
								"circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 3, 12, 5],
								"circle-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0.84, 3, 1, 22, 1],
							}}
						/>
					</React.Fragment>
				)
			})}
		</>
	)
})

GeoJSONClipboardLayer.displayName = "GeoJSONClipboardLayer"
