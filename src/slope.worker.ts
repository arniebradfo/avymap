import { FeatureCollection, GeometryCollection, Feature } from 'geojson';

// webworker shit
// https://github.com/facebook/create-react-app/issues/1277/#issuecomment-292708809\
// https://github.com/zlepper/typescript-webworker

const worker: Worker = self as any;

worker.addEventListener('message', (message) => {
	// console.log(message);

	const featureCollection: FeatureCollection<GeometryCollection> = {
		type: 'FeatureCollection',
		features: []
	};

	// const avyStartAngle = 30;
	// const avyEndAngle = 50;

	const bbox = {
		west: message.data.bboxArray[0],
		south: message.data.bboxArray[1],
		east: message.data.bboxArray[2],
		north: message.data.bboxArray[3]
	}
	const terrainImgData = message.data.terrainImgData;
	const terrainImg = message.data.terrainImg;
	// const coord = message.data.coord;
	const boundaryBBox = message.data.boundaryBBox;

	let elevationArray = decodeImgDataToElevationArray(terrainImgData.data, terrainImgData.height, terrainImgData.width);

	let lngStep = (bbox.west - bbox.east) / terrainImg.width;
	let latStep = (bbox.north - bbox.south) / terrainImg.height;

	// console.log(lngStep, latStep)
	let xStepMeters = (distanceLatLng([bbox.north, bbox.west], [bbox.north, bbox.east]) + distanceLatLng([bbox.south, bbox.west], [bbox.south, bbox.east])) / 2 / terrainImg.width;
	let yStepMeters = (distanceLatLng([bbox.north, bbox.west], [bbox.south, bbox.west]) + distanceLatLng([bbox.north, bbox.east], [bbox.south, bbox.east])) / 2 / terrainImg.height;
	// console.log(lngStep, latStep, xStepMeters, yStepMeters);

	let h = terrainImg.height;
	let w = terrainImg.width;
	let d = elevationArray;
	let c = getGridCellIndexOfArray;
	for (var row = 0; row < terrainImg.height; row++) {
		for (var col = 0; col < terrainImg.width; col++) {

			const x = lngStep * col + (lngStep / 2) + bbox.east;
			const y = latStep * row + (latStep / 2) + bbox.south;
			const xy: [number, number] = [x, y];

			if (boundaryBBox && (!inRange(x, boundaryBBox[0], boundaryBBox[2]) || !inRange(y, boundaryBBox[1], boundaryBBox[3])))
				continue;

			let feature: Feature<GeometryCollection> = {
				type: 'Feature',
				geometry: {
					type: 'GeometryCollection',
					geometries: [],
				},
				properties: {}
			}

			const currentSlopeAndAspect = slopeAndAspect(
				d[c(h, w, row - 1, col - 1)], d[c(h, w, row - 1, col)], d[c(h, w, row - 1, col + 1)],
				d[c(h, w, row, col - 1)], d[c(h, w, row, col)], d[c(h, w, row, col + 1)],
				d[c(h, w, row + 1, col - 1)], d[c(h, w, row + 1, col)], d[c(h, w, row + 1, col + 1)],
				xStepMeters, yStepMeters
			);

			const currentSlope = currentSlopeAndAspect.slope * (180 / Math.PI)
			const slideProbabilityGaussian = avalancheProbibilityGussian(currentSlope)
			const slideProbabilitySigmoid = avalancheProbibilitySigmoid(currentSlope)
			if (slideProbabilityGaussian < 0.01 && slideProbabilitySigmoid < 0.1)
				continue;

			if (slideProbabilityGaussian < 0.01)
				continue;
			const maxLineLength = (Math.abs(latStep) + Math.abs(lngStep)) / 2.5;
			const length = slideProbabilityGaussian * maxLineLength;
			// if (length > maxLineLength / 50) {
			let x1 = x + length;
			const xy1 = rotatePoint([x1, y], xy, currentSlopeAndAspect.aspect);
			// }

			feature.geometry.geometries = [{
				type: 'Point',
				coordinates: xy
			}, {
				type: 'LineString',
				coordinates: [xy, xy1]
			}]

			feature.properties = {
				elevation: d[c(h, w, row, col)],
				slope: currentSlopeAndAspect.slope,
				aspect: currentSlopeAndAspect.aspect,
				aspectDeg: 360 - (currentSlopeAndAspect.aspect * (180 / Math.PI)),
				slideProbabilityGaussian: slideProbabilityGaussian,
				slideProbabilitySigmoid: slideProbabilitySigmoid,
			}

			featureCollection.features.push(feature);
		}
	}

	// console.log(worker);

	worker.postMessage({
		featureCollection: featureCollection
	});


});
// }

function decodeImgDataToElevationArray(data: number[], height: number, width: number) {
	var dataArray = new Float32Array(height * width);
	for (var i = 0; i < data.length / 4; i++) {
		dataArray[i] = decodeRgbToElevation(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
	}
	return dataArray.reverse();
}


// DANGER FUNCTIONS //
// given a slope in deg, how likely is an avalanche trigger?
var center = 39; // highest avalanche probility is at 39°
var height = 1; // relative avalanche probility is returned as a value between 0 & 1
/**
 * @description an s-curve theory of avy danger increasing with steepness
 * @param deg slope steepness in degrees
 * @returns relative probibility of a slide as a number between 0 and 1
 * @see https://www.desmos.com/calculator/yh2cbmqaw4
**/
function avalancheProbibilitySigmoid(deg) {
	//
	deg -= center;
	const halfHeight = height / 2;
	var magic = 33;
	return deg * halfHeight / Math.sqrt(magic + deg ** 2) + halfHeight
}
/**
 * @description a bell-curve theory of avalance probibiliy, with slopes > 39° decreasing in danger
 * @param deg slope steepness in degrees
 * @returns relative probibility of a slide as a number between 0 & 1
 * @see https://www.desmos.com/calculator/yh2cbmqaw4
**/
function avalancheProbibilityGussian(deg) {
	var power = 1.6;
	var steepness = 20;
	return (height * Math.E) ** (-1 * (steepness * ((Math.abs(-1 + (1 / center) * deg)) ** power)));
}

function inRange(x, a, b) {
	// https://codegolf.stackexchange.com/a/8661
	return (x - a) * (x - b) < 0;
	// return (x - a ^ x - b) < 0; // only works with integers?
}


function rotatePoint(
	point: [number, number],
	center: [number, number],
	rad: number
): [number, number] {
	let x = point[0];
	let y = point[1];
	let cx = center[0];
	let cy = center[1];
	// const rad = rotationDeg * Math.PI / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);

	x -= cx;
	y -= cy;

	let x1 = cos * x - sin * y;
	let y1 = sin * x + cos * y;

	x1 += cx;
	y1 += cy

	return [x1, y1];
}



function decodeRgbToElevation(r: number, g: number, b: number): number {
	return -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1)
}

function getGridCellIndexOfArray(height: number, width: number, row: number, col: number): number {
	// row and col are 0 indexed
	if (row > height || row < 0 || col >= width || col < 0) return NaN;
	return width * row + col;
}

function slopeAndAspect(
	a: number, b: number, c: number,
	d: number, e: number, f: number,
	g: number, h: number, i: number,
	xCellsize: number, yCellsize: number
): { slope: number, aspect: number } {
	for (var index = 0; index < arguments.length; index++) {
		if (isNaN(arguments[index])) return { slope: 0, aspect: 0 };
	}

	let dzdx = ((c + f * 2 + i) - (a + d * 2 + g)) / 8;
	let dzdy = ((g + h * 2 + i) - (a + b * 2 + c)) / 8;
	dzdx /= xCellsize;
	dzdy /= yCellsize;

	// http://desktop.arcgis.com/en/arcmap/10.3/tools/spatial-analyst-toolbox/how-aspect-works.htm
	let aspectRad = Math.atan2(dzdy * -1, dzdx);

	// http://desktop.arcgis.com/en/arcmap/10.3/tools/spatial-analyst-toolbox/how-slope-works.htm
	const riseRun = Math.sqrt(Math.pow(dzdx, 2) + Math.pow(dzdy, 2))
	const slopeRad = Math.atan(riseRun);

	// const aspectDeg = aspectRad * (180 / Math.PI);
	// const slopeDeg = slopeRad * (180 / Math.PI)
	return { slope: slopeRad, aspect: aspectRad };
}

function distanceLatLng(latlng1: [number, number], latlng2: [number, number]): number {
	// https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
	// Haversine Formula: https://en.wikipedia.org/wiki/Haversine_formula

	function deg2rad(deg) { return deg * (Math.PI / 180) }

	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(latlng2[0] - latlng1[0]);  // deg2rad below
	var dLng = deg2rad(latlng2[1] - latlng1[1]);
	var a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(deg2rad(latlng1[0])) * Math.cos(deg2rad(latlng2[0])) *
		Math.sin(dLng / 2) * Math.sin(dLng / 2)
		;
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c; // Distance in km
	return d * 1000; // Distance in meters
}
