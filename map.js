// Bikewatching Visualization — Mapbox + D3
import mapboxgl from "https://cdn.jsdelivr.net/npm/mapbox-gl@3.0.1/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Mapbox access token
mapboxgl.accessToken =
  "pk.eyJ1IjoiYWxoYXlzbGlwIiwiYSI6ImNtaHM3MHVjODFncnoya3E0bmJtYWlnbjUifQ.fG7DieNrtbmKOuphePmtlw";

// ----------------------- Utility Functions -----------------------
function getCoords(station) {
  const point = new mapboxgl.LngLat(+station.lon, +station.lat);
  const { x, y } = map.project(point);
  return { cx: x, cy: y };
}

function formatTime(minutes) {
  const date = new Date(0, 0, 0, 0, minutes);
  return date.toLocaleString("en-US", { timeStyle: "short" });
}

function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

// ----------------------- Data Containers -----------------------
let departuresByMinute = Array.from({ length: 1440 }, () => []);
let arrivalsByMinute = Array.from({ length: 1440 }, () => []);

function filterByMinute(tripsByMinute, minute) {
  if (minute === -1) return tripsByMinute.flat();

  let minMinute = (minute - 60 + 1440) % 1440;
  let maxMinute = (minute + 60) % 1440;

  if (minMinute > maxMinute) {
    return tripsByMinute.slice(minMinute).concat(tripsByMinute.slice(0, maxMinute)).flat();
  } else {
    return tripsByMinute.slice(minMinute, maxMinute).flat();
  }
}

// Compute arrivals and departures for each station
function computeStationTraffic(stations, timeFilter = -1) {
  const departures = d3.rollup(
    filterByMinute(departuresByMinute, timeFilter),
    (v) => v.length,
    (d) => d.start_station_id
  );

  const arrivals = d3.rollup(
    filterByMinute(arrivalsByMinute, timeFilter),
    (v) => v.length,
    (d) => d.end_station_id
  );

  return stations.map((s) => {
    const id = s.id;
    s.departures = departures.get(id) ?? 0;
    s.arrivals = arrivals.get(id) ?? 0;
    s.totalTraffic = s.departures + s.arrivals;
    return s;
  });
}

// ----------------------- Map Initialization -----------------------
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-71.0589, 42.3601],
  zoom: 12,
  minZoom: 5,
  maxZoom: 18,
});

map.on("load", async () => {
  console.log("Map fully loaded");

  // ----------------------- Add Bike Lanes -----------------------
  try {
    const bostonData = await fetch("./data/boston-bike-network.geojson").then((r) => r.json());
    map.addSource("boston_route", { type: "geojson", data: bostonData });
    map.addLayer({
      id: "bike-lanes-boston",
      type: "line",
      source: "boston_route",
      paint: { "line-color": "orange", "line-width": 3, "line-opacity": 0.6 },
    });
  } catch (err) {
    console.error("Error loading Boston lanes:", err);
  }

  try {
    const cambridgeData = await fetch("./data/cambridge-bike-facilities.geojson").then((r) => r.json());
    map.addSource("cambridge_route", { type: "geojson", data: cambridgeData });
    map.addLayer({
      id: "bike-lanes-cambridge",
      type: "line",
      source: "cambridge_route",
      paint: { "line-color": "purple", "line-width": 5, "line-opacity": 0.7 },
    });
  } catch (err) {
    console.error("Error loading Cambridge lanes:", err);
  }

  // ----------------------- Load Bluebike Stations -----------------------
  let stations = [];
  try {
    const url = "https://gbfs.bluebikes.com/gbfs/en/station_information.json";
    const jsonData = await d3.json(url);
    stations = jsonData.data.stations
      .map((d) => ({
        id: d.short_name,
        lat: +d.lat,
        lon: +d.lon,
        name: d.name,
      }))
      .filter((d) => d.id && Number.isFinite(d.lat) && Number.isFinite(d.lon));
    console.log("Stations loaded:", stations.length);
  } catch (err) {
    console.error("Error loading Bluebikes data:", err);
  }

  // ----------------------- Load Bluebike Trips -----------------------
  try {
    await d3.csv(
      "https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv",
      (trip) => {
        trip.started_at = new Date(trip.started_at);
        trip.ended_at = new Date(trip.ended_at);
        const startM = minutesSinceMidnight(trip.started_at);
        const endM = minutesSinceMidnight(trip.ended_at);
        if (startM >= 0 && startM < 1440) departuresByMinute[startM].push(trip);
        if (endM >= 0 && endM < 1440) arrivalsByMinute[endM].push(trip);
        return trip;
      }
    );
    console.log("Trips processed into time buckets.");
  } catch (err) {
    console.error("Error loading trip data:", err);
  }

  // ----------------------- D3 Overlay -----------------------
  const svg = d3.select("#map").select("svg");
  let timeFilter = -1;
  const radiusScale = d3.scaleSqrt().range([2, 25]);
  const stationFlow = d3.scaleQuantize().domain([0, 1]).range([0, 0.5, 1]); // used for CSS variable mapping

  let circles = svg
    .selectAll("circle")
    .data(stations, (d) => d.id)
    .enter()
    .append("circle")
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .attr("fill-opacity", 0.85)
    .style("pointer-events", "auto");

  // Update circle positions when map moves
  function updatePositions() {
    circles
      .attr("cx", (d) => getCoords(d).cx)
      .attr("cy", (d) => getCoords(d).cy);
  }

  // ----------------------- Time Filter Logic -----------------------
  const timeSlider = document.getElementById("time-slider");
  const selectedTime = document.getElementById("selected-time");
  const anyTimeLabel = document.getElementById("any-time");

function updateScatterPlot(timeFilter) {
  const filteredStations = computeStationTraffic(stations, timeFilter);
  const maxTraffic = d3.max(filteredStations, (d) => d.totalTraffic) || 1;
  radiusScale.domain([0, maxTraffic]);
  timeFilter === -1
    ? radiusScale.range([2, 25])
    : radiusScale.range([3, 40]);

  circles = circles
    .data(filteredStations, (d) => d.id)
    .join("circle")
    .attr("r", (d) => radiusScale(d.totalTraffic))
    .attr("cx", (d) => getCoords(d).cx)
    .attr("cy", (d) => getCoords(d).cy)
    // 🔵🟣🟠 Assign colors directly
    .attr("fill", (d) => {
      const ratio = d.totalTraffic ? d.departures / d.totalTraffic : 0.5;
      if (ratio > 0.66) return "steelblue";     // More departures
      if (ratio < 0.33) return "darkorange";    // More arrivals
      return "purple";                          // Balanced
    })
    .each(function (d) {
      d3.select(this).select("title").remove();
      d3.select(this)
        .append("title")
        .text(
          `${d.name}\n${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`
        );
    });
}

  function updateTimeDisplay() {
    timeFilter = Number(timeSlider.value);
    if (timeFilter === -1) {
      selectedTime.textContent = "";
      anyTimeLabel.style.display = "block";
    } else {
      selectedTime.textContent = formatTime(timeFilter);
      anyTimeLabel.style.display = "none";
    }
    updateScatterPlot(timeFilter);
  }

  timeSlider.addEventListener("input", updateTimeDisplay);
  updateTimeDisplay();

  // ----------------------- Map Event Handlers -----------------------
  map.on("render", updatePositions);
  map.on("move", updatePositions);
  map.on("zoom", updatePositions);
  map.on("resize", updatePositions);
  map.on("moveend", updatePositions);

  map.setCenter([-71.0935, 42.3745]);
  map.setZoom(12);

  // ----------------------- Legend -----------------------
  const legend = document.createElement("div");
  legend.className = "legend";
  legend.innerHTML = `
    <div style="--departure-ratio: 1">More departures</div>
    <div style="--departure-ratio: 0.5">Balanced</div>
    <div style="--departure-ratio: 0">More arrivals</div>
  `;
  document.body.appendChild(legend);
});










