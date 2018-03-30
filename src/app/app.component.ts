import { Component, OnInit } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import * as mapboxgl from 'mapbox-gl';
import * as SphericalMercator from '@mapbox/sphericalmercator';
import * as workerPath from 'file-loader?name=[name].js!./slope.worker';
import { ZoneDataTranslator } from './zone-data-translator/zone-data-translator'


@Component({
	selector: 'app-root',
	template: '<div id="avymap"></div>',
	styles: [`
		#avymap{
			display: block;
			height: 100%;
			width: 100%;
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

		Object.getOwnPropertyDescriptor(mapboxgl, 'accessToken').set(this.accessToken);
		// https://stackoverflow.com/a/44393954/5648839

		const avymap = 'mapbox://styles/arniebradfo/cjavxlcpj1toe2slb0yco1z9o';
		const outdoors = 'mapbox://styles/mapbox/outdoors-v9';

		this.map = new mapboxgl.Map({
			container: 'avymap',
			style: avymap,
			zoom: this.zoom,
			center: [this.lat, this.lng],
			hash: true
		});

		this.map.on('load', () => {

			this.map.showTileBoundaries = true; // for debug

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

		});

		this.map.on('sourcedata', (e) => {
			if (e.sourceId != 'terrain-rgb-dem')
				return;
			// console.log('sourcedata: ', e);
			if (e.coord && this.createAvyDangerMap)
				this.generateTileInfo(e.coord.canonical);
		});

	}

	onZoneClick(e) {
		console.log(e.features[0].properties.forecastUrl)
		new mapboxgl.Popup()
			.setLngLat(e.lngLat)
			.setHTML(`<a href="${e.features[0].properties.forecastUrl}" target="_blank">${e.features[0].properties.name}</a>`)
			.addTo(this.map);
	}

	layerCount = 0;
	onlyOnce: boolean = false;
	generateTileInfo(tile) {

		if (tile.z != 15) return;

		let worker = new Worker(workerPath);

		worker.addEventListener('message', message => {
			// console.log(message);

			const sourceName = 'elevation-'+this.layerCount;
			const circleName = 'elevation-circles-'+this.layerCount;
			const textName = 'elevation-text-'+this.layerCount;
			const linesName = 'elevation-lines-'+this.layerCount;
			this.map.addSource(sourceName, {
				type: 'geojson',
				data:  message.data.featureCollection,
			});
			this.map.addLayer({
				'id': circleName,
				'source': sourceName,
				'type': 'circle',
				minzoom: 15,
				'paint': {
					'circle-radius': 1,
					'circle-opacity': {
						'property': 'slideProbibilitySigmoid',
						'type': 'identity'
					}
				},
				'filter': ['==', '$type', 'Point'],
			});
			this.map.addLayer({
				'id': linesName,
				'source': sourceName,
				'type': 'line',
				minzoom: 15,
				'layout':{
					'line-cap': 'round'
				},
				'paint': {
					'line-width': 1,
					'line-opacity': {
						'property': 'slideProbibilityGussian',
						'type': 'identity'
					}
				},
				'filter': ['==', '$type', 'LineString'],
			});
			// this.map.addLayer({
			// 	'id': textName,
			// 	'source': sourceName,
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
			// 			'property': 'slideProbibilitySigmoid',
			// 			'type': 'identity'
			// 		}
			// 	},
			// 	'filter': ['==', '$type', 'Point'],
			// });
			this.layerCount++;
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
