import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  map;
  accessToken = 'pk.eyJ1IjoiYXJuaWVicmFkZm8iLCJhIjoiY2o2OGp4ZnA1MGdkdDJycjB4bzZ3eDVkNiJ9.m3RBvaKuPHz1w-yjSz2LpA';

  constructor() { }

  ngOnInit(): void {
    mapboxgl.accessToken = this.accessToken;
    this.map = new mapboxgl.Map({
        container: 'avymap',
        style: 'mapbox://styles/mapbox/outdoors-v9',
        zoom: 8,
        center: [-112, 41.5],
        hash: true
    });


    // get elevation data
    // listen for zoomlevel
    // calculate slope and aspect
    // sream lines onto the map

  }
}
