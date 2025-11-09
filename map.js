import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@3.0.1/+esm';

mapboxgl.accessToken = 'pk.eyJ1IjoiYWxoYXlzbGlwIiwiYSI6ImNtaHM3MHVjODFncnoya3E0bmJtYWlnbjUifQ.fG7DieNrtbmKOuphePmtlw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/alhayslip/cmhs8o3ly007n01su7kywabwn',
  center: [-71.0589, 42.3601],
  zoom: 12,
  minZoom: 5,
  maxZoom: 18
});

map.on('load', () => {
  if (!map.getSource('boston_route')) {
    map.addSource('boston_route', {
      type: 'geojson',
      data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson'
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
        'line-join': 'round',
        'line-cap': 'round'
      }
    });
  }
});
