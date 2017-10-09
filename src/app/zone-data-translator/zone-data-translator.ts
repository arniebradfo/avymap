import * as unitedStatesZones from './raw-map-data/united-states-avy-zones.json';
import * as unitedStatesCenters from './raw-map-data/united-states-avy-centers.json';

import * as canadaZones from './raw-map-data/canada-polygons.geo.json';
import * as canadaFeatures from './raw-map-data/canada-features.json';

import * as europeCountries from './raw-map-data/europe-country.geo.json';
import * as europeProvidences from './raw-map-data/europe-prov.geo.json';
import * as europeRegions from './raw-map-data/europe-region.geo.json';
import * as europeSubRegions from './raw-map-data/europe-subreg.geo.json';
import * as europeFeatures from './raw-map-data/europe-features.json';
import * as europeServices from './raw-map-data/europe-services-4.json';
import { GeoJsonObject, GeometryCollection, FeatureCollection } from 'geojson';

export class ZoneDataTranslator {

    geoJson: FeatureCollection<GeometryCollection> = {
        type: 'FeatureCollection', 
        features: []
    }

    // TODO: option to get raw values from source
    raw = {
        unitedStatesZones: unitedStatesZones,
        unitedStatesCenters: unitedStatesCenters,
        canadaZones: canadaZones,
        canadaFeatures: canadaFeatures,
        europeCountries: europeCountries,
        europeRegions: europeRegions,
        europeSubRegions: europeSubRegions,
        europeProvidences: europeProvidences,
        europeFeatures: europeFeatures,
        europeServices: europeServices
    }
    
    constructor(){
        console.log(this);
        this.constructGeoJson();
    }

    constructGeoJson() {
        this.raw.canadaZones['features'].forEach(feature => {
            this.geoJson.features.push({
                type: 'Feature',
                geometry: feature.geometry,
                properties: {
                    id: feature.properties.id,
                    name: feature.properties.display
                    // url: 'https://www.avalanche.ca/forecasts/'+
                }
            });

        });
        this.raw.unitedStatesZones['rows'].forEach(row => {
            this.geoJson.features.push({
                type: 'Feature',
                geometry: row.row.geojson,
                properties: {

                }
            });
        });
        this.raw.europeSubRegions['features'].forEach(feature => {
            this.geoJson.features.push(feature);
        });

    }

}