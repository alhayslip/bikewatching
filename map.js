// Step 3: Combine Mapbox with D3 to visualize Bluebikes stations

import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@3.0.1/+esm';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Mapbox access token
mapboxgl.accessToken =
  'pk.eyJ1IjoiYWxoYXlzbGlwIiwiYSI6ImNtaHM3MHVjODFncnoya3E0bmJtYWlnbjUifQ.fG7DieNrtbmKOuphePmtlw';

// Initialize map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/alhayslip/cmhs8o3ly007n01su7kywabwn',
  center: [-71.0589, 42.3601], // Boston
  zoom: 12,
  minZoom: 5,
  maxZoom: 18,
});

function getCoords(station) {
  const point = new mapboxgl.LngLat(+station.Long, +station.Lat);
  const { x, y } = map.project(point);
  return { cx: x, cy: y };
}

map.on('load', async () => {
  console.log('Map fully loaded');


  // Boston Bike Routes
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


 let stations = [];
  try {
    const jsonUrl =
      'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
    const jsonData = await d3.json(jsonUrl);
    console.log('Loaded JSON Data:', jsonData);

    stations = jsonData.data.stations.filter((d) => d.Lat && d.Long);
    console.log('Stations loaded:', stations.length);
  } catch (error) {
    console.error('Error loading Bluebikes data:', error);
    return;
  }

   const svg = d3.select('#map').select('svg');

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
  // Step 3.3: Update marker positions on map movement
  // --------------------------------------------------
  function updatePositions() {
    circles
      .attr('cx', (d) => getCoords(d).cx)
      .attr('cy', (d) => getCoords(d).cy);
  }

  // Use 'idle' to ensure map tiles + style are ready
  map.once('idle', updatePositions);

  // Keep circles aligned during movement and zoom
  map.on('move', updatePositions);
  map.on('zoom', updatePositions);
  map.on('resize', updatePositions);
  map.on('moveend', updatePositions);

  // Recenter view near Cambridge
  map.setCenter([-71.0935, 42.3745]);
  map.setZoom(12);
});
