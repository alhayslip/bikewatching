// Step 3: Add Bluebikes stations using D3 overlay
import mapboxgl from "https://cdn.jsdelivr.net/npm/mapbox-gl@3.0.1/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYWxoYXlzbGlwIiwiYSI6ImNtaHM3MHVjODFncnoya3E0bmJtYWlnbjUifQ.fG7DieNrtbmKOuphePmtlw";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-71.0589, 42.3601],
  zoom: 12,
  minZoom: 5,
  maxZoom: 18,
});

// Convert Lat/Long → pixel coords
function getCoords(station) {
  const point = new mapboxgl.LngLat(+station.lon, +station.lat);
  const { x, y } = map.project(point);
  return { cx: x, cy: y };
}

map.on("load", async () => {
  console.log("Map fully loaded");

// ---------------- BOSTON BIKE LANES ----------------
try {
  const bostonUrl = "./data/boston-bike-network.geojson";
  const bostonData = await fetch(bostonUrl).then((r) => r.json());
  console.log("Boston lanes loaded:", bostonData.features?.length ?? 0);

  map.addSource("boston_route", {
    type: "geojson",
    data: bostonData,
  });

  map.addLayer({
    id: "bike-lanes-boston",
    type: "line",
    source: "boston_route",
    paint: {
      "line-color": "orange",
      "line-width": 3,
      "line-opacity": 0.6,
      "line-join": "round",
      "line-cap": "round",
    },
  });
} catch (err) {
  console.error("Error loading Boston lanes:", err);
}

// ---------------- CAMBRIDGE BIKE LANES ----------------
try {
  const cambridgeUrl = "./data/cambridge-bike-facilities.geojson";
  const cambridgeData = await fetch(cambridgeUrl).then((r) => r.json());
  console.log("Cambridge lanes loaded:", cambridgeData.features?.length ?? 0);

  map.addSource("cambridge_route", {
    type: "geojson",
    data: cambridgeData,
  });

  map.addLayer({
    id: "bike-lanes-cambridge",
    type: "line",
    source: "cambridge_route",
    paint: {
      "line-color": "purple",
      "line-width": 5,
      "line-opacity": 0.7,
      "line-join": "round",
      "line-cap": "round",
    },
  });
} catch (err) {
  console.error("Error loading Cambridge lanes:", err);
}

  // ---------------- BLUEBIKES STATIONS ----------------
  let stations = [];
  try {
    const url = "https://gbfs.bluebikes.com/gbfs/en/station_information.json";
    const jsonData = await d3.json(url);
    console.log("Loaded JSON Data:", jsonData);

    const raw = jsonData.data.stations; // ✅ correct structure

    stations = raw
      .map((d) => ({
        lat: +d.lat,
        lon: +d.lon,
        name: d.name,
      }))
      .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lon));

    console.log("Stations loaded:", stations.length);
  } catch (err) {
    console.error("Error loading Bluebikes data:", err);
    return;
  }

  // ---------------- D3 OVERLAY ----------------
  const svg = d3.select("#map").select("svg");
  const circles = svg
    .selectAll("circle")
    .data(stations)
    .enter()
    .append("circle")
    .attr("r", 4)
    .attr("fill", "steelblue")
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("opacity", 0.9);

  function updatePositions() {
    circles
      .attr("cx", (d) => getCoords(d).cx)
      .attr("cy", (d) => getCoords(d).cy);
  }

  map.on("render", updatePositions);
  map.on("move", updatePositions);
  map.on("zoom", updatePositions);
  map.on("resize", updatePositions);
  map.on("moveend", updatePositions);

  map.setCenter([-71.0935, 42.3745]);
  map.setZoom(12);
});





