addEventListener('message', (message) => {

    // console.log(message);

    let elevationpoints: [number, number][] = [];

    // TODO: add these to the message
    const bbox = {
        west: message.data.bboxArray[0],
        south: message.data.bboxArray[1],
        east: message.data.bboxArray[2],
        north: message.data.bboxArray[3]
    }
    const terrainImgData = message.data.terrainImgData;
    const terrainImg = message.data.terrainImg;
    const coord = message.data.coord;

    var dataArray = new Float32Array(terrainImgData.height * terrainImgData.width);
    for (var i = 0; i < terrainImgData.data.length / 4; i++) {
        dataArray[i] = decodeRgbToElevation(terrainImgData.data[i * 4], terrainImgData.data[i * 4 + 1], terrainImgData.data[i * 4 + 2]);
    }
    // console.log(dataArray);
    dataArray.reverse();

    let lngStep = (bbox.west - bbox.east) / terrainImg.width;
    let latStep = (bbox.north - bbox.south) / terrainImg.height;
    let xStepMeters = (distanceLatLng([bbox.north, bbox.west], [bbox.north, bbox.east]) + distanceLatLng([bbox.south, bbox.west], [bbox.south, bbox.east])) / 2 / terrainImg.width;
    let yStepMeters = (distanceLatLng([bbox.north, bbox.west], [bbox.south, bbox.west]) + distanceLatLng([bbox.north, bbox.east], [bbox.south, bbox.east])) / 2 / terrainImg.height;
    // console.log(lngStep, latStep, xStepMeters, yStepMeters);

    let h = terrainImg.height;
    let w = terrainImg.width;
    for (var row = 0; row < terrainImg.height; row++) {
        for (var col = 0; col < terrainImg.width; col++) {
            var currentElevation = dataArray[getGridCellIndexOfArray(terrainImg.height, terrainImg.width, row, col)];

            const currentSlope = slope(
                dataArray[getGridCellIndexOfArray(h, w, row - 1, col - 1)], dataArray[getGridCellIndexOfArray(h, w, row - 1, col)], dataArray[getGridCellIndexOfArray(h, w, row - 1, col + 1)],
                dataArray[getGridCellIndexOfArray(h, w, row, col - 1)], dataArray[getGridCellIndexOfArray(h, w, row, col)], dataArray[getGridCellIndexOfArray(h, w, row, col + 1)],
                dataArray[getGridCellIndexOfArray(h, w, row + 1, col - 1)], dataArray[getGridCellIndexOfArray(h, w, row + 1, col)], dataArray[getGridCellIndexOfArray(h, w, row + 1, col + 1)],
                xStepMeters, yStepMeters
            );
            if (currentSlope < 35 || currentSlope > 50) continue;

            let x = lngStep * col + (lngStep / 2) + bbox.east;
            let y = latStep * row + (latStep / 2) + bbox.south;
            elevationpoints.push([x,y]);
        }
    }

    postMessage({
        elevationpoints: elevationpoints
    }, undefined);


});

function decodeRgbToElevation(r: number, g: number, b: number): number {
    return -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1)
}

function getGridCellIndexOfArray(height: number, width: number, row: number, col: number): number {
    // row and col are 0 indexed
    if (row > height || row < 0 || col > width || col < 0) return NaN;
    return width * row + col;
}

function slope(
    a: number, b: number, c: number,
    d: number, e: number, f: number,
    g: number, h: number, i: number,
    xCellsize: number, yCellsize: number
): number {
    // http://desktop.arcgis.com/en/arcmap/10.3/tools/spatial-analyst-toolbox/how-slope-works.htm
    for (var index = 0; index < arguments.length; index++) {
        if (isNaN(arguments[index])) return 0;
    }
    const dzdx = ((c + f * 2 + i) - (a + d * 2 + g)) / (8 * xCellsize);
    const dzdy = ((g + h * 2 + i) - (a + b * 2 + c)) / (8 * yCellsize);
    const riseRun = Math.sqrt(Math.pow(dzdx, 2) + Math.pow(dzdy, 2))
    // console.log(riseRun);
    const slopeRad = Math.atan(riseRun);
    const slopeDeg = slopeRad * (180 / Math.PI)

    return slopeDeg;
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