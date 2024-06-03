import { ControlPosition, LngLat, MapGeoJSONFeature, MapLayerMouseEvent, Point } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { memo, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { IControl, MapInstance, useControl, useMap } from "react-map-gl/maplibre"

class DebugControlBase implements IControl<MapInstance> {
	public readonly container: HTMLElement

	constructor() {
		this.container = document.createElement("div")
		this.container.classList.add("feature-targets")
	}

	public onAdd(_map: MapInstance): HTMLElement {
		return this.container
	}

	public onRemove(_map: MapInstance): void {
		this.container.remove()
	}

	public getDefaultPosition(): ControlPosition {
		return "bottom-left"
	}
}

export const DebugControl: React.FC = memo(() => {
	const [_pointerPosition, setPointerPosition] = useState<Point>()
	const [pointerCoords, setPointerCoords] = useState<LngLat>()
	const [featureTargets, setFeatureTargets] = useState<MapGeoJSONFeature[]>()

	const debugControl = useControl(() => new DebugControlBase())
	const map = useMap()

	useEffect(() => {
		const mapInstance = map.current
		if (!mapInstance) return

		const handleMouseMove = (event: MapLayerMouseEvent) => {
			const nextPointerPosition = event.point
			const nextPointerCoords = event.lngLat.wrap()
			const nextFeatureTargets = event.target
				.queryRenderedFeatures(nextPointerPosition, {
					filter: ["!=", ["get", "pmap:kind"], "earth"],
				})
				.filter((feature) => (feature.layer.metadata as any)?.queryable !== false)
				.slice(0, 5)

			setPointerCoords(nextPointerCoords)
			setFeatureTargets(nextFeatureTargets)
			setPointerPosition(nextPointerPosition)
		}

		mapInstance.on("mousemove", handleMouseMove)

		return () => {
			mapInstance.off("mousemove", handleMouseMove)
		}
	}, [])

	return createPortal(
		<>
			{featureTargets?.map((feature, index) => {
				const layerID = feature.layer.id
				const properties: string =
					"pmap:kind" in feature.properties ? feature.properties.name : JSON.stringify(feature.properties, null, 2)

				return (
					<div key={index}>
						<strong>{layerID}</strong>
						<pre className="feature-properties">{properties}</pre>
					</div>
				)
			})}
			{/* {pointerPosition ? (
				<div className="position-details">
					<span>
						<strong>X:</strong>
						<span>{pointerPosition.x}</span>
					</span>
					<span>
						<strong>Y:</strong>
						<span>{pointerPosition.y}</span>
					</span>
				</div>
			) : null} */}

			{pointerCoords ? (
				<div className="coord-details">
					<span>
						<strong>Longitude:</strong>
						<span>{pointerCoords.lng}</span>
					</span>
					<span>
						<strong>Latitude:</strong>
						<span>{pointerCoords.lat}</span>
					</span>
				</div>
			) : null}
		</>,
		debugControl.container
	)
})

DebugControl.displayName = "DebugControl"
