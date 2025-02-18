// Set map view, load basemaps and wind particles

// Map initialization and base map setup (simplified)
var map = L.map('map').setView([38.2858, -96.78682], 5);

const mapAttribution = '&copy; <a href="http://www.esri.com/">Esri</a>';

const baseMaps = {
    "Esri World Imagery": createTileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', mapAttribution),
    "Esri World Dark Gray": createTileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', mapAttribution),
    "Open Street Map": createTileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', '&copy; <a href ="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors')
};

baseMaps["Esri World Dark Gray"].addTo(map);

function createTileLayer(url, attribution) {
    return L.tileLayer(url, { attribution, maxZoom: 20 });
}

// Leaflet.draw initialization
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    }
});
map.addControl(drawControl);

map.on('draw:created', function (e) {
    var layer = e.layer;
    drawnItems.addLayer(layer);
    console.log(layer.toGeoJSON());
});

function createWMSLayerWithLegend(layerOptions, time) {
    const { layerName, wmsUrl, legendUrl, overlayName, opacity = 0.35 } = layerOptions;

    const layer = L.tileLayer.wms(wmsUrl, {
        layers: layerName,
        format: 'image/png',
        transparent: true,
        opacity,
        time: time
    });

    const legendImage = document.createElement('img');
    legendImage.src = legendUrl;
    legendImage.alt = `Legend for ${overlayName}`;
    legendImage.style.display = 'none';

    const legendTitle = document.createElement('h4');
    legendTitle.textContent = `${overlayName} Legend`;
    legendTitle.style.textAlign = 'center';
    legendTitle.style.display = 'none';

    const legendControl = L.control({ position: 'bottomright' });

    legendControl.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.display = 'none'; // Initially hide the legend control
        div.appendChild(legendTitle);
        div.appendChild(legendImage);
        return div;
    };

    layer.on('add', () => {
        legendControl.addTo(map);
        document.querySelector('.info.legend').style.display = 'block';
        legendImage.style.display = 'block';
        legendTitle.style.display = 'block';
    });

    layer.on('remove', () => {
        document.querySelector('.info.legend').style.display = 'none';
        legendImage.style.display = 'none';
        legendTitle.style.display = 'none';
    });

    return layer;
}

async function fetchTimeSteps(wmsUrl) {
    const response = await fetch(`${wmsUrl}service=WMS&version=1.3.0&request=GetCapabilities`);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const timeDimension = xml.querySelector('Dimension[name="time"]');
    if (timeDimension) {
        return timeDimension.textContent.split(',');
    }
    return [];
}

function createNavigationButtons() {
    const navControl = L.control({ position: 'bottomleft' });

    navControl.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'nav-buttons hidden'); // Add 'hidden' class initially
        div.innerHTML = `
            <button id="prevBtn">Previous</button>
            <div id="timeSliceDisplay" style="margin: 0 10px; color: black; background-color: white; padding: 5px; white-space: nowrap;"></div>
            <button id="nextBtn">Next</button>
        `;
        return div;
    };

    navControl.addTo(map);

    document.getElementById('prevBtn').addEventListener('click', () => {
        console.log('Previous button clicked');
        // Add functionality for previous button
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        console.log('Next button clicked');
        // Add functionality for next button
    });

    return navControl;
}

function toggleNavButtons(show) {
    const navButtons = document.querySelector('.nav-buttons');
    if (show) {
        navButtons.classList.remove('hidden');
    } else {
        navButtons.classList.add('hidden');
    }
}

async function fetchDataAndCreateLayers() {
    try {
        // Show the loading icon
        document.getElementById('loadingIcon').classList.remove('hidden');

        const radarTimeSteps = (await fetchTimeSteps('https://nowcoast.noaa.gov/geoserver/observations/weather_radar/wms?')).reverse();
        const apparentTemperatureTimeSteps = await fetchTimeSteps('https://nowcoast.noaa.gov/geoserver/forecasts/ndfd_temperature/wms?');
        let radarCurrentTimeIndex = 0;
        let apparentTemperatureCurrentTimeIndex = 0;

        const radarLayer = createWMSLayerWithLegend({
            layerName: 'base_reflectivity_mosaic',
            wmsUrl: 'https://nowcoast.noaa.gov/geoserver/observations/weather_radar/wms?',
            legendUrl: 'https://nowcoast.noaa.gov/geoserver/observations/weather_radar/wms?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&width=272&height=21&layer=conus_base_reflectivity_mosaic',
            overlayName: "MRMMS Radar"
        }, radarTimeSteps[radarCurrentTimeIndex]);

        const erddap = new ERDDAP('https://pae-paha.pacioos.hawaii.edu/erddap');
        const ds = erddap.dataset('ncep_global').constrain({ time: "closest" });
        const data = await ds.vectors('ugrd10m', 'vgrd10m').fetchGrib2();

        const velocityLayer = L.velocityLayer({
            displayValues: true,
            displayOptions: {
                velocityType: 'NAVGEM 10m winds',
                displayPosition: 'bottomleft',
                displayEmptyString: 'No wind data'
            },
            data,
            maxVelocity: 30.0,
            velocityScale: 0.005
        });

        const apparentTemperatureLayer = createWMSLayerWithLegend({
            layerName: 'apparent_temperature',
            wmsUrl: 'https://nowcoast.noaa.gov/geoserver/forecasts/ndfd_temperature/wms?',
            legendUrl: 'https://nowcoast.noaa.gov/geoserver/forecasts/ndfd_temperature/wms?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&width=283&height=33&layer=conus_apparent_temperature',
            overlayName: "Apparent Temperature"
        }, apparentTemperatureTimeSteps[apparentTemperatureCurrentTimeIndex]);

        const overlays = {
            "NAVGEM Wind Particles": velocityLayer,
            "MRMMS Radar": radarLayer,
            "Apparent Temperature": apparentTemperatureLayer
        };

        L.control.layers(baseMaps, overlays).addTo(map);

        const navControl = createNavigationButtons(radarTimeSteps);

        function updateTimeSliceDisplay() {
            const timeSliceDisplay = document.getElementById('timeSliceDisplay');
            let radarTime = radarTimeSteps[radarCurrentTimeIndex].replace('.000Z', 'Z');
            let apparentTemperatureTime = apparentTemperatureTimeSteps[apparentTemperatureCurrentTimeIndex].replace('.000Z', 'Z');

            if (map.hasLayer(radarLayer)) {
                timeSliceDisplay.innerHTML = `<strong>MRMMS Radar (Current and Past):</strong> ${radarTime}`;
            } else if (map.hasLayer(apparentTemperatureLayer)) {
                timeSliceDisplay.innerHTML = `<strong>Apparent Temperature (Forecast):</strong> ${apparentTemperatureTime}`;
            } else {
                timeSliceDisplay.innerHTML = '';
            }
        }

        document.getElementById('prevBtn').addEventListener('click', () => {
            if (map.hasLayer(radarLayer) && radarCurrentTimeIndex < radarTimeSteps.length - 1) {
                radarCurrentTimeIndex++;
                radarLayer.setParams({ time: radarTimeSteps[radarCurrentTimeIndex] });
                updateTimeSliceDisplay();
            }
            if (map.hasLayer(apparentTemperatureLayer) && apparentTemperatureCurrentTimeIndex > 0) {
                apparentTemperatureCurrentTimeIndex--;
                apparentTemperatureLayer.setParams({ time: apparentTemperatureTimeSteps[apparentTemperatureCurrentTimeIndex] });
                updateTimeSliceDisplay();
            }
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            if (map.hasLayer(radarLayer) && radarCurrentTimeIndex > 0) {
                radarCurrentTimeIndex--;
                radarLayer.setParams({ time: radarTimeSteps[radarCurrentTimeIndex] });
                updateTimeSliceDisplay();
            }
            if (map.hasLayer(apparentTemperatureLayer) && apparentTemperatureCurrentTimeIndex < apparentTemperatureTimeSteps.length - 1) {
                apparentTemperatureCurrentTimeIndex++;
                apparentTemperatureLayer.setParams({ time: apparentTemperatureTimeSteps[apparentTemperatureCurrentTimeIndex] });
                updateTimeSliceDisplay();
            }
        });

        updateTimeSliceDisplay();

        // Hide the loading icon
        document.getElementById('loadingIcon').classList.add('hidden');

        map.on('overlayadd', (e) => {
            if (e.name === "MRMMS Radar" || e.name === "Apparent Temperature") {
                toggleNavButtons(true);
                updateTimeSliceDisplay(); // Ensure the time slice display is updated when the layer is added
            }
        });

        map.on('overlayremove', (e) => {
            if (e.name === "MRMMS Radar" || e.name === "Apparent Temperature") {
                toggleNavButtons(false);
            }
        });

    } catch (error) {
        console.error("Error fetching or creating layers:", error);
        // Hide the loading icon in case of error
        document.getElementById('loadingIcon').classList.add('hidden');
    }
}

fetchDataAndCreateLayers();