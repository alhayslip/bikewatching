import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';
console.log('Mapbox GL JS Loaded:', mapboxgl);

map.on('load', async () => {
  if (!map.getSource('boston_route')) {
    map.addSource('boston_route', {
      type: 'geojson',
      data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson',
    });
  }

  if (!map.getLayer('bike-lanes')) {
    map.addLayer({
      id: 'bike-lanes',
      type: 'line',
      source: 'boston_route',
      paint: {
        'line-color': 'orange',
        'line-width': 5,
        'line-opacity': 0.45,
      },
    });
  }

  map.setCenter([-71.0589, 42.3601]);
  map.setZoom(12);
});