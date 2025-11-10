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

function getCoords(station) {
  const point = new mapboxgl.LngLat(+station.Long, +station.Lat);
  const { x, y } = map.project(point);
  return { cx: x, cy: y };
}

map.on('load', async () => {
  console.log("Map fully loaded");
t
  let stations = [];
  try {
    const url = "https://dsc106.com/labs/lab07/data/bluebikes-stations.json";
    const jsonData = await d3.json(url);

    console.log("Loaded JSON Data:", jsonData);

    stations = jsonData.data.stations;

    stations = stations
      .map(d => ({ ...d, Lat: +d.Lat, Long: +d.Long }))
      .filter(d => !isNaN(d.Lat) && !isNaN(d.Long));

    console.log("Stations loaded:", stations.length);

  } catch (error) {
    console.error("Error loading Bluebikes data:", error);
    return;
  }

  const svg = d3.select("#map").select("svg");

  const circles = svg
    .selectAll("circle")
    .data(stations)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("fill", "steelblue")
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("opacity", 0.85);

  function updatePositions() {
    circles
      .attr("cx", d => getCoords(d).cx)
      .attr("cy", d => getCoords(d).cy);
  }

  updatePositions();

  map.on("move", updatePositions);
  map.on("zoom", updatePositions);
  map.on("resize", updatePositions);
  map.on("moveend", updatePositions);

  // Center near Cambridge
  map.setCenter([-71.0935, 42.3745]);
});


