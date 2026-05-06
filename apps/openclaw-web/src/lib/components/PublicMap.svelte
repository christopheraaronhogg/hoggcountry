<script lang="ts">
  import 'leaflet/dist/leaflet.css';
  import { onMount } from 'svelte';

  export let featureCollection: Record<string, any>;
  export let title = 'Dad update map';

  let host: HTMLDivElement;

  onMount(async () => {
    const leaflet = await import('leaflet');
    const L = leaflet.default ?? leaflet;

    const map = L.map(host, {
      zoomControl: true,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const latLngs: Array<[number, number]> = [];

    for (const feature of featureCollection?.features ?? []) {
      const geometry = feature?.geometry;
      if (!geometry) continue;

      if (geometry.type === 'Point') {
        const [lon, lat] = geometry.coordinates;
        const kind = String(feature?.properties?.kind ?? 'point');
        const isSnappedTrailMile = kind === 'snapped-trail-mile';
        latLngs.push([lat, lon]);
        L.circleMarker([lat, lon], {
          radius: isSnappedTrailMile ? 10 : 8,
          weight: isSnappedTrailMile ? 3 : 2,
          color: '#ffffff',
          fillColor: isSnappedTrailMile ? '#4d594a' : '#d97706',
          fillOpacity: 0.95
        })
          .bindPopup(String(feature?.properties?.name ?? title))
          .addTo(map);
      }

      if (geometry.type === 'LineString') {
        const points = geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
        latLngs.push(...points);
        L.polyline(points, {
          color: '#4d594a',
          weight: 4,
          opacity: 0.7
        }).addTo(map);
      }
    }

    if (latLngs.length > 1) {
      map.fitBounds(latLngs, { padding: [28, 28] });
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 10);
    } else {
      map.setView([34.6275, -84.193], 8);
    }

    return () => {
      map.remove();
    };
  });
</script>

<div class="card map-card">
  <div class="panel-copy">
    <p class="eyebrow">Map</p>
    <h2>{title}</h2>
  </div>
  <div bind:this={host} class="map-host" aria-label={title}></div>
</div>

<style>
  .map-card {
    overflow: hidden;
  }

  .map-host {
    height: min(70vh, 540px);
    width: 100%;
  }
</style>
