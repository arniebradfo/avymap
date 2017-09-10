import { Component, OnInit } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import * as mapboxgl from 'mapbox-gl';
import * as geoViewport from '@mapbox/geo-viewport';


/**
	get rawdata from terrain tiles
	use surface API
	translate tile xy to latlon - project, unproject
	SpehricalMercador.xyz() // https://github.com/mapbox/mapbox-studio-classic/blob/5ac2ead1e523b24c8b8ad8655babb66389166e87/ext/sphericalmercator.js
	
**/



@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

	map;
	accessToken = 'pk.eyJ1IjoiYXJuaWVicmFkZm8iLCJhIjoiY2o2OGp4ZnA1MGdkdDJycjB4bzZ3eDVkNiJ9.m3RBvaKuPHz1w-yjSz2LpA';
	z = 8;
	x = -112;
	y = 41;

	gl: WebGLRenderingContext;


	constructor(
		private http: Http
	) { }

	// elevationpoints: [number, number][] = [];
	// elevationGeoJson = {
	// 	"type": "MultiPoint",
	// 	"coordinates": this.elevationpoints
	// }

	ngOnInit(): void {

		mapboxgl.accessToken = this.accessToken;
		this.map = new mapboxgl.Map({
			container: 'avymap',
			style: 'mapbox://styles/mapbox/outdoors-v9',
			zoom: this.z,
			center: [this.x, this.y],
			hash: true
		});

		this.map.on('load', () => {

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
				// "paint": {
				// 	"raster-opacity": 0.5
				// }
			});

			this.gl = this.map.getCanvas().getContext('webgl');
			// this.gl = document.createElement('canvas').getContext('webgl');
			console.log(this.gl);
			console.log(this.gl.getParameter(this.gl.VIEWPORT));


			// window.setInterval(()=>{
			// 	this.map.getSource('elevation-circles').setData(this.elevationGeoJson);
			// }, 2000);

			// this.map.addSource('elevation-circles', { type: 'geojson', data: this.elevationGeoJson });
			// this.map.addLayer({
			// 	"id": "elevation-circles",
			// 	"type": "circle",
			// 	"source": "elevation-circles",
			// 	"paint": {
			// 		"circle-radius": 3
			// 	}
			// });
		});

		// this.map.on('data', (e)=>{
		//   if (e.sourceId != 'terrain-rgb') return;
		//   console.log('data: ', e);

		//   add geojson source
		//   update geojson source
		//   https://www.mapbox.com/mapbox-gl-js/example/live-geojson/

		// });



		// this.map.on('error', (e)=>{
		//   console.log('error: ', e);
		// });
		this.map.on('sourcedata', (e) => {
			if (e.sourceId != 'terrain-rgb') return;
			// console.log('sourcedata: ', e);

			if (e.tile)
				this.generateTileInfo(e.tile);

		});
		// this.map.on('dataloading', (e)=>{
		//   if (e.sourceId != 'terrain-rgb') return;
		//   console.log('dataloading: ', e);
		// });
		// this.map.on('style.load', (e)=>{
		//   console.log('style.load: ', e);
		// });

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

		// make a framebuffer
		let fb = this.gl.createFramebuffer();

		// make this the current frame buffer
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);

		// // attach the texture to the framebuffer.
		this.gl.framebufferTexture2D(
			this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
			this.gl.TEXTURE_2D, tile.texture, 0);

		// check if you can read from this type of texture.
		let canRead: boolean = (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) == this.gl.FRAMEBUFFER_COMPLETE);

		// Unbind the framebuffer
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

		if (canRead) {

			// bind the framebuffer
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
			this.gl.viewport(0,0,tile.texture.size, tile.texture.size);
			
			let imageData = new Uint8Array(tile.texture.size * tile.texture.size * 4);
			// read the pixels
			this.gl.readPixels(
				0, 0,
				tile.texture.size, tile.texture.size,
				this.gl.RGBA,
				this.gl.UNSIGNED_BYTE,
				imageData
			);
			console.log(imageData);


			// Unbind the framebuffer
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

			var dataArray = new Float32Array(tile.texture.size * tile.texture.size);
			for (var i = 0; i < imageData.length / 4; i++) {
				dataArray[i] = this.decodeRgbToElevation(imageData[i * 4], imageData[i * 4 + 1], imageData[i * 4 + 2]);
			}
			console.log(dataArray);
		}



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
			console.dir(terrainImgData.data);

			var dataArray = new Float32Array(terrainImgData.height * terrainImgData.width);
			for (var i = 0; i < terrainImgData.data.length / 4; i++) {
				dataArray[i] = this.decodeRgbToElevation(terrainImgData.data[i * 4], terrainImgData.data[i * 4 + 1], terrainImgData.data[i * 4 + 2]);
			}
			console.log(dataArray);

			// const tileCenter = tile.sourceCache.transform.center; // DAMMIT THIS IS THE CENTER OF THE MAP!!!
			// const tileZoom = tile.sourceCache.transform.zoom;
			// console.log(tileCenter);
			// const imgViewport = geoViewport.bounds([tileCenter.lng, tileCenter.lat], tileZoom, [terrainImg.width, terrainImg.height], terrainImg.width);
			// console.log(imgViewport);

			// pixel counts match
			// console.log('dataArray.length: ', dataArray.length);
			// console.log('total image pixels: ', terrainImg.height * terrainImg.width);

		};

		terrainImg.crossOrigin = 'Anonymous';
		terrainImg.src = url;
	}

	getGridCellFromArray(height: number, width: number, row: number, column: number): number {
		// row and col are 0 indexed
		return width * row + column;
	}

}
