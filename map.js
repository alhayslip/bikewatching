//Visualize the traffic data from mapbox and d3
import mapboxgl from "https://cdn.jsdelivr.net/npm/mapbox-gl@3.0.1/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYWxoYXlzbGlwIiwiYSI6ImNtaHM3MHVjODFncnoya3E0bmJtYWlnbjUifQ.fG7DieNrtbmKOuphePmtlw";

//Create the mapbox map 
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-71.0589, 42.3601],
  zoom: 12,
  minZoom: 5,
  maxZoom: 18,
});

function getCoords(station) {
  const point = new mapboxgl.LngLat(+station.lon, +station.lat);
  const { x, y } = map.project(point);
  return { cx: x, cy: y };
}

map.on("load", async () => {
  console.log("Map fully loaded");

  //visualize the boston bike lanes 
  try {
    const bostonUrl = "./data/boston-bike-network.geojson";
    const bostonData = await fetch(bostonUrl).then((r) => r.json());
    console.log("Boston lanes loaded:", bostonData.features?.length ?? 0);

    map.addSource("boston_route", { type: "geojson", data: bostonData });
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


  //visualize the cambridge bike lanes
  try {
    const cambridgeUrl = "./data/cambridge-bike-facilities.geojson";
    const cambridgeData = await fetch(cambridgeUrl).then((r) => r.json());
    console.log("Cambridge lanes loaded:", cambridgeData.features?.length ?? 0);

    map.addSource("cambridge_route", { type: "geojson", data: cambridgeData });
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

 
  //generate the station information blebikes information 
  let stations = [];
  try {
    const url = "https://gbfs.bluebikes.com/gbfs/en/station_information.json";
    const jsonData = await d3.json(url);
    const raw = jsonData.data.stations;
    console.log("Stations JSON sample:", raw[0]);

stations = raw
  .map((d) => ({
    id: d.short_name, 
    lat: +d.lat,
    lon: +d.lon,
    name: d.name,
  }))
  .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lon));

    console.log("Stations loaded:", stations.length);
  } catch (err) {
    console.error("Error loading Bluebikes station data:", err);
    return;
  }

//return the csv traffic data 
  let trips = [];
  try {
    const trafficUrl =
      "https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv";
    trips = await d3.csv(trafficUrl);
    console.log("Trips loaded:", trips.length);
    console.log("Trip sample:", trips[0]);
  } catch (err) {
    console.error("Error loading traffic data:", err);
  }

  //calcuate the arrivals and departures 
  const departures = d3.rollup(
    trips,
    (v) => v.length,
    (d) => d.start_station_id
  );
  const arrivals = d3.rollup(
    trips,
    (v) => v.length,
    (d) => d.end_station_id
  );

  // Add the arrivals and department together as total traffic
  stations = stations.map((s) => {
    const id = s.id;
    s.departures = departures.get(id) ?? 0;
    s.arrivals = arrivals.get(id) ?? 0;
    s.totalTraffic = s.departures + s.arrivals;
    return s;
  });

  console.log(
    "Example station with traffic:",
    stations.find((s) => s.totalTraffic > 0) || "No matches yet"
  );

  // ---------------- D3 OVERLAY ----------------
  const svg = d3.select("#map").select("svg");

  const radiusScale = d3
    .scaleSqrt()
    .domain([0, d3.max(stations, (d) => d.totalTraffic)])
    .range([0, 25]);

  const circles = svg
    .selectAll("circle")
    .data(stations)
    .enter()
    .append("circle")
    .attr("r", (d) => radiusScale(d.totalTraffic))
    .attr("fill", "steelblue")
    .attr("fill-opacity", 0.6)
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .style("pointer-events", "auto")
    .each(function (d) {
      d3.select(this)
        .append("title")
        .text(
          `${d.name}\n${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`
        );
    });

  // Update circle positions dynamically
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






