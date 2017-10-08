import * as unitedStatesZones from './raw-map-data/united-states-avy-zones.json';
import * as unitedStatesCenters from './raw-map-data/united-states-avy-centers.json';

import * as canadaZones from './raw-map-data/canada-polygons.geo.json';

import * as europeCountries from './raw-map-data/europe-country.geo.json';
import * as europeProvidences from './raw-map-data/europe-providence.geo.json';
import * as europeFeatures from './raw-map-data/europe-features.json';
import * as europeServices from './raw-map-data/europe-services-4.json';
import { GeoJsonObject, GeometryCollection, FeatureCollection } from 'geojson';

export class ZoneDataTranslator {

    geoJson: {
        us: FeatureCollection<GeometryCollection>,
        ca: FeatureCollection<GeometryCollection>,
        eu: FeatureCollection<GeometryCollection>
    } = {
        us: { type: 'FeatureCollection' , features: [] },
        ca: { type: 'FeatureCollection' , features: [] },
        eu: { type: 'FeatureCollection' , features: [] }
    }

    raw = {
        unitedStatesZones: unitedStatesZones,
        unitedStatesCenters: unitedStatesCenters,
        canadaZones: canadaZones,
        europeCountries: europeCountries,
        europeProvidences: europeProvidences,
        europeFeatures: europeFeatures,
        europeServices: europeServices
    }
    
    constructor(){
        console.log(this);
        this.constructGeoJson();
    }

    constructGeoJson() {
        // this.geoJson.ca.features = this.raw.canadaZones['features'];
    }

}