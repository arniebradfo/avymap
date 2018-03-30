import { Component, OnInit } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import * as mapboxgl from 'mapbox-gl';
import * as SphericalMercator from '@mapbox/sphericalmercator';
import * as workerPath from 'file-loader?name=[name].js!./slope.worker';
import { ZoneDataTranslator } from './zone-data-translator/zone-data-translator'
import { FeatureCollection, GeoJsonObject, GeometryObject } from 'geojson';


@Component({
	selector: 'app-root',
	template: `
		<div id="avymap"></div>
		<button (click)="renderSlopeDanger()">Render Slope Danger!</button>
	`,
	styles: [`
		#avymap{
			display: block;
			height: 100%;
			width: 100%;
		}
		button{
			position: fixed;
			top: 0;
			left: 0;
			margin: 10px;
		}
	`]
})
export class AppComponent implements OnInit {

	map; //: mapboxgl.Map;
	readonly accessToken = 'pk.eyJ1IjoiYXJuaWVicmFkZm8iLCJhIjoiY2o2OGp4ZnA1MGdkdDJycjB4bzZ3eDVkNiJ9.m3RBvaKuPHz1w-yjSz2LpA';
	readonly zoom = 8;
	readonly lat = -112;
	readonly lng = 41;
	createAvyDangerMap: boolean = true; // turn rendering on or off

	sphericalMercator: SphericalMercator;
	zoneDataTranslator: ZoneDataTranslator;

	constructor(
		private http: Http
	) {
		this.sphericalMercator = new SphericalMercator();
		this.zoneDataTranslator = new ZoneDataTranslator();
	}

	ngOnInit(): void {

		this.startMap();

		this.map.on('load', () => {
			this.map.showTileBoundaries = true; // for debug
			this.addSlopeDanger();
			this.addTerrainRgb();
			this.addAvalancheZones();
		});

		this.map.on('sourcedata', (e) => {
			if (e.sourceId != 'terrain-rgb-dem')
				return;
			// console.log('sourcedata: ', e);
			if (e.coord && this.createAvyDangerMap)
				this.generateTileInfo(e.coord.canonical);
		});

	}

	startMap(){

		const avymap = 'mapbox://styles/arniebradfo/cjavxlcpj1toe2slb0yco1z9o';
		const outdoors = 'mapbox://styles/mapbox/outdoors-v9';

		(mapboxgl as any).accessToken = this.accessToken;
		this.map = new mapboxgl.Map({
			container: 'avymap',
			style: avymap,
			zoom: this.zoom,
			center: [this.lat, this.lng],
			hash: true
		});
	}

	addTerrainRgb(){

		this.map.addSource('terrain-rgb-dem', {
			"type": "raster-dem",
			"url": "mapbox://mapbox.terrain-rgb"
		});

		this.map.addLayer({
			'id': 'terrain-rgb-layer',
			'source': 'terrain-rgb-dem',
			'type': 'hillshade',
			// 'minzoom': 10,
			// 'source-layer': 'terrain-rgb',
			// 'layout': {
			// 	// 'visibility': 'none'
			// },
			// 'paint': {
			// 	'raster-opacity': 0.0
			// }
		});
	}

	slopeDangerSource = 'slope-danger-source';
	slopeDangerData: FeatureCollection<GeometryObject> = {
		type: "FeatureCollection",
		features: []
	}
	addSlopeDanger() {
		this.map.addSource(this.slopeDangerSource, {
			type: 'geojson',
			data:  this.slopeDangerData
		});
		// this.map.addLayer({
		// 	'id': 'slope-danger-points',
		// 	'source': this.slopeDangerSource,
		// 	'type': 'circle',
		// 	minzoom: 15,
		// 	'paint': {
		// 		'circle-radius': 1,
		// 		'circle-opacity': {
		// 			'property': 'slideProbibilitySigmoid',
		// 			'type': 'identity'
		// 		}
		// 	},
		// 	'filter': ['==', '$type', 'Point'],
		// });
		// this.map.addLayer({
		// 	'id': 'slope-danger-lines',
		// 	'source': this.slopeDangerSource,
		// 	'type': 'line',
		// 	minzoom: 15,
		// 	'layout':{
		// 		'line-cap': 'round'
		// 	},
		// 	'paint': {
		// 		'line-width': 1,
		// 		'line-opacity': {
		// 			'property': 'slideProbibilityGussian',
		// 			'type': 'identity'
		// 		}
		// 	},
		// 	'filter': ['==', '$type', 'LineString'],
		// });
		this.map.addLayer({
			'id': 'slope-danger-symbol',
			'source': this.slopeDangerSource,
			'type': 'symbol',
			minzoom: 15,
			'layout': {
				'text-field': '➞', // ⊸ ⇁ → ➡ ➞ ➜ ➔ ⫯ ⭢ ⧐
				// 'text-font': 'consolas',
				'text-rotate': {
					'property': 'aspectDeg',
					'type': 'identity'
				},
				'text-size': 6,
				'text-padding': 0,
				'text-allow-overlap': true
			},
			'paint': {
				'text-opacity': {
					'property': 'slideProbibilitySigmoid',
					'type': 'identity'
				}
			},
			'filter': ['==', '$type', 'Point'],
		});
		// this.map.addLayer({
		// 	id: 'slope-danger-heatmap',
		// 	type: 'heatmap',
		// 	source: this.slopeDangerSource,
		// 	minzoom: 15,
        //     "heatmap-weight": [
        //         "interpolate",
        //         ["linear"],
        //         ["get", "slideProbibilitySigmoid"],
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
			data:  this.zoneDataTranslator.geoJson
		});
		this.map.addLayer({
			'id': 'avalanche-zone-fill',
			'type': 'fill',
			'source': 'avalanche-zone-source',
			'paint': {
				'fill-color': 'rgba(0,0,0,0.2)',
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
	}

	onZoneClick(e) {
		console.log(e.features[0].properties.forecastUrl)
		new mapboxgl.Popup()
			.setLngLat(e.lngLat)
			.setHTML(`<a href="${e.features[0].properties.forecastUrl}" target="_blank">${e.features[0].properties.name}</a>`)
			.addTo(this.map);
	}

	renderSlopeDanger() {
		console.log('rendering slope danger!');
		// if (e.coord && this.createAvyDangerMap)
		// 	this.generateTileInfo(e.coord.canonical);
	}

	generateTileInfo(tile) {

		if (tile.z != 15) return;

		let worker = new Worker(workerPath);

		worker.addEventListener('message', message => {
			// console.log(message.data.featureCollection.features);
			this.slopeDangerData.features.push(...message.data.featureCollection.features);
			console.log(this.slopeDangerData);

			this.map.getSource(this.slopeDangerSource).setData(this.slopeDangerData);
			worker.terminate();
		});

		// get elevation data
		const url = `https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/${tile.z}/${tile.x}/${tile.y}.pngraw?access_token=${this.accessToken}`;

		let terrainImg = new Image();

		terrainImg.onload = (e) => {
			// console.dir(terrainImg);

			var canvas: HTMLCanvasElement = document.createElement('canvas');
			canvas.width = terrainImg.width;
			canvas.height = terrainImg.height;

			// Draw Image Tile
			var context = canvas.getContext('2d');
			context.drawImage(terrainImg, 0, 0);

			// Get Image Data
			var terrainImgData = context.getImageData(0, 0, terrainImg.width, terrainImg.height);
			// console.dir(terrainImgData.data);

			// console.log(coord.z+'/'+coord.x+'/'+coord.y, bbox);
			worker.postMessage({
				bboxArray: this.sphericalMercator.bbox(tile.x, tile.y, tile.z), // [w, s, e, n]
				terrainImgData: terrainImgData,
				terrainImg: {
					height: terrainImg.height,
					width: terrainImg.width
				}
			});

		};
		terrainImg.crossOrigin = 'Anonymous';
		terrainImg.src = url;
	}

}
