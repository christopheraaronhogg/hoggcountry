<script lang="ts">
  import { onMount } from "svelte";

  let container: HTMLDivElement;

  // Keep map init client-only.
  onMount(async () => {
    const L = await import("leaflet");
    await import("leaflet/dist/leaflet.css");

    const map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap tiles (no API key). Respect usage & attribution.
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Fallback view (roughly AT bounds)
    map.setView([39.0, -76.0], 5);

    try {
      const res = await fetch("/data/appalachian-trail.geojson", {
        headers: { Accept: "application/geo+json, application/json" },
      });
      if (!res.ok) throw new Error(`GeoJSON fetch failed: ${res.status}`);

      const geojson = await res.json();

      const layer = L.geoJSON(geojson, {
        style: {
          color: "#f97316", // Tailwind orange-500
          weight: 3,
          opacity: 0.9,
        },
      }).addTo(map);

      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [18, 18] });
      }
    } catch (err) {
      console.error(err);
    }
  });
</script>

<div class="at-map" bind:this={container} aria-label="Appalachian Trail map" />

<style>
  .at-map {
    width: 100%;
    height: min(72vh, 720px);
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* In case Leaflet CSS doesn’t fully load in time */
  :global(.leaflet-container) {
    background: #0b0b0b;
    font: inherit;
  }
</style>
