import * as React from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import './AvyMap.css'; // after mapbox's css so these overrides win
import { ZoneDataTranslator } from '../services/zone-data-translator/zone-data-translator';
import type { FeatureCollection } from 'geojson';
import mapboxgl from 'mapbox-gl';
import { SphericalMercator } from '@mapbox/sphericalmercator';

// ASSETS
import dangerIcon from '../assets/icon_SlopeDanger.svg';
import pointerRightIcon from '../assets/icons/icon_Pointer_Right.svg';


/** A map control button that tilts the map into 3D and back. */
class ViewToggleControl implements mapboxgl.IControl {
	map: mapboxgl.Map;
	container: HTMLDivElement;
	button: HTMLButtonElement;

	onAdd(map: mapboxgl.Map) {
		this.map = map;
		this.container = document.createElement('div');
		this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
		this.button = document.createElement('button');
		this.button.type = 'button';
		this.button.className = 'view-toggle meta-text';
		this.button.addEventListener('click', () => {
			const is3d = this.map.getPitch() > 0;
			this.map.easeTo({ pitch: is3d ? 0 : 60, bearing: is3d ? 0 : this.map.getBearing() });
		});
		this.container.appendChild(this.button);
		this.update = this.update.bind(this);
		this.map.on('pitchend', this.update);
		this.update();
		return this.container;
	}

	onRemove() {
		this.map.off('pitchend', this.update);
		this.container.remove();
	}

	update() {
		const is3d = this.map.getPitch() > 0;
		this.button.textContent = is3d ? '2D' : '3D';
		this.button.title = is3d ? 'Switch to 2D' : 'Switch to 3D';
		this.button.setAttribute('aria-pressed', String(is3d));
	}
}

type AvyMapProps = {
	flowArrows?: boolean
};

class AvyMap extends React.Component<AvyMapProps> {

	map: mapboxgl.Map;
	readonly accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
	readonly zoom = 8;
	readonly lat = -112;
	readonly lng = 41;
	readonly createAvyDangerMap: boolean = true; // turn rendering on or off

	readonly colors = {
		black:  '#000000',
		red:    '#DD4F00',
		orange: '#FFB600',
		yellow: '#FFE600',
		green:  '#84E000'
	};

	sphericalMercator: SphericalMercator;
	zoneDataTranslator: ZoneDataTranslator;
	declare state: {
		zone?: {
			title: string,
			link: string
		},
		buttonEnabled?: boolean
	};
	readonly minAnalyzeZoom = 13;
	readonly slopeDangerSource = 'slope-danger-source';
	slopeDangerData: FeatureCollection = {
		type: 'FeatureCollection',
		features: []
	}

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
			<div className="avymap">
				<div id="avymap" />
				<div className="toolbar">
					<div className="advertisement">AD</div>
					<div className="avy-zone">
						<h3 className="avy-zone__title">{this.state.zone.title || 'Error'}</h3>
						<a
							className="avy-zone__link button button--muted"
							href={this.state.zone.link}
							target={this.state.zone.link === '' ? '' : '_blank'}>
							<span className="meta-offset">Read Report</span>
							<img alt="Menu" src={pointerRightIcon} className="avy-zone__link-icon"/>
						</a>
					</div>
					<div className="slope-control">
						<button
							className="slope-button"
							disabled={!this.state.buttonEnabled}
							onClick={this.renderSlopeDanger}
							aria-describedby="slope-hint"
							>
							<img className="slope-button__icon" alt="Analyze Slope Danger" src={dangerIcon} height="32" width="32"/>
							<span className="slope-button__label">Analyze Slope</span>
						</button>
						<span
							id="slope-hint"
							className={'slope-control__hint meta-text' + (this.state.buttonEnabled ? ' hidden' : '')}
							aria-live="polite">
							Zoom in more
						</span>
					</div>
				</div>
			</div>
		);
	}

	componentDidMount() {

		this.startMap();

		this.map.on('load', () => {
			// this.map.showTileBoundaries = !this.PRODUCTION; // for debug
			this.addTerrain3d();
			this.addSlopeDanger();
			this.addSlopeFlow();
			this.setFlowArrows(!!this.props.flowArrows);
			// this.addTerrainRgb();
			this.addAvalancheZones();
			// this.renderSlopeDanger();
		});

		// this.attachLoadSlopeDangerOnRgbLoad();
	}

	startMap() {

		const avymap = 'mapbox://styles/arniebradfo/cjavxlcpj1toe2slb0yco1z9o';
		// const outdoors = 'mapbox://styles/mapbox/outdoors-v9';

		mapboxgl.accessToken = this.accessToken;
		this.map = new mapboxgl.Map({
			container: 'avymap',
			style: avymap,
			zoom: this.zoom,
			center: [this.lat, this.lng],
			hash: true,
			attributionControl: false,
			logoPosition: 'top-right'
		});
		this.map.addControl(new mapboxgl.AttributionControl({compact:true}), 'top-right');
		// bottom corners stack upward, so the 3D toggle sits above the compass
		this.map.addControl(new mapboxgl.NavigationControl({ showZoom: false, visualizePitch: true }), 'bottom-right');
		this.map.addControl(new ViewToggleControl(), 'bottom-right');
		this.enableButton();
	}

	// 3D terrain (Mapbox GL v3). Terrain tiles are billed as part of the map load,
	// so this stays inside the free tier along with the base map.
	addTerrain3d() {
		this.map.addSource('mapbox-dem', {
			type: 'raster-dem',
			url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
			tileSize: 512,
			maxzoom: 14
		});
		this.map.setTerrain({ source: 'mapbox-dem', exaggeration: 1 });
		this.map.setFog({});
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
					'stops': [
						[0, .2],
						[.5, 1],
					]
				},
				'line-color': {
					'property': 'slideProbabilityGaussian',
					'stops': [
						[0, this.colors.green],
						[0.33, this.colors.yellow],
						[0.66, this.colors.orange],
						[1, this.colors.red]
					]
				}
			},
			'filter': ['==', '$type', 'LineString'],
		});

		this.map.addLayer({
			'id': 'slope-danger-points',
			'source': this.slopeDangerSource,
			'type': 'circle',
			'paint': {
				'circle-radius': 1.5,
				'circle-opacity': {
					'property': 'slideProbabilitySigmoid',
					'stops': [
						[0, .2],
						[.5, 1],
					]
				},
				'circle-color': {
					'property': 'slideProbabilitySigmoid',
					'stops': [
						[0, this.colors.green],
						[0.2, this.colors.yellow],
						[0.4, this.colors.orange],
						[0.6, this.colors.red],
						[1, this.colors.black]
					]
				}
			},
			'filter': ['==', '$type', 'Point'],
		});

		this.map.addLayer({
			'id': 'slope-danger-bounding-box',
			'source': this.slopeDangerSource,
			'type': 'line',
			'layout': {
				'line-cap': 'round'
			},
			'paint': {
				'line-width': 2,
				'line-color': 'rgba(0,0,0,0.5)'
			},
			'filter': ['==', '$type', 'Polygon'],
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

	// FLOW ARROWS //
	// An optional look for the slope lines: arrow icons pointing downhill, with a
	// pulse that ripples down the slope. The arrows are split into layers by
	// elevation band so the animation only changes each layer's opacity.
	readonly flowBands = 8;          // number of layers the pulse steps through
	readonly flowBandHeight = 15;    // meters of elevation per band
	readonly flowPeriod = 2400;      // ms for the pulse to cross all bands
	flowAnimationFrame = 0;
	analysisZoom = 13;               // tile zoom of the last analysis, sets arrow size

	flowLayerId(band: number) {
		return `slope-danger-flow-${band}`;
	}

	addSlopeFlow() {
		// arrow pointing east, rotated by aspect; drawn white for sdf recoloring
		// chunky proportions so it still reads when scaled down to a few pixels
		const w = 32, h = 20;
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext('2d')!;
		ctx.fillStyle = 'white';
		ctx.fillRect(1, h / 2 - 4, w - 12, 8);
		ctx.beginPath();
		ctx.moveTo(w - 14, 1);
		ctx.lineTo(w - 1, h / 2);
		ctx.lineTo(w - 14, h - 1);
		ctx.closePath();
		ctx.fill();
		this.map.addImage('slope-arrow', ctx.getImageData(0, 0, w, h), { sdf: true });

		for (let band = 0; band < this.flowBands; band++) {
			this.map.addLayer({
				'id': this.flowLayerId(band),
				'source': this.slopeDangerSource,
				'type': 'symbol',
				'layout': {
					'visibility': 'none',
					'icon-image': 'slope-arrow',
					'icon-anchor': 'left',
					'icon-rotate': ['get', 'aspectDeg'],
					'icon-rotation-alignment': 'map',
					'icon-pitch-alignment': 'map',
					'icon-allow-overlap': true,
					'icon-ignore-placement': true,
					'icon-size': this.flowIconSize(),
				},
				'paint': {
					'icon-color': [
						'interpolate', ['linear'], ['get', 'slideProbabilityGaussian'],
						0, this.colors.green,
						0.33, this.colors.yellow,
						0.66, this.colors.orange,
						1, this.colors.red
					],
					'icon-opacity': 1,
					'icon-opacity-transition': { duration: 0, delay: 0 },
				},
				'filter': ['all',
					['==', ['geometry-type'], 'Point'],
					['==', ['%', ['floor', ['/', ['get', 'elevation'], this.flowBandHeight]], this.flowBands], band]
				],
			}, 'slope-danger-points');
		}
	}

	/** arrow length follows danger, and scales with zoom from the analyzed tile's pixel spacing */
	flowIconSize(): any {
		// at zoom analysisZoom + 1 the analyzed pixels are ~4px apart;
		// arrows run 40%-120% of that spacing as danger rises
		const atAnalysis = ['/', ['*', 4, ['+', 0.4, ['*', 0.8, ['get', 'slideProbabilityGaussian']]]], 32];
		const z = this.analysisZoom + 1;
		return ['interpolate', ['exponential', 2], ['zoom'],
			z - 4, ['*', atAnalysis, 2 ** -4],
			z + 6, ['*', atAnalysis, 2 ** 6]
		];
	}

	setFlowArrows(on: boolean) {
		if (!this.map || !this.map.getLayer('slope-danger-lines')) return;
		this.map.setLayoutProperty('slope-danger-lines', 'visibility', on ? 'none' : 'visible');
		for (let band = 0; band < this.flowBands; band++) {
			this.map.setLayoutProperty(this.flowLayerId(band), 'visibility', on ? 'visible' : 'none');
			this.map.setLayoutProperty(this.flowLayerId(band), 'icon-size', this.flowIconSize());
		}
		cancelAnimationFrame(this.flowAnimationFrame);
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (on && !reduceMotion) this.animateFlow(0);
		else for (let band = 0; band < this.flowBands; band++)
			this.map.setPaintProperty(this.flowLayerId(band), 'icon-opacity', 0.9);
	}

	animateFlow(lastFrame: number) {
		this.flowAnimationFrame = requestAnimationFrame(now => {
			if (now - lastFrame < 33) return this.animateFlow(lastFrame); // ~30fps is plenty
			const t = (now % this.flowPeriod) / this.flowPeriod;
			for (let band = 0; band < this.flowBands; band++) {
				// phase 0 is the crest; higher bands reach it first, so the pulse runs downhill
				const phase = (band / this.flowBands + t) % 1;
				const opacity = 0.45 + 0.55 * (1 - phase) ** 3;
				this.map.setPaintProperty(this.flowLayerId(band), 'icon-opacity', opacity);
			}
			this.animateFlow(now);
		});
	}

	componentDidUpdate(prevProps: AvyMapProps) {
		if (prevProps.flowArrows !== this.props.flowArrows)
			this.setFlowArrows(!!this.props.flowArrows);
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

	enableButton(e?: any){
		const zoom = this.map.getZoom();
		// console.log('zoom: '+zoom);
		this.setState({
			buttonEnabled: (zoom > this.minAnalyzeZoom)
		})
	}

	onMapMoveEnd() {

		// TODO: this should select the current avy zone if there is only one from the layer being shown

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

		let bbox: [number, number, number, number] = [
			bounds._sw.lng, // W
			bounds._sw.lat, // S
			bounds._ne.lng, // E
			bounds._ne.lat, // N
		];
		// When tilted in 3D the visible bounds run out to the horizon, so only
		// analyze the area a top-down view would show around the center.
		if (this.map.getPitch() > 0)
			bbox = this.intersectBBox(bbox, this.topDownBBox());
		let xyz = this.sphericalMercator.xyz(bbox, z)

		let tilesXyz: [number, number, number][] = [];
		for (let x = xyz.minX; x <= xyz.maxX; x++) {
			for (let y = xyz.minY; y <= xyz.maxY; y++) {
				tilesXyz.push([x, y, z]);
			}
		}
		this.slopeDangerData.features = [{
			'type': 'Feature',
			'geometry': {
				'type': 'GeometryCollection',
				'geometries':[{
					'type': 'Polygon',
					'coordinates': [
					  [
						[bbox[0], bbox[1]],
						[bbox[2], bbox[1]],
						[bbox[2], bbox[3]],
						[bbox[0], bbox[3]],
						[bbox[0], bbox[1]]
					  ]
					]
				}]
			},
			'properties':{}
		  }];
		this.updateSlopeDangerSource();
		console.log(bounds, z, center, xyz, tilesXyz);

		if (this.analysisZoom !== z) {
			this.analysisZoom = z;
			if (this.props.flowArrows) this.setFlowArrows(true);
		}

		// drop any work still queued from a previous click
		this.renderGeneration++;
		this.workerQueue.length = 0;

		tilesXyz.forEach(tileXyz => this.generateTileInfo({ x: tileXyz[0], y: tileXyz[1], z: tileXyz[2] }, bbox));


	}

	/** [w, s, e, n] of the map footprint at the current zoom as if seen from straight above */
	topDownBBox(): [number, number, number, number] {
		const canvas = this.map.getCanvas();
		const metersPerPixel = 40075016.686 / (512 * 2 ** this.map.getZoom());
		const c = this.sphericalMercator.forward(this.map.getCenter().toArray() as [number, number]);
		const halfW = canvas.clientWidth / 2 * metersPerPixel;
		const halfH = canvas.clientHeight / 2 * metersPerPixel;
		const sw = this.sphericalMercator.inverse([c[0] - halfW, c[1] - halfH]);
		const ne = this.sphericalMercator.inverse([c[0] + halfW, c[1] + halfH]);
		return [sw[0], sw[1], ne[0], ne[1]];
	}

	intersectBBox(a: number[], b: number[]): [number, number, number, number] {
		return [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
	}

	// SLOPE DANGER RENDERING PIPELINE //

	// A small pool of reusable workers instead of one new worker per tile.
	readonly workerCount = Math.min(navigator.hardwareConcurrency || 4, 8);
	workers: Worker[] = [];
	idleWorkers: Worker[] = [];
	workerQueue: { generation: number, message: any, transfer: Transferable[] }[] = [];
	workerJobs = new Map<Worker, number>(); // worker -> generation of the job it's running
	renderGeneration = 0;

	getIdleWorker(): Worker | undefined {
		if (this.idleWorkers.length) return this.idleWorkers.pop();
		if (this.workers.length >= this.workerCount) return undefined;

		const worker = new Worker(new URL('../services/slope.worker.ts', import.meta.url), { type: 'module' });
		worker.addEventListener('message', message => {
			if (this.workerJobs.get(worker) === this.renderGeneration) {
				this.slopeDangerData.features.push(...message.data.featureCollection.features);
				this.updateSlopeDangerSource();
			}
			this.workerJobs.delete(worker);
			this.idleWorkers.push(worker);
			this.runWorkerQueue();
		});
		this.workers.push(worker);
		return worker;
	}

	runWorkerQueue() {
		while (this.workerQueue.length) {
			const worker = this.getIdleWorker();
			if (!worker) return;
			const job = this.workerQueue.shift()!;
			this.workerJobs.set(worker, job.generation);
			worker.postMessage(job.message, job.transfer);
		}
	}

	// setData re-sends every feature to mapbox, so do it at most once per frame
	// rather than once per finished tile.
	sourceUpdatePending = false;
	updateSlopeDangerSource() {
		if (this.sourceUpdatePending) return;
		this.sourceUpdatePending = true;
		requestAnimationFrame(() => {
			this.sourceUpdatePending = false;
			(this.map.getSource(this.slopeDangerSource) as mapboxgl.GeoJSONSource).setData(this.slopeDangerData);
		});
	}

	// Terrain tiles are shared between neighbors, so each one is only fetched once.
	terrainTileCache = new Map<string, Promise<HTMLImageElement | null>>();
	loadTerrainTile(x: number, y: number, z: number): Promise<HTMLImageElement | null> {
		const n = 2 ** z;
		if (y < 0 || y >= n) return Promise.resolve(null);
		x = ((x % n) + n) % n; // wrap around the antimeridian
		const key = `${z}/${x}/${y}`;
		if (!this.terrainTileCache.has(key)) {
			if (this.terrainTileCache.size > 256) this.terrainTileCache.clear();
			this.terrainTileCache.set(key, new Promise(resolve => {
				const url = `https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/${z}/${x}/${y}.pngraw?access_token=${this.accessToken}`;
				const terrainImg = new Image();
				terrainImg.crossOrigin = 'Anonymous';
				terrainImg.onload = () => resolve(terrainImg);
				terrainImg.onerror = () => { this.terrainTileCache.delete(key); resolve(null); };
				terrainImg.src = url;
			}));
		}
		return this.terrainTileCache.get(key)!;
	}

	async generateTileInfo(tile: { x: number, y: number, z: number }, boundaryBBox?: number[]) {

		const generation = this.renderGeneration;

		// get elevation data for this tile and the 8 tiles around it
		const neighbors: { dx: number, dy: number, img: Promise<HTMLImageElement | null> }[] = [];
		for (let dy = -1; dy <= 1; dy++)
			for (let dx = -1; dx <= 1; dx++)
				neighbors.push({ dx, dy, img: this.loadTerrainTile(tile.x + dx, tile.y + dy, tile.z) });

		const terrainImg = await neighbors[4].img;
		if (!terrainImg || generation !== this.renderGeneration) return;

		// Draw the tile with a 1px border borrowed from its neighbors, so the
		// slope of every edge pixel can be calculated and the tiles meet without gaps.
		const size = terrainImg.width;
		const pad = 1;
		const canvas: HTMLCanvasElement = document.createElement('canvas');
		canvas.width = size + pad * 2;
		canvas.height = size + pad * 2;
		const context = canvas.getContext('2d', { willReadFrequently: true })!;
		for (const neighbor of neighbors) {
			const img = await neighbor.img;
			if (img) context.drawImage(img, pad + neighbor.dx * size, pad + neighbor.dy * size);
		}
		if (generation !== this.renderGeneration) return;

		// Get Image Data
		const terrainImgData = context.getImageData(0, 0, canvas.width, canvas.height);

		// the bbox grows by the same 1px border
		const offset = pad / size;
		const sw = this.sphericalMercator.ll([(tile.x - offset) * 256, (tile.y + 1 + offset) * 256], tile.z);
		const ne = this.sphericalMercator.ll([(tile.x + 1 + offset) * 256, (tile.y - offset) * 256], tile.z);

		this.workerQueue.push({
			generation,
			message: {
				bboxArray: [sw[0], sw[1], ne[0], ne[1]], // [w, s, e, n]
				terrainImgData: {
					data: terrainImgData.data,
					height: terrainImgData.height,
					width: terrainImgData.width
				},
				terrainImg: {
					height: canvas.height,
					width: canvas.width
				},
				boundaryBBox: boundaryBBox // [w, s, e, n]
			},
			// hand the pixel buffer to the worker instead of copying it
			transfer: [terrainImgData.data.buffer]
		});
		this.runWorkerQueue();
	}

	componentWillUnmount() {
		cancelAnimationFrame(this.flowAnimationFrame);
		this.workers.forEach(worker => worker.terminate());
	}

}

export default AvyMap;
