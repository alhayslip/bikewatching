// Step 3: Add Bluebikes stations using D3 overlay
import mapboxgl from "https://cdn.jsdelivr.net/npm/mapbox-gl@3.0.1/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYWxoYXlzbGlwIiwiYSI6ImNtaHM3MHVjODFncnoya3E0bmJtYWlnbjUifQ.fG7DieNrtbmKOuphePmtlw";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/alhayslip/cmhs8o3ly007n01su7kywabwn",
  center: [-71.0589, 42.3601],
  zoom: 12,
});

// Convert lon/lat → pixel coords
function getCoords(station) {
  const point = new mapboxgl.LngLat(station.lon, station.lat);
  const { x, y } = map.project(point);
  return { cx: x, cy: y };
}

map.on("load", async () => {
  console.log("Map fully loaded");

  // ---------------- BOSTON BIKE LANES ----------------
  map.addSource("boston_route", {
    type: "geojson",
    data: "https://raw.githubusercontent.com/akloster/bluemap-assets/main/existing-bike-network-2022.geojson",
  });
  map.addLayer({
    id: "bike-lanes-boston",
    type: "line",
    source: "boston_route",
    paint: {
      "line-color": "orange",
      "line-width": 4,
      "line-opacity": 0.45,
      "line-join": "round",
      "line-cap": "round",
    },
  });

  // ---------------- CAMBRIDGE BIKE LANES ----------------
  map.addSource("cambridge_route", {
    type: "geojson",
    data: "https://raw.githubusercontent.com/akloster/bluemap-assets/main/cambridge-bike-facilities.geojson",
  });
  map.addLayer({
    id: "bike-lanes-cambridge",
    type: "line",
    source: "cambridge_route",
    paint: {
      "line-color": "purple",
      "line-width": 6,
      "line-opacity": 0.8,
      "line-join": "round",
      "line-cap": "round",
    },
  });

  // ---------------- BLUEBIKES STATIONS ----------------
  let stations = [];
  try {
    const url = "https://dsc106.com/labs/lab07/data/bluebikes-stations.json";
    const jsonData = await d3.json(url);
    console.log("Loaded JSON Data:", jsonData);

    const raw = jsonData?.data?.stations ?? [];

    stations = raw
      .map((d) => ({
        lat: +d.Lat ?? +d.lat,
        lon: +d.Long ?? +d.lon,
        name: d.NAME ?? d.name,
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
    .attr("r", 5)
    .attr("fill", "steelblue")
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("opacity", 0.85);

  function updatePositions() {
    circles
      .attr("cx", (d) => getCoords(d).cx)
      .attr("cy", (d) => getCoords(d).cy);
  }

  map.on("idle", updatePositions);
  map.on("move", updatePositions);
  map.on("zoom", updatePositions);
  map.on("resize", updatePositions);
  map.on("moveend", updatePositions);

  // Focus near Cambridge
  map.setCenter([-71.0935, 42.3745]);
});




