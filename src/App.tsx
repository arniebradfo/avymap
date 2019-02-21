import * as React from 'react';
import './App.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import logo from './AvyMap-Logo.svg';
import { ZoneDataTranslator } from './zone-data-translator/zone-data-translator';
import { FeatureCollection } from 'geojson';
import * as mapboxgl from 'mapbox-gl';
// @ts-ignore
import * as SphericalMercator from '@mapbox/sphericalmercator';
import * as workerPath from 'file-loader?name=[name].js!./slope.worker';
import { COLORS } from './colors';


class App extends React.Component {

	readonly PRODUCTION: false;

	map: mapboxgl.Map;
	readonly publicToken  = 'pk.eyJ1IjoiYXJuaWVicmFkZm8iLCJhIjoiY2pzZXZ3ZDE3MWFraTN5bDlvYmJ6eHluMiJ9.aYoOUgdMeagdX5t0W6v_6g';
	readonly privateToken = 'pk.eyJ1IjoiYXJuaWVicmFkZm8iLCJhIjoiY2pzZXZ2eGg4MG11ZzN5cW52M2poeXAydCJ9.Rzu0YVDCCS5aituuEybWeQ';
	readonly zoom = 8;
	readonly lat = -112;
	readonly lng = 41;
	readonly createAvyDangerMap: boolean = true; // turn rendering on or off

	sphericalMercator: SphericalMercator;
	zoneDataTranslator: ZoneDataTranslator;
	state: {
		zone?: {
			title: string,
			link: string
		},
		buttonEnabled?: boolean
	};
	readonly slopeDangerSource = 'slope-danger-source';
	slopeDangerData: FeatureCollection = {
		type: 'FeatureCollection',
		features: []
	}

	readonly goodBadColorStops = [
		[0, COLORS.green],
		[0.33, COLORS.yellow],
		[0.66, COLORS.orange],
		[1, COLORS.red]
	];

	constructor(props: any) {
		super(props)
		this.sphericalMercator = new SphericalMercator();
		this.zoneDataTranslator = new ZoneDataTranslator();
		this.renderSlopeDanger = this.renderSlopeDanger.bind(this);
		this.state = {
			zone: {
				title: 'Click A Zone',
				link: ''
			},
			buttonEnabled: false
		};

	}

	public render() {
		return (
			<div className="App">
				<img className="logo" src={logo} height="31" width="64" />
				<div id="avymap" />
				<div className="toolbar">
					<div className="advertisement">AD</div>
					<div className="avy-zone">
						<h3 className="avy-zone__title">{this.state.zone.title}</h3>
						<a
							className="avy-zone__link"
							href={this.state.zone.link}
							target={this.state.zone.link === '' ? '' : '_blank'}>
							Read Report
						</a>
					</div>
					<button
						className="slope-button"
						disabled={!this.state.buttonEnabled}
						onClick={this.renderSlopeDanger}>
						{this.state.buttonEnabled ? 'Analyze Slope Danger' : 'Zoom Closer To Enable'}
					</button>
				</div>
			</div>
		);
	}

	componentDidMount() {

		this.startMap();

		this.map.on('load', () => {
			if (!this.PRODUCTION)
				this.map.showTileBoundaries = true; // for debug
			this.addSlopeDanger();
			// this.addTerrainRgb();
			this.addAvalancheZones();
			// this.renderSlopeDanger();
		});

		// this.attachLoadSlopeDangerOnRgbLoad();
	}

	startMap() {

		const avymap = 'mapbox://styles/arniebradfo/cjavxlcpj1toe2slb0yco1z9o';
		// const outdoors = 'mapbox://styles/mapbox/outdoors-v9';

		(mapboxgl as any).accessToken = this.PRODUCTION ? this.publicToken : this.privateToken;
		this.map = new mapboxgl.Map({
			container: 'avymap',
			style: avymap,
			zoom: this.zoom,
			center: [this.lat, this.lng],
			hash: true,
			attributionControl: false
		});
		this.map.addControl(new mapboxgl.AttributionControl({compact:true}), 'bottom-right');
	}

	addTerrainRgb() {

		// this.map.addSource('terrain-rgb-dem', {
		// 	"type": "raster-dem",
		// 	"url": "mapbox://mapbox.terrain-rgb"
		// });

		// this.map.addLayer({
		// 	'id': 'terrain-rgb-layer',
		// 	'source': 'terrain-rgb-dem',
		// 	'type': 'hillshade',
		// 	// 'minzoom': 10,
		// 	// 'source-layer': 'terrain-rgb',
		// 	// 'layout': {
		// 	// 	// 'visibility': 'none'
		// 	// },
		// 	// 'paint': {
		// 	// 	'raster-opacity': 0.0
		// 	// }
		// });
	}

	addSlopeDanger() {
		this.map.addSource(this.slopeDangerSource, {
			type: 'geojson',
			data: this.slopeDangerData
		});
		this.map.addLayer({
			'id': 'slope-danger-points',
			'source': this.slopeDangerSource,
			'type': 'circle',
			'paint': {
				'circle-radius': 1.5,
				'circle-opacity': {
					'property': 'slideProbabilitySigmoid',
					'type': 'identity'
				},
				'circle-color': {
					'property': 'slideProbabilitySigmoid',
					'stops': this.goodBadColorStops
				}
			},
			'filter': ['==', '$type', 'Point'],
		});
		this.map.addLayer({
			'id': 'slope-danger-lines',
			'source': this.slopeDangerSource,
			'type': 'line',
			'layout': {
				'line-cap': 'round'
			},
			'paint': {
				'line-width': 1,
				'line-opacity': {
					'property': 'slideProbabilityGaussian',
					'type': 'identity'
				},
				'line-color': {
					'property': 'slideProbabilitySigmoid',
					'stops': this.goodBadColorStops
				}
			},
			'filter': ['==', '$type', 'LineString'],
		});
		// this.map.addLayer({
		// 	'id': 'slope-danger-symbol',
		// 	'source': this.slopeDangerSource,
		// 	'type': 'symbol',
		// 	'layout': {
		// 		'text-field': '➞', // ⊸ ⇁ → ➡ ➞ ➜ ➔ ⫯ ⭢ ⧐
		// 		// 'text-font': 'consolas',
		// 		'text-rotate': {
		// 			'property': 'aspectDeg',
		// 			'type': 'identity'
		// 		},
		// 		'text-size': 6,
		// 		'text-padding': 0,
		// 		'text-allow-overlap': true
		// 	},
		// 	'paint': {
		// 		'text-opacity': {
		// 			'property': 'slideProbabilitySigmoid',
		// 			'type': 'identity'
		// 		}
		// 	},
		// 	'filter': ['==', '$type', 'Point'],
		// });
		// this.map.addLayer({
		// 	id: 'slope-danger-heatmap',
		// 	type: 'heatmap',
		// 	source: this.slopeDangerSource,
		//     "heatmap-weight": [
		//         "interpolate",
		//         ["linear"],
		//         ["get", "slideProbabilitySigmoid"],
		//         0, 0,
		//         1, 1
		// 	],
		// 	"heatmap-color": [
		//         "interpolate",
		//         ["linear"],
		//         ["heatmap-density"],
		//         0, "rgba(33,102,172,0)",
		//         0.2, "rgb(103,169,207)",
		//         0.4, "rgb(209,229,240)",
		//         0.6, "rgb(253,219,199)",
		//         0.8, "rgb(239,138,98)",
		//         1, "rgb(178,24,43)"
		// 	],
		// 	"heatmap-radius": [1],
		// 	'filter': ['==', '$type', 'Point'],
		// });
	}

	addAvalancheZones() {
		this.map.addSource('avalanche-zone-source', {
			type: 'geojson',
			data: this.zoneDataTranslator.geoJson
		});
		this.map.addLayer({
			'id': 'avalanche-zone-fill',
			'type': 'fill',
			'source': 'avalanche-zone-source',
			'paint': {
				'fill-color': {
					'stops': [
						[7, 'rgba(0,0,0,0.2)'],
						[12, 'rgba(0,0,0,0)']
					]
				}
			}
		});
		this.map.addLayer({
			'id': 'avalanche-zone-line',
			'type': 'line',
			'source': 'avalanche-zone-source',
			'paint': {
				'line-color': 'rgba(0,0,0,1)',
				'line-width': 1
			}
		});
		this.map.addLayer({
			'id': 'avalanche-zone-point',
			'source': 'avalanche-zone-source',
			'type': 'circle',
			'paint': {
				'circle-radius': 5,
				'circle-opacity': 1
			},
			'filter': ['==', '$type', 'Point'],
		});

		this.map.on('click', 'avalanche-zone-fill', this.onZoneClick.bind(this));
		this.map.on('click', 'avalanche-zone-point', this.onZoneClick.bind(this));
		this.map.on('moveend', this.onMapMoveEnd.bind(this));
		this.map.on('zoom', this.enableButton.bind(this));
	}

	enableButton(e: any){
		const zoom = this.map.getZoom();
		// console.log('zoom: '+zoom);
		this.setState({
			buttonEnabled: (zoom > 13)
		})

	}

	onMapMoveEnd() {

		// this should select the current avy zone if there is only one from the layer being shown

		// const bounds = this.map.getBounds()
		// console.log(bounds);

		// const bBox: [mapboxgl.PointLike,mapboxgl.PointLike] = [[bounds.ne[0],bounds.ne[1]],[bounds.sw[0],bounds.sw[1]]];
		// const features = this.map.queryRenderedFeatures(bBox , {layers:['airport']});

		// console.log(features);


		// if (features) {
			// var uniqueFeatures = getUniqueFeatures(features, "iata_code");
			// // Populate features for the listing overlay.
			// renderListings(uniqueFeatures);

			// // Clear the input container
			// filterEl.value = '';

			// // Store the current features in sn `airports` variable to
			// // later use for filtering on `keyup`.
			// airports = uniqueFeatures;
		// }

	}

	onZoneClick(e: any) {
		console.log(e)
		console.log(e.features[0])
		this.setState({zone:{
			title: e.features[0].properties.name,
			link: e.features[0].properties.forecastUrl
		}})

		// adds a popup to the map
		// new mapboxgl.Popup()
		// 	.setLngLat(e.lngLat)
		// 	.setHTML(`<a style="margin:24px;" href="${e.features[0].properties.forecastUrl}" target="_blank">${e.features[0].properties.name}</a>`)
		// 	.addTo(this.map);
	}

	attachLoadSlopeDangerOnRgbLoad() {
		this.map.on('sourcedata', (e: any) => {
			if (e.sourceId != 'terrain-rgb-dem')
				return;
			// console.log('sourcedata: ', e);
			if (e.coord && this.createAvyDangerMap)
				this.generateTileInfo(e.coord.canonical);
		});
	}

	renderSlopeDanger() {

		let bounds: any = this.map.getBounds();
		let z = Math.floor(this.map.getZoom()) - 1;
		let center = this.map.getCenter();

		let bbox = [
			bounds._sw.lng, // W
			bounds._sw.lat, // S
			bounds._ne.lng, // E
			bounds._ne.lat, // N
		];
		let xyz = this.sphericalMercator.xyz(bbox, z)

		let tilesXyz: [number, number, number][] = [];
		for (let x = xyz.minX; x <= xyz.maxX; x++) {
			for (let y = xyz.minY; y <= xyz.maxY; y++) {
				tilesXyz.push([x, y, z]);
			}
		}
		this.slopeDangerData.features = [];
		console.log(bounds, z, center, xyz, tilesXyz);

		tilesXyz.forEach(tileXyz => this.generateTileInfo({ x: tileXyz[0], y: tileXyz[1], z: tileXyz[2] }, bbox));
	}

	generateTileInfo(tile: { x: number, y: number, z: number }, boundaryBBox?: number[]) {

		// if (tile.z != 15) return;

		let worker = new Worker(workerPath);

		worker.addEventListener('message', message => {
			// console.log(message.data.featureCollection.features);
			this.slopeDangerData.features.push(...message.data.featureCollection.features);
			console.log(this.slopeDangerData);

			(this.map.getSource(this.slopeDangerSource) as mapboxgl.GeoJSONSource).setData(this.slopeDangerData);
			worker.terminate();
		});

		// get elevation data
		const url = `https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/${tile.z}/${tile.x}/${tile.y}.pngraw?access_token=${this.publicToken}`;

		let terrainImg = new Image();

		terrainImg.onload = (e) => {
			// console.dir(terrainImg);

			var canvas: HTMLCanvasElement = document.createElement('canvas');
			canvas.width = terrainImg.width;
			canvas.height = terrainImg.height;

			// Draw Image Tile
			var context = canvas.getContext('2d')!;
			context.drawImage(terrainImg, 0, 0);

			// Get Image Data
			var terrainImgData = context.getImageData(0, 0, terrainImg.width, terrainImg.height);
			// console.dir(terrainImgData.data);

			worker.postMessage({
				bboxArray: this.sphericalMercator.bbox(tile.x, tile.y, tile.z), // [w, s, e, n]
				terrainImgData: terrainImgData,
				terrainImg: {
					height: terrainImg.height,
					width: terrainImg.width
				},
				boundaryBBox: boundaryBBox // [w, s, e, n]
			});

		};
		terrainImg.crossOrigin = 'Anonymous';
		terrainImg.src = url;
	}


}

export default App;
