import { Component, OnInit } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import * as mapboxgl from 'mapbox-gl';
import * as geoViewport from '@mapbox/geo-viewport';


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


  constructor(
    private http: Http
  ) {

  }

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
      var addedLayer = this.map.addLayer({
        "id": "terrain-rgb",
        "type": "raster",
        "source": {
          "type": "raster",
          "url": "mapbox://mapbox.terrain-rgb",
          "tileSize": 256
        },
        "source-layer": "terrain-rgb",
        "paint": {
          "raster-opacity": 0.5
        }
      });
      // console.log(addedLayer);
    });

    this.map.on('data', (e)=>{
      if (e.sourceId != 'terrain-rgb') return;
      console.log('data: ', e);

      // add geojson source
      // update geojson source
      // https://www.mapbox.com/mapbox-gl-js/example/live-geojson/

    });

    // this.map.on('error', (e)=>{
    //   console.log('error: ', e);
    // });
    // this.map.on('sourcedata', (e)=>{
    //   console.log('sourcedata: ', e);
    // });
    // this.map.on('dataloading', (e)=>{
    //   console.log('dataloading: ', e);
    // });
    // this.map.on('style.load', (e)=>{
    //   console.log('style.load: ', e);
    // });

    // get elevation data
    // const url = 'https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/' + this.z + '/' + this.x + '/' + this.y + '.pngraw?access_token=' + this.accessToken;
    // console.log(url);

    // let imageObj = new Image();

    // imageObj.onload = (e) => {
    //   console.dir(imageObj);

    //   var canvas: HTMLCanvasElement = document.createElement("canvas");
    //   canvas.width = imageObj.width;
    //   canvas.height = imageObj.height;

    //   // Draw Image Tile
    //   var context = canvas.getContext('2d');
    //   context.drawImage(imageObj, 0, 0);

    //   // Get Image Data
    //   var imageData = context.getImageData(0, 0, imageObj.width, imageObj.height);

    //   // console.dir(imageData);
    //   var inTile = {
    //     array: imageData.data
    //   }

    //   const imgViewport = geoViewport.bounds([this.x, this.y], this.z, [imageObj.width, imageObj.height], 256);
    //   console.log(imgViewport);


    //   // tiledata: function (inTile) {
    //   var dataArray = new Float32Array(65536);
    //   for (var i = 0; i < inTile.array.length / 4; i++) {
    //     var tDataVal = -10000 + ((inTile.array[i * 4] * 256 * 256 + inTile.array[i * 4 + 1] * 256 + inTile.array[i * 4 + 2]) * 0.1);
    //     dataArray[i] = tDataVal;
    //   }
    //   // console.log(dataArray);


    //   // pixel counts match
    //   // console.log('dataArray.length: ', dataArray.length);
    //   // console.log('total image pixels: ', imageObj.height * imageObj.width);


    //   // elevWorker.postMessage({
    //   //     data: {
    //   //         tileUID: tileUID,
    //   //         tileSize: tileSize,
    //   //         array: imageData.data,
    //   //         drawElev: drawElev
    //   //     },
    //   //     type: 'tiledata'
    //   // },
    //   //     [imageData.data.buffer]);
    // };
    // imageObj.crossOrigin = 'Anonymous';
    // imageObj.src = url;


    // this.http.get(url)
    //   .map((res: Response) => {
    //     console.log('response');
    //     res.json();
    //   })
    //   .catch((error: any) => Observable.throw(error.json().error || 'Server error'));

    // listen for zoomlevel
    // calculate slope and aspect
    // sream lines onto the map

  }

}
