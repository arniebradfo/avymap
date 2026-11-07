import unitedStatesZones from './raw-map-data/united-states-avy-zones.json';
import unitedStatesCenters from './raw-map-data/united-states-avy-centers.json';

import canadaZones from './raw-map-data/canada-polygons.geo.json';
import canadaFeatures from './raw-map-data/canada-features.json';

import europeCountries from './raw-map-data/europe-country.geo.json';
import europeProvidences from './raw-map-data/europe-prov.geo.json';
import europeRegions from './raw-map-data/europe-region.geo.json';
import europeSubRegions from './raw-map-data/europe-subreg.geo.json';
import europeFeatures from './raw-map-data/europe-features.json';
import europeServices from './raw-map-data/europe-services-4.json';
import type { FeatureCollection, Feature, Point, Polygon, MultiPolygon } from 'geojson';

export class ZoneDataTranslator {

	geoJson: FeatureCollection = {
		type: 'FeatureCollection',
		features: []
	}

	// TODO: option to get raw values from source
	raw: Record<string, any> = {
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

	constructor() {
		console.log(this);
		this.constructGeoJson();
	}

	constructGeoJson() {

		this.raw.canadaZones['features'].forEach((feature: Feature<Polygon>) => {

			feature.properties = feature.properties || {}; // prevents null ref

			let url = 'https://www.avalanche.ca/'
			if (this.raw.canadaFeatures['forecast-regions'][feature.properties.id])
				url = this.raw.canadaFeatures['forecast-regions'][feature.properties.id]['url']
			else if (this.raw.canadaFeatures['hot-zones'][feature.properties.id])
				url = this.raw.canadaFeatures['hot-zones'][feature.properties.id]['url']
			// else console.log(feature.properties.id); // ['north-shore', 'whistler-blackcomb'] // no link
			this.geoJson.features.push({
				type: 'Feature',
				geometry: feature.geometry,
				properties: {
					id: feature.properties.id,
					name: feature.properties.display,
					forecastUrl: url
				}
			});
		});

		this.raw.unitedStatesZones['rows'].forEach((row: any) => {
			if (row.row.geojson.type === 'MultiPolygon') {
				// United States MultiPoloygons are not set to the correct spec // `Merica!!!
				// so we have to edit them...
				let polygons: [number,number][][][] = [];
				row.row.geojson.coordinates[0].forEach((polygon: [number,number][]) => {

					polygons.push([polygon])
				});
				row.row.geojson.coordinates = polygons;
			}
			this.geoJson.features.push({
				type: 'Feature',
				geometry: row.row.geojson,
				properties: {
					id: row.row.name.toLowerCase().replace(' ', '-'), // this replaces one not all '-'
					name: row.row.name,
					forecastUrl: row.row.url || row.row.zone_url
				}
			});
		});

		this.raw.unitedStatesCenters['rows'].forEach((row: any) => {
			this.geoJson.features.push(<Feature<Point>>{
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [
						row.row.lng,
						row.row.lat
					]
				},
				properties: {
					id: row.row.name.toLowerCase().replace(' ', '-'), // this replaces one not all '-'
					name: row.row.name,
					forecastUrl: row.row.url
				}
			});
		});

		this.raw.europeSubRegions['features'].forEach((geometry: Feature<Polygon|MultiPolygon>) => {
			let feature = this.raw.europeFeatures[geometry['db_id'] - 1]
			// let service = this.raw.europeServices.find(service => {})
			this.geoJson.features.push({
				type: 'Feature',
				geometry: geometry['geometry'],
				properties: {
					id: geometry['db_id'],
					name: feature ? feature['name'] : undefined,
					// forecastUrl: service.services[0].url
				}
			});
		});

	}

}
