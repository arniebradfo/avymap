# Avymap

Avymap is a progressive web app that visualizes avalanche danger by slope angle. It also contains a geo-referenced data set of avalanche reports.

## Development
Requires Node 24 (`.nvmrc`).

1. `cp .env.example .env.local` and set `VITE_MAPBOX_TOKEN` to a Mapbox public token (`.env.local` is gitignored).
2. `npm install`
3. `npm run dev` — dev server; `npm run build` — typecheck + production build into `build/`; `npm run preview` — serve the build.

## Deployment
Pushes to `master` build and deploy to GitHub Pages via `.github/workflows/deploy.yml`.
The token comes from the `MAPBOX_TOKEN` repository secret. The site is served at https://arniebradfo.github.io/avymap/ (`base` in `vite.config.ts`).

## new terrain links
- https://www.mapbox.com/help/access-elevation-data/
- https://blog.mapbox.com/realistic-terrain-with-custom-styling-ce1fe98518ab
- https://www.mapbox.com/mapbox-gl-js/style-spec/#layers-hillshade
- https://www.mapbox.com/mapbox-gl-js/style-spec#sources-raster-dem
- https://www.mapbox.com/mapbox-gl-js/example/hillshade/


## Map
Data points need:
- Elevation - [Mapbox](https://blog.mapbox.com/global-elevation-data-6689f1d0ba65)
- Elevation - [Access elevation data from Mapbox Terrain `contour` source layer](https://www.mapbox.com/help/access-elevation-data/#request-data-1)
- Slope - [ArcGIS](http://desktop.arcgis.com/en/arcmap/10.3/tools/spatial-analyst-toolbox/how-slope-works.htm)
- Aspect - [ArcGIS](http://desktop.arcgis.com/en/arcmap/10.3/tools/spatial-analyst-toolbox/how-aspect-works.htm)

##### Examples
- [Hillshade](https://jsfiddle.net/mapbox/55k5q9c0/?utm_source=website&utm_medium=embed&utm_campaign=55k5q9c0)
- [Global Warming](https://www.mapbox.com/bites/00307/)
- [Swiss Ski Map Style](https://blog.mapbox.com/designing-the-swiss-ski-style-in-mapbox-studio-d6d25d1a2aa0)[live](https://api.mapbox.com/styles/v1/mslee/cij1zoclj002y8rkkdjl69psd.html?title=true&access_token=pk.eyJ1IjoibXNsZWUiLCJhIjoiclpiTWV5SSJ9.P_h8r37vD8jpIH1A6i1VRg#6.93/47.367/9.007)
- [Winter Wonderland](https://blog.mapbox.com/ski-maps-70f435febc15)
- [Russian Ski Map](https://www.mapbox.com/gallery/#map-2)

## Avalanche Steepness Graphs
- https://www.desmos.com/calculator/yh2cbmqaw4
- ... based on https://utahavalanchecenter.org/blog-steepness

## GeoJson
- [More than you ever wanted to know about GeoJSON](https://macwright.org/2015/03/23/geojson-second-bite.html)
- [obsolete geojson spec](http://geojson.org/geojson-spec.html)
- [current geojson spec](https://tools.ietf.org/html/rfc7946)

## Offline Maps
- [Run node.js on cordova?](https://www.sitepoint.com/how-to-run-node-js-with-express-on-mobile-devices/)
- [Use node.js mbtiles generator to pull saved maps?](https://github.com/jawg/mbtiles-generator)
- [Use TileStream to host the maps locally?](https://github.com/cutting-room-floor/tilestream)
- [Cordova MapBoxJS offline](https://github.com/oscarfonts/mapbox-gl-cordova-mbtiles)
- old/abandoned
    - https://github.com/trevorpowell/mapbox-gl-js-cordova-offline-example
    - https://github.com/klokantech/mapbox-gl-js-offline-example

## Other Features
- [Surface API](https://blog.mapbox.com/introducing-the-surface-api-d123ed4943c2) for line analysis
- accelerometer based inclinometer
- record route
- notify when in avalanche conditions
- avalanche safety info
- change units
- 

## Performance improvements
- Use symbols and rotate? 
    - instead of line and points feature
    - cuts data by 1/3 to 1/3, could just be points with properties
    - could be rendered as just points/circles at lower zoom
    - symbols can't be colored, maybe use unicode character?
        - 2190 and below have [arrows](https://unicode-table.com/en/#arrows)
        - ⊸ ⇁ → ➡ ➞ ➜ ➔ ⫯ ⭢ ▽
        - 2790 [dingbat arrows](https://unicode-table.com/en/#279C)
        - [⧐](https://unicode-table.com/en/#29D0)
- Pre-render the earth's terrain data as a tile set
    - much faster
    - no need to render on the device
    - much easier offline map options
    - try to filter out useless data as much as possible
        - filter based on latitude and altitude combo. [link?](http://go-11.blogspot.com/2011/12/altitude-latitude-snow-line-and-tree.html)
        - just going to have to make a function and see how it does
    - [TippeCanoe](https://github.com/mapbox/tippecanoe)
    - examples:
        - [bridges of america](http://jonahadkins.com/mapbox/cartography/qgis/2016/03/22/bridges-of-america.html)

## Mapbox tools
- [Spherical Mercator](https://github.com/mapbox/sphericalmercator)
- [Cheap Ruler](https://github.com/mapbox/cheap-ruler)

## Product Road Map
1. MVP website: $Free
    - Map 
        - Ads
        - toggle show slope/aspect danger
        - north button
        - avy bulletin zones + link
        - attribution
        - lag, lat
    - Menu
        - legend
            - guide to danger reading
        - about
            - why avymap exists
            - why ads
            - donate to your local avalanche center
        - resources
            - danger warning!
            - kbyg - 5 things
            - books
    - Demo Mockup of full version...
2. Avy Maps Lite & Website: $Free
    - Liability warning in app
    - Ads
    - Just the Map
        - current location in map
    - Weather
    - Avy Forecasts
    - get the pro app version button
3. Avy Maps Pro: $9.99
    - No Ads
    - Map
        - current location in map
        - notifications if in AvyZone
        - Trip tracking
    - Offline Maps 
        - buy x number of tiles
        - save a map
    - Inclinometer
    - Trip tracking and reporting
    - Avalanche observation
        - record boundaries, crown, deposit
        - photos, video, description, location name
        - submit to local avalanche center
    - Snowpack Evaluation Wizard
    - Avalanche Training
        - training
        - snow crystal
        - snowpack wizard
- get the backing of avalanche centers
- 25% of iOS and 16% of Android app devs earn $X>$5,000/month. [fueled.com](https://fueled.com/blog/much-money-can-earn-app/)
- app stores charge about 30% of profit. [TechRepublic](http://www.techrepublic.com/blog/software-engineer/app-store-fees-percentages-and-payouts-what-developers-need-to-know/)

## Hybrid Apps
- [7 lessons learned](https://www.joshmorony.com/7-lessons-from-3-years-of-html5-mobile-application-development/)


## Other Apps

### Skiing/Snowboarding
| App                                                                                                                          |       Installs        | Reviews |  Stars  |    Price     | Platform |
| ---------------------------------------------------------------------------------------------------------------------------- | :-------------------: | :-----: | :-----: | :----------: | -------: |
| [Avalanche Canada](https://play.google.com/store/apps/details?id=com.idearebel.avalanchereports&hl=en)                       |     10,000-50,000     |   130   |   4.3   |     Free     |  Android |
| [Avalanche Forecasts](https://play.google.com/store/apps/details?id=com.sebnarware.avalanche&hl=en)                          |     10,000-50,000     |   684   |   4.7   |     Free     |  Android |
| [Powder Project](https://play.google.com/store/apps/details?id=com.powderproject.android&hl=en)                              |     1,000 - 5,000     |   12    |   4.2   |     Free     |  Android |
| [MySnowMaps](https://play.google.com/store/apps/details?id=it.geosolutions.android.snowmaps&hl=en)                           |       Installs        |   23    |   4.2   |     Free     |  Android |
| [OnTheSnow](https://play.google.com/store/apps/details?id=com.skireport&hl=en)                                               | 1,000,000 - 5,000,000 |
| 30,096                                                                                                                       |          4.3          |  Free   | Android |
| [Ski Tracks](https://play.google.com/store/apps/details?id=com.corecoders.skitracks&hl=en)                                   |   100,000 - 500,000   |  4,570  |   4.4   |    $0.99     |  Android |
| [Ski Pursuit](https://play.google.com/store/apps/details?id=com.rossignol.android&hl=en)                                     |   100,000 - 500,000   |  1,916  |   3.8   |     Free     |  Android |
| [bergfex/Ski](https://play.google.com/store/apps/details?id=com.bergfex.mobile.android&hl=en)                                |   50,000 - 100,000    |  3,303  |   4.5   |    $2.99     |  Android |
| [SNOCRU](https://play.google.com/store/apps/details?id=com.phonegap.snocru&hl=en)                                            |   50,000 - 100,000    |   416   |   3.7   |     Free     |  Android |
| [Mobile Avalanche Safety Tools](https://play.google.com/store/apps/details?id=com.ullrlabs.mobileavalanchesafetytools&hl=en) |       100 - 500       |    7    |   3.7   |    $9.99     |  Android |
| [White Risk](https://itunes.apple.com/us/app/white-risk-slf-avalanche-app/id339374432?mt=8)                                  |           x           |   15    |    3    |     Free     |      iOS |
| [Avalanche Lab](https://itunes.apple.com/us/app/avalanche-lab/id477838698?mt=8)                                              |           x           |   29    |    5    | Free +$14.99 |      iOS |
| [Mammut Safety](https://play.google.com/store/apps/details?id=de.threespin.mammutsafetyapp&hl=en)                            |    10,000 - 50,000    |   355   |   4.3   |     Free     |  Android |
| []()                                                                                                                         |       Installs        | Reviews |  Stars  |     Free     |  Android |


### Hiking
| App                                                                                                            |      Installs       | Reviews | Stars |        Price        | Platform |
| -------------------------------------------------------------------------------------------------------------- | :-----------------: | :-----: | :---: | :-----------------: | -------: |
| [AlpineQuest GPS Hiking (Lite)](https://play.google.com/store/apps/details?id=psyberia.alpinequest.free&hl=en) | 500,000 - 1,000,000 |  5,165  |  4.3  |        Free         |  Android |
| [AlpineQuest GPS Hiking](https://play.google.com/store/apps/details?id=psyberia.alpinequest.full&hl=en)        |    10,000-50,000    |  2,818  |  4.6  |        $9.99        |  Android |
| [MTN HUB](https://play.google.com/store/apps/details?id=com.avatech.mountainhub.prod&hl=en)                    |    1,000 - 5,000    |   16    |  4.4  | Free +$2.99-$249.99 |  Android |
| [MTN HUB](https://play.google.com/store/apps/details?id=com.avatech.mountainhub.prod&hl=en)                    |          x          |   13    |  4.5  |        Free?        |      iOS |
| []()                                                                                                           |      Installs       | Reviews | Stars |        Free         |  Android |


## Competition
- [MountainHub](https://app.mountainhub.com/)
- [Mammut Safety](https://play.google.com/store/apps/details?id=de.threespin.mammutsafetyapp&hl=en)


Continued use of GPS running in the background can dramatically decrease battery life...

## Web App Manifest
- [Generator](https://app-manifest.firebaseapp.com/)
- [MDN](https://developer.mozilla.org/en-US/docs/Web/Manifest)
