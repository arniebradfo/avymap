import { Component, OnInit } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import * as mapboxgl from 'mapbox-gl';
import * as SphericalMercator from '@mapbox/sphericalmercator';


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

	constructor(
		private http: Http
	) { }

	elevationpoints: [number, number][] = [];
	elevationGeoJson = {
		"type": "MultiPoint",
		"coordinates": this.elevationpoints
	}

	ngOnInit(): void {

		mapboxgl.accessToken = this.accessToken;
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
					"raster-opacity": 0.5
				}
			});

			this.map.addSource('elevation-circles', { type: 'geojson', data: this.elevationGeoJson });
			this.map.addLayer({
				"id": "elevation-circles",
				"type": "circle",
				"source": "elevation-circles",
				"paint": {
					"circle-radius": 1
				}
			});
		});

		this.map.on('sourcedata', (e) => {
			if (e.sourceId != 'terrain-rgb') return;
			// console.log('sourcedata: ', e);
			if (e.tile)
				this.generateTileInfo(e.tile);
		});

	}

	decodeRgbToElevation(r: number, g: number, b: number): number {
		return -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1)
	}

	onlyOnce: boolean = false;
	generateTileInfo(tile) {

		if (!this.onlyOnce)
			this.onlyOnce = true;
		else
			return;

		console.log(tile);

		// get elevation data
		const url = 'https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/' + tile.coord.z + '/' + tile.coord.x + '/' + tile.coord.y + '.pngraw?access_token=' + this.accessToken;
		// console.log(url);

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

			var dataArray = new Float32Array(terrainImgData.height * terrainImgData.width);
			for (var i = 0; i < terrainImgData.data.length / 4; i++) {
				dataArray[i] = this.decodeRgbToElevation(terrainImgData.data[i * 4], terrainImgData.data[i * 4 + 1], terrainImgData.data[i * 4 + 2]);
			}
			// console.log(dataArray);
			dataArray.reverse();

			let sphericalMercator =  new SphericalMercator();
			let bboxArray = sphericalMercator.bbox(tile.coord.x, tile.coord.y, tile.coord.z); // [w, s, e, n]
			let bbox = {
				west: bboxArray[0],
				south: bboxArray[1],
				east: bboxArray[2],
				north: bboxArray[3]
			}
			console.log(tile.coord.z+'/'+tile.coord.x+'/'+tile.coord.y, bbox);
			
			let lngStep = (bbox.west - bbox.east)/terrainImg.width;
			let latStep = (bbox.north - bbox.south)/terrainImg.height;
			console.log(lngStep, latStep);
			
			for (var row = 0; row < terrainImg.height; row++) {
				for (var col = 0; col < terrainImg.width; col++) {
					var currentElevation = dataArray[this.getGridCellIndexOfArray(terrainImg.height,terrainImg.width,row,col)];
					if (currentElevation > 2000) continue;
					let x = lngStep * col + (lngStep / 2) + bbox.east;
					let y = latStep * row + (latStep / 2) + bbox.south;
					this.elevationpoints.push([x,y]);		
				}			
			}

			console.log(this.elevationpoints);
			this.map.getSource('elevation-circles').setData({
				"type": "MultiPoint",
				"coordinates": this.elevationpoints
			});

		};
		terrainImg.crossOrigin = 'Anonymous';
		terrainImg.src = url;
	}

	getGridCellIndexOfArray(height: number, width: number, row: number, column: number): number {
		// row and col are 0 indexed
		return width * row + column;
	}

}
