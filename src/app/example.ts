// https://www.mapbox.com/bites/00307/

function index() {
    var tileSize,
        everyOther = true,
        drawElev = false;

    L.mapbox.accessToken = 'pk.eyJ1IjoiZG5vbWFkYiIsImEiOiJjaW16aXFsZzUwNHJmdjdra3h0Nmd2cjY1In0.SqzkaKalXxQaPhQLjodQcQ';

    var map = L.map('map_canvas', {
        worldCopyJump: true,
        doubleClickZoom: false,
        center: [38, -120],
        zoom: 13,
        scrollWheelZoom: false
    });

    var hash = L.hash(map);

    L.mapbox.tileLayer('mapbox.outdoors').addTo(map);

    var elevTiles = new L.TileLayer.Canvas({
        unloadInvisibleTiles: true,
        attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
    });


    elevTiles.on('tileunload', function (e) {
        //Send tile unload data to elevWorker to delete un-needed pixel data
        elevWorker.postMessage({ 'data': e.tile._tilePoint.id, 'type': 'tileunload' });
    });

    var elevWorker = new Worker('js/imagedata.js');

    var tileContextsElev = {};

    var locs = location.search.split('?');

    if (locs.length > 1) {
        locs = locs[1].split('=');
    } else {
        locs = ['no']
    }

    var elev_filter;
    if (locs[0] == 'elev') {
        elev_filter = parseInt(locs[1]);
    } else {
        elev_filter = 10;
    }

    elevWorker.postMessage({
        data: elev_filter,
        type: 'setfilter'
    });

    elevTiles.drawTile = function (canvas, tile, zoom) {
        tileSize = this.options.tileSize;

        var context = canvas.getContext('2d'),
            imageObj = new Image(),
            tileUID = '' + zoom + '/' + tile.x + '/' + tile.y;

        var drawContext = canvas.getContext('2d');

        // To access / delete elevTiles later
        tile.id = tileUID;

        tileContextsElev[tileUID] = drawContext;

        imageObj.onload = function () {
            // Draw Image Tile
            context.drawImage(imageObj, 0, 0);

            // Get Image Data
            var imageData = context.getImageData(0, 0, tileSize, tileSize);

            elevWorker.postMessage({
                data: {
                    tileUID: tileUID,
                    tileSize: tileSize,
                    array: imageData.data,
                    drawElev: drawElev
                },
                type: 'tiledata'
            },
                [imageData.data.buffer]);
        };

        // Source of image tile
        imageObj.crossOrigin = 'Anonymous';
        imageObj.src = 'https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/' + zoom + '/' + tile.x + '/' + tile.y + '.pngraw?access_token=' + L.mapbox.accessToken;

    };

    elevWorker.addEventListener('message', function (response) {
        if (response.data.type === 'tiledata') {
            var dispData = tileContextsElev[response.data.data.tileUID].createImageData(tileSize, tileSize);
            dispData.data.set(response.data.data.array);
            tileContextsElev[response.data.data.tileUID].putImageData(dispData, 0, 0);
        }
    }, false);

    elevTiles.addTo(map);

    map.touchZoom.disable();
    map.doubleClickZoom.disable();


    function formatElev(elev) {
        return Math.round(elev) + ' m';
    }
    function formatTemp(temp) {
        return Math.round(temp) + '° f';
    }

}


// importScripts('general-geo-utils.js');

function imagedata() {

    // Tile Data Holder
    var tileData = {};
    var tileDataNDWI = {};

    var colorHash = {
        low: [215, 25, 28],
        mid: [255, 255, 191],
        high: [26, 150, 65]
    }

    var color_filter;

    //Listen for events
    self.addEventListener('message', function (e) {
        // obect to hold various methods based on message to worker
        var edgeFind = {
            // If tile data was sent, add to data object
            tiledata: function (inTile) {
                var dataArray = new Float32Array(65536);
                for (var i = 0; i < inTile.array.length / 4; i++) {
                    var tDataVal = -10000 + ((inTile.array[i * 4] * 256 * 256 + inTile.array[i * 4 + 1] * 256 + inTile.array[i * 4 + 2]) * 0.1);

                    var alpha;

                    if (tDataVal > color_filter) {
                        alpha = 0;
                    } else {
                        alpha = 100;
                    }
                    inTile.array[i * 4] = 10;
                    inTile.array[i * 4 + 1] = 20;
                    inTile.array[i * 4 + 2] = 200;
                    inTile.array[i * 4 + 3] = alpha;

                    dataArray[i] = tDataVal;
                }
                self.postMessage({
                    'data': {
                        'tileUID': inTile.tileUID,
                        'array': inTile.array
                    },
                    'type': 'tiledata'
                },
                    [inTile.array.buffer]
                );
                delete inTile.array;
                tileData[inTile.tileUID] = dataArray;
            },

            // If a tile unload event was sent, delete the corresponding data
            tileunload: function (tileUnloadID) {
                delete tileData[tileUnloadID];
            },

            setfilter: function (elev) {
                color_filter = elev;
            }
        }
        // Call function based on message, send data.
        edgeFind[e.data.type](e.data.data);


    }, false);
}


var offsetPoint = function(p1,a,d){
	var brng = a*(Math.PI/180.0);
	var R = 41807040;
	var lat1 = (Math.PI/180.0)*p1.lat;
	var lon1 = (Math.PI/180.0)*p1.lng;
	var lat2 = Math.asin( Math.sin(lat1)*Math.cos(d/R) + 
              Math.cos(lat1)*Math.sin(d/R)*Math.cos(brng));
	var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(lat1), 
                     Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2));
	
	return {"lat":lat2*(180.0/Math.PI),"lng":lon2*(180.0/Math.PI)}
}
var bearingDegrees = function(p1,p2){
	var dLon = (Math.PI/180.0)*((p2.lng-p1.lng));
	var lat1 = (Math.PI/180.0)*p1.lat;
	var lat2 = (Math.PI/180.0)*p2.lat;
	var y = Math.sin(dLon) * Math.cos(lat2);
	var x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
	var brng = Math.atan2(y, x)*(180.0/Math.PI);
	return brng;
}
var bearingRadians = function(p1,p2){
	var dLon = (Math.PI/180.0)*((p2.lng-p1.lng));
	var lat1 = (Math.PI/180.0)*p1.lat;
	var lat2 = (Math.PI/180.0)*p2.lat;
	var y = Math.sin(dLon) * Math.cos(lat2);
	var x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
	var brng = Math.atan2(y, x);
	return brng;
}
var latLng2tile = function(lat,lon,zoom){
	var eLng = (lon+180)/360*Math.pow(2,zoom);
	var eLat = (1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom);
	//x coord in image tile of lat/lng
	var xInd = Math.round((eLng-Math.floor(eLng))*256);
	//y coord in image tile of lat/lng
	var yInd = Math.round((eLat-Math.floor(eLat))*256);
	//flattened index for clamped array in imagedata
	var fInd = yInd*256+xInd;
	//for calling tile from array
	var eLng = Math.floor(eLng);
	var eLat = Math.floor(eLat);
	return {"tileCall":""+zoom+"/"+eLng+"/"+eLat,"tileX":eLng,"tileY":eLat,"pX":xInd,"pY":yInd,"arrInd":fInd}
}
function haverDistance(p1,p2){
    var R = 41807040;
    var dLat = (Math.PI/180.0)*((p2.lat-p1.lat));
    var dLon = (Math.PI/180.0)*((p2.lng-p1.lng));
    var lat1 = (Math.PI/180.0)*p1.lat,
        lat2 = (Math.PI/180.0)*p2.lat;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d;
}
function roundTo(num) {    
    return +(Math.round(num + "e+2")  + "e-2");
}