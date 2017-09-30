import { Component, OnInit } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import * as mapboxgl from 'mapbox-gl';
import * as SphericalMercator from 'sphericalmercator';

import * as workerPath from 'file-loader?name=[name].js!./slope.worker';



/**
	get rawdata from terrain tiles and translate it to elevation somehow
	use surface API	
**/



@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

	map;
	accessToken = 'pk.eyJ1IjoiYXJuaWVicmFkZm8iLCJhIjoiY2o2OGp4ZnA1MGdkdDJycjB4bzZ3eDVkNiJ9.m3RBvaKuPHz1w-yjSz2LpA';
	zoom = 8;
	lat = -112;
	lng = 41;
	sphericalMercator: SphericalMercator;

	constructor(
		private http: Http
	) {
		this.sphericalMercator = new SphericalMercator();
	}

	elevationpoints: [number,number][] = [];
	elevationlines: [[number,number],[number,number]][] = [];
	
	elevationPointsGeoJson = {
		"type": "MultiPoint",
		"coordinates": this.elevationpoints
	}
	elevationLinesGeoJson = {
		"type": "MultiLineString",
		"coordinates": this.elevationlines
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

			this.map.showTileBoundaries = true;

			// this.map.addLayer({
			// 	"id": "terrain-data",
			// 	"type": "line",
			// 	"source": {
			// 		type: 'vector',
			// 		url: 'mapbox://mapbox.mapbox-terrain-v2'
			// 	},
			// 	"source-layer": "contour",
			// 	"layout": {
			// 		"line-join": "round",
			// 		"line-cap": "round"
			// 	},
			// 	"paint": {
			// 		"line-color": "#ff69b4",
			// 		"line-width": 1
			// 	}
			// });

			this.map.addLayer({
				"id": "terrain-rgb",
				"type": "raster",
				"source": {
					"type": "raster",
					"url": "mapbox://mapbox.terrain-rgb",
					"tileSize": 256,
				},
				"minzoom": 10,
				"source-layer": "terrain-rgb",
				"paint": {
					"raster-opacity": 0.0
				}
			});

			this.map.addSource('elevation-circles', { type: 'geojson', data: this.elevationPointsGeoJson });
			this.map.addLayer({
				"id": "elevation-circles",
				"type": "circle",
				"source": "elevation-circles",
				"paint": {
					"circle-radius": 1,
					// "circle-opacity": 0.5
				}
			});
			this.map.addSource('elevation-lines', { type: 'geojson', data: this.elevationLinesGeoJson });
			this.map.addLayer({
				"id": "elevation-lines",
				"type": "line",
				"source": "elevation-lines",
				"layout":{
					"line-cap": "round"
				},
				"paint": {
					"line-width": 1,
					"line-opacity": 0.5,
				}
			});
		});

		this.map.on('sourcedata', (e) => {
			if (e.sourceId != 'terrain-rgb') return;
			// console.log('sourcedata: ', e);
			if (e.tile)
				this.generateTileInfo(e.tile);
		});

		// this.map.on('zoom', (e) => {
		// 	this.elevationpoints = [];
		// 	// not to kill the gl
		// });

	}


	onlyOnce: boolean = false;
	generateTileInfo(tile) {

		if (tile.coord.z != 15) return;

		// console.log(tile);

		let worker = new Worker(workerPath);

		worker.addEventListener('message', message => {
			// console.log(message.data.elevationpoints);

			this.elevationpoints = this.elevationpoints.concat(message.data.elevationpoints);
			this.map.getSource('elevation-circles').setData({
				"type": "MultiPoint",
				"coordinates": this.elevationpoints
			});

			this.elevationlines = this.elevationlines.concat(message.data.elevationlines);
			this.map.getSource('elevation-lines').setData({
				"type": "MultiLineString",
				"coordinates": this.elevationlines
			});

			worker.terminate();
		});

		// get elevation data
		const url = 'https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/' + tile.coord.z + '/' + tile.coord.x + '/' + tile.coord.y + '.pngraw?access_token=' + this.accessToken;

		let terrainImg = new Image();

		terrainImg.onload = (e) => {
			// console.dir(terrainImg);

			var canvas: HTMLCanvasElement = document.createElement("canvas");
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
