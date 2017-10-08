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

	map;
	readonly accessToken = 'pk.eyJ1IjoiYXJuaWVicmFkZm8iLCJhIjoiY2o2OGp4ZnA1MGdkdDJycjB4bzZ3eDVkNiJ9.m3RBvaKuPHz1w-yjSz2LpA';
	readonly zoom = 8;
	readonly lat = -112;
	readonly lng = 41;
	createAvyDangerMap: boolean = false;

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

		this.map = new mapboxgl.Map({
			container: 'avymap',
			style: 'mapbox://styles/mapbox/outdoors-v9',
			zoom: this.zoom,
			center: [this.lat, this.lng],
			hash: true
		});

		this.map.on('load', () => {

			this.map.showTileBoundaries = true; // for debug

			this.map.addLayer({
				'id': 'terrain-rgb',
				'type': 'raster',
				'source': {
					'type': 'raster',
					'url': 'mapbox://mapbox.terrain-rgb',
					'tileSize': 256,
				},
				'minzoom': 10,
				'source-layer': 'terrain-rgb',
				'paint': {
					'raster-opacity': 0.5
				}
			});

		});

		this.map.on('sourcedata', (e) => {
			if (e.sourceId != 'terrain-rgb') return;
			// console.log('sourcedata: ', e);
			if (e.tile && this.createAvyDangerMap)
				this.generateTileInfo(e.tile);
		});

		// this.map.on('zoom', (e) => {
		// 	this.elevationpoints = [];
		// 	// not to kill the gl
		// });

	}

	layerCount = 0;
	onlyOnce: boolean = false;
	generateTileInfo(tile) {

		if (tile.coord.z != 15) return;

		let worker = new Worker(workerPath);

		worker.addEventListener('message', message => {
			// console.log(message);

			const sourceName = 'elevation-'+this.layerCount;
			const circleName = 'elevation-circles-'+this.layerCount;
			const linesName = 'elevation-lines-'+this.layerCount;
			this.map.addSource(sourceName, { 
				type: 'geojson', 
				data:  message.data.featureCollection
			});
			this.map.addLayer({
				'id': circleName,
				'source': sourceName,
				'type': 'circle',
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
			this.layerCount++;			
			worker.terminate();
		});

		// get elevation data
		const url = 'https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/' + tile.coord.z + '/' + tile.coord.x + '/' + tile.coord.y + '.pngraw?access_token=' + this.accessToken;

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
				bboxArray: this.sphericalMercator.bbox(tile.coord.x, tile.coord.y, tile.coord.z), // [w, s, e, n]
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
