// Step 3: Combine Mapbox with D3 to visualize Bluebikes stations

import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@3.0.1/+esm';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Mapbox access token
mapboxgl.accessToken =
  'pk.eyJ1IjoiYWxoYXlzbGlwIiwiYSI6ImNtaHM3MHVjODFncnoya3E0bmJtYWlnbjUifQ.fG7DieNrtbmKOuphePmtlw';

// Initialize Mapbox map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/alhayslip/cmhs8o3ly007n01su7kywabwn',
  center: [-71.0589, 42.3601], // Boston
  zoom: 12,
  minZoom: 5,
  maxZoom: 18,
});

// Convert a station's lon/lat to pixel coordinates
function getCoords(station) {
  const point = new mapboxgl.LngLat(+station.lon, +station.lat);
  const { x, y } = map.project(point);
  return { cx: x, cy: y };
}

// Wait for map to load
map.on('load', async () => {
  console.log('Map fully loaded');

  // --------------------------------------------------
  // Boston Bike Routes
  // --------------------------------------------------
  if (!map.getSource('boston_route')) {
    map.addSource('boston_route', {
      type: 'geojson',
      data:
        'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson',
    });
  }

  if (!map.getLayer('bike-lanes-boston')) {
    map.addLayer({
      id: 'bike-lanes-boston',
      type: 'line',
      source: 'boston_route',
      paint: {
        'line-color': 'orange',
        'line-width': 4,
        'line-opacity': 0.45,
        'line-join': 'round',
        'line-cap': 'round',
      },
    });
  }

  // --------------------------------------------------
  // Cambridge Bike Routes (via CORS proxy)
  // --------------------------------------------------
  if (!map.getSource('cambridge_route')) {
    map.addSource('cambridge_route', {
      type: 'geojson',
      data:
        'https://corsproxy.io/?https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson',
    });
  }

  if (!map.getLayer('bike-lanes-cambridge')) {
    map.addLayer({
      id: 'bike-lanes-cambridge',
      type: 'line',
      source: 'cambridge_route',
      paint: {
        'line-color': 'purple',
        'line-width': 6,
        'line-opacity': 0.8,
        'line-join': 'round',
        'line-cap': 'round',
      },
    });
  }

  // --------------------------------------------------
  // Step 3.1: Load Bluebikes Station Data (GBFS official feed)
  // --------------------------------------------------
  let stations = [];
  try {
    const jsonUrl =
      'https://gbfs.bluebikes.com/gbfs/en/station_information.json';
    const jsonData = await d3.json(jsonUrl);
    console.log('Loaded JSON Data:', jsonData);

    // Extract the stations array (structure: data.stations)
    stations = jsonData?.data?.stations || [];
    stations = stations.filter((d) => d.lat && d.lon);
    console.log('Stations loaded:', stations.length);
  } catch (error) {
    console.error('Error loading Bluebikes data:', error);
    return;
  }

  // --------------------------------------------------
  // Step 3.2: Create SVG overlay for D3 markers
  // --------------------------------------------------
  const mapContainer = document.getElementById('map');
  const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  mapContainer.appendChild(svgElement);

  // Style the overlay SVG
  svgElement.style.position = 'absolute';
  svgElement.style.top = 0;
  svgElement.style.left = 0;
  svgElement.style.width = '100%';
  svgElement.style.height = '100%';
  svgElement.style.zIndex = 9999;
  svgElement.style.pointerEvents = 'none';

  const svg = d3.select(svgElement);

  // --------------------------------------------------
  // Step 3.3: Draw BlueBikes Station Circles
  // --------------------------------------------------
  const circles = svg
    .selectAll('circle')
    .data(stations)
    .enter()
    .append('circle')
    .attr('r', 5)
    .attr('fill', 'steelblue')
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .attr('opacity', 0.85);

  // --------------------------------------------------
  // Step 3.4: Keep D3 markers synced with map
  // --------------------------------------------------
  function updatePositions() {
    circles
      .attr('cx', (d) => getCoords(d).cx)
      .attr('cy', (d) => getCoords(d).cy);
  }

  // Sync D3 overlay to Mapbox movements
  map.on('idle', updatePositions);
  map.on('move', updatePositions);
  map.on('zoom', updatePositions);
  map.on('resize', updatePositions);
  map.on('moveend', updatePositions);

  // Focus near Cambridge
  map.setCenter([-71.0935, 42.3745]);
  map.setZoom(12);
});

