# LeafletWebMapping
More of a personal project for continued learning in non areas of expertise and not for any operation use. Heavily leveraged AI assistance, in this case, ChatGPT and Gemini through the VSCode Copilot integration. Many kudos to https://github.com/socib/ , their leaflet demos were very useful and inspiring for multiple ideas. Ability to utilize Erddap datasets for wind velocity vectors from https://github.com/IrishMarineInstitute/erddap-js . Most, if not all functions in this web map leveraged existing libraries and were not altered directly, though some examples and code required some dataset adjustments due to sources no longer being active.

The github pages is not optimized for mobile view at all. Best viewed on desktop.

# Future Additions
- Segmenting app.js into separate modules (attempted, but did not want to deal with CORS 
  policy issues)
- GetFeatureInfo capability
- Leaflet.FileLayer plugin integration
- Land classification through tensorflow


### Files Description

- **index.html**: The main HTML file that sets up the structure of the web page and includes necessary scripts and stylesheets.
- **scripts/app.js**: The main JavaScript file that initializes the map, adds base maps, overlays, and interactive features.
- **dist/erddap.js**: Ability to leverage publicly available datasets through Erddap servers.
  Sourced from (https://github.com/IrishMarineInstitute/erddap-js)
- **css/buttons.css**: Styles for navigation buttons in terms of moving through time slices.
- **css/leaflet-velocity.min.css**: Minified CSS for the Leaflet Velocity plugin.
- **css/legend.css**: Styles for the legend control.
- **css/loading.css**: Styles for the loading icon.
- **css/styles.css**: General styles for the map and controls.

## Features

- **Base Maps**: Includes Esri World Imagery, Esri World Dark Gray, and Open Street Map.
- **Overlays**: Includes weather radar, apparent temperature, and wind particles.
  Weather Radar and Apparent Temperature Sourced from - NOAA nowCOAST wms layers.
  Wind Particles generated from - ncep_global grib data from PacIOOS erddap server
- **Drawing Tools**: Allows users to draw shapes on the map.
- **Time-based Navigation**: Provides navigation buttons to move through different time slices of weather data. Custom built due to the inability to get existing libraries functioning correctly.

## External Libraries and Resources

- **Leaflet.js**: A JavaScript library for interactive maps.
  - [Leaflet.js](https://unpkg.com/leaflet@1.9.4/dist/leaflet.js)
  - [Leaflet.css](https://unpkg.com/leaflet@1.9.4/dist/leaflet.css)
- **Leaflet.draw**: A plugin for Leaflet that adds drawing and editing tools.
  - [Leaflet.draw.js](https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js)
  - [Leaflet.draw.css](https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css)
- **Leaflet Velocity**: A plugin for visualizing wind data.
  - [leaflet-velocity.min.js](scripts/leaflet-velocity.min.js)
  - [leaflet-velocity.min.css](css/leaflet-velocity.min.css)
- **jQuery**: A fast, small, and feature-rich JavaScript library.
  - [jQuery](https://code.jquery.com/jquery-2.2.4.min.js)
  

## License

This project is licensed under the MIT License.
