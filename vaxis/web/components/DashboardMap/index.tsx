/**
 * @copyright OpenISP, Inc.
 * @license AGPL-3.0
 * @author Teffen Ellis, et al.
 */

// import "@deck.gl/widgets/stylesheet.css"
import "./styles.css"

import {
	BDCTileSetID,
	BroadbandDataCollectionLayers,
	fetchTileSetSources,
	HSPATileSetID,
	MUATileSetID,
	NexusBaseTileSetID,
	StyleSpecificationComposer,
	TIGERBlocksTileSetID,
	TIGERLayers,
	TIGERTractsTileSetID,
	TileSetSourceID,
	TileSetSourceRecord,
} from "@isp.nexus/cartographer"
import "maplibre-gl/dist/maplibre-gl.css"
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Map, MapRef, NavigationControl, ViewStateChangeEvent } from "react-map-gl/maplibre"
import { useWebviewContext } from "../../contexts/WebviewContext.js"
import { SplashScreen } from "../SplashScreen/index.js"
import { DebugControl } from "./DebugControl.js"
import { GeoJSONClipboardLayer } from "./GeoJSONClipboardLayer.js"

// const MALE_COLOR: Color = [0, 128, 255]
// const FEMALE_COLOR: Color = [255, 0, 128]

// // Source data CSV
// const DATA_URL = "https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/scatterplot/manhattan.json"

// type DataPoint = [longitude: number, latitude: number, gender: number]

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// const layers = [
// 	new ScatterplotLayer<DataPoint>({
// 		id: "scatter-plot",
// 		data: DATA_URL,
// 		radiusScale: 3,
// 		radiusMinPixels: 0.5,
// 		getPosition: (d) => [d[0], d[1], 0],
// 		getFillColor: (d) => (d[2] === 1 ? MALE_COLOR : FEMALE_COLOR),
// 		getRadius: 0.5,
// 		pickable: true,
// 		updateTriggers: {
// 			getFillColor: [MALE_COLOR, FEMALE_COLOR],
// 		},
// 	}),
// ]

// export interface DeckGLOverlayProps extends MapboxOverlayProps {}

// const _DeckGLOverlay: React.FC<DeckGLOverlayProps> = (props) => {
// 	const overlay = useControl<any>(() => new MapboxOverlay(props))
// 	overlay.setProps(props)
// 	return null
// }

const tileSetSourceIDs: TileSetSourceID[] = [
	NexusBaseTileSetID,
	TIGERBlocksTileSetID,
	TIGERTractsTileSetID,
	BDCTileSetID,
	HSPATileSetID,
	MUATileSetID,
]

const DashboardMap: React.FC = () => {
	const { persistWebviewState, initialWebviewState } = useWebviewContext()

	const [tileSetSources, setTileSetSources] = useState<TileSetSourceRecord | null>(null)

	const styleSpec = useMemo(() => {
		if (!tileSetSources) return null
		const styleComposer = new StyleSpecificationComposer({
			sources: {
				...tileSetSources,
				composite: {
					tiles: [
						"https://atlas.lumen.com/v4/atlas-user.ctl-route,atlas-user.lsubsea-9-28,mapbox.mapbox-streets-v7,atlas-user.EdgeSiteLocations-20220926-F,atlas-user.edge-locations-100621,atlas-user.DataCentersCombined-20220921,atlas-user.ctl-buildings-v2,mapbox.mapbox-terrain-v2/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiYXRsYXMtdXNlciIsImEiOiJjbGo2MXBpdHYwMDAwMDh2amtydDVzM3FoIn0.9KS-Xo1Awn6uekXROQtsaA",
					],
					type: "vector",
				},
			},

			layers: [...TIGERLayers, ...BroadbandDataCollectionLayers],
		})

		return styleComposer.toJSON()
	}, [tileSetSources])

	const persistenceFrameRef = useRef<number>()

	const handleViewStateChange = useCallback((event: ViewStateChangeEvent) => {
		self.clearTimeout(persistenceFrameRef.current)
		persistenceFrameRef.current = self.setTimeout(() => {
			persistWebviewState((currentWebViewState) => ({
				...currentWebViewState,
				mapView: event.viewState,
			}))
		}, 500)
	}, [])

	useEffect(() => {
		fetchTileSetSources(tileSetSourceIDs).then((nextTileSources) => {
			setTileSetSources(nextTileSources)
		})
	}, [tileSetSourceIDs])

	if (!styleSpec) {
		return <SplashScreen>Loading map...</SplashScreen>
	}

	return (
		<div className="map-container">
			<Map
				initialViewState={initialWebviewState.mapView}
				onMove={handleViewStateChange}
				maplibreLogo={false}
				mapStyle={styleSpec}
				antialias={true}
				attributionControl={"compact" as any}
				minZoom={3}
				maxPitch={85}
				ref={exposeMapRef}
			>
				<NavigationControl position="top-left" showCompass={true} showZoom={false} visualizePitch={true} />
				{/* <DeckGLOverlay layers={layers} interleaved={true} /> */}
				<GeoJSONClipboardLayer />
				<DebugControl />
			</Map>
		</div>
	)
}

function exposeMapRef(ref: MapRef) {
	Object.assign(window, { map: ref })
}

export default memo(DashboardMap)
