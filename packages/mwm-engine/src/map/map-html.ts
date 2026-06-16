import { DEFAULT_MAP_CENTER } from '../downloader/constants';

export interface MapHtmlPin {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  category: string;
}

export function buildMapHtml(
  center = DEFAULT_MAP_CENTER,
): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <link
      href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"
      rel="stylesheet"
    />
    <style>
      html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
      .occurrence-marker {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #d94848;
        border: 2px solid #ffffff;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
    <script>
      const map = new maplibregl.Map({
        container: 'map',
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
        },
        center: [${center.longitude}, ${center.latitude}],
        zoom: 13,
        attributionControl: true,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      let markers = [];

      function clearMarkers() {
        for (const marker of markers) {
          marker.remove();
        }
        markers = [];
      }

      window.updatePins = function updatePins(pins) {
        clearMarkers();
        for (const pin of pins || []) {
          const element = document.createElement('div');
          element.className = 'occurrence-marker';
          element.title = pin.category + ' · ' + pin.status;
          const marker = new maplibregl.Marker({ element })
            .setLngLat([pin.longitude, pin.latitude])
            .addTo(map);
          markers.push(marker);
        }
      };

      window.setMapCenter = function setMapCenter(latitude, longitude, zoom) {
        map.jumpTo({
          center: [longitude, latitude],
          zoom: typeof zoom === 'number' ? zoom : map.getZoom(),
        });
      };

      window.updatePins([]);
    </script>
  </body>
</html>`;
}
