// Step 3: Add Bluebikes stations using D3 overlay
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@3.0.1/+esm';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

mapboxgl.accessToken =
  'pk.eyJ1IjoiYWxoYXlzbGlwIiwiYSI6ImNtaHM3MHVjODFncnoya3E0bmJtYWlnbjUifQ.fG7DieNrtbmKOuphePmtlw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/alhayslip/cmhs8o3ly007n01su7kywabwn',
  center: [-71.0589, 42.3601],
  zoom: 12,
});

// Project lon/lat to pixel coords
function getCoords(station) {
  const pt = new mapboxgl.LngLat(station.lon, station.lat);
  const { x, y } = map.project(pt);
  return { cx: x, cy: y };
}

map.on('load', async () => {
  console.log('Map fully loaded');

  // ---------- Load stations ----------
  let stations = [];
  try {
    // Use the lab copy OR the official GBFS. Either works with the normalizer below.
    const url = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
    // const url = 'https://gbfs.bluebikes.com/gbfs/en/station_information.json';

    const jsonData = await d3.json(url);
    console.log('Loaded JSON Data:', jsonData);

    const raw = jsonData?.data?.stations ?? [];

    // Normalize coordinates to numeric {lat, lon}, regardless of key casing
    stations = raw.map(d => {
      const latRaw = d.lat ?? d.Lat ?? d.latitude ?? d.Latitude;
      const lonRaw = d.lon ?? d.Long ?? d.longitude ?? d.Longitude;
      return {
        ...d,
        lat: +latRaw,
        lon: +lonRaw
      };
    }).filter(d => Number.isFinite(d.lat) && Number.isFinite(d.lon));

    console.log('Stations loaded:', stations.length);
  } catch (err) {
    console.error('Error loading Bluebikes data:', err);
    return;
  }

  // ---------- Ensure SVG overlay exists (append if missing) ----------
  const mapEl = document.getElementById('map');
  let svg = d3.select(mapEl).select('svg');
  if (svg.empty()) {
    svg = d3.select(mapEl).append('svg');
    // keep the SVG above the map & non-interfering
    svg
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', 0)
      .style('width', '100%')
      .style('height', '100%')
      .style('z-index', 9999)
      .style('pointer-events', 'none');
  }

  // ---------- Draw circles ----------
  const circles = svg.selectAll('circle')
    .data(stations)
    .enter()
    .append('circle')
    .attr('r', 5)
    .attr('fill', 'steelblue')
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .attr('opacity', 0.85);

  // ---------- Keep positions in sync with the map ----------
  function updatePositions() {
    circles
      .attr('cx', d => getCoords(d).cx)
      .attr('cy', d => getCoords(d).cy);
  }

  map.on('idle', updatePositions);
  map.on('move', updatePositions);
  map.on('zoom', updatePositions);
  map.on('resize', updatePositions);
  map.on('moveend', updatePositions);

  // Optional focus near Cambridge
  map.setCenter([-71.0935, 42.3745]);
});



