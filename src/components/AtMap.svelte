<script lang="ts">
  import { onMount } from "svelte";
  import "leaflet/dist/leaflet.css";

  let container: HTMLDivElement;

  // UI state
  let showMileMarkers = true;

  // Keep map init client-only.
  onMount(async () => {
    const L = await import("leaflet");

    const map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap tiles (no API key). Respect usage & attribution.
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.control.scale({ imperial: true, metric: false }).addTo(map);

    // Fallback view (roughly AT bounds)
    map.setView([39.0, -76.0], 5);

    // Trail line
    try {
      const res = await fetch("/data/appalachian-trail.geojson", {
        headers: { Accept: "application/geo+json, application/json" },
      });
      if (!res.ok) throw new Error(`GeoJSON fetch failed: ${res.status}`);

      const geojson = await res.json();

      const layer = L.geoJSON(geojson, {
        style: {
          color: "#f97316", // orange
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

    // Mile markers (from existing site data)
    const mileLayer = L.layerGroup();
    const canvasRenderer = L.canvas({ padding: 0.5 });

    async function loadMileMarkers() {
      try {
        const res = await fetch("/at-mileposts.json", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`mileposts fetch failed: ${res.status}`);
        const data = await res.json();

        const mileposts = data?.mileposts || [];
        // Keep it simple + readable: render every 10 miles.
        const step = 10;

        for (const mp of mileposts) {
          const mile = mp.mile;
          if (typeof mile !== "number") continue;
          if (mile % step !== 0) continue;

          const lat = mp.lat;
          const lon = mp.lon;
          if (typeof lat !== "number" || typeof lon !== "number") continue;

          const marker = L.circleMarker([lat, lon], {
            radius: 4,
            color: "#0f172a", // slate-900
            weight: 1,
            opacity: 0.9,
            fillColor: "#22c55e", // green-500
            fillOpacity: 0.85,
            renderer: canvasRenderer,
          }).bindPopup(`<b>Mile ${mile}</b>`);

          marker.addTo(mileLayer);
        }
      } catch (err) {
        console.error(err);
      }
    }

    await loadMileMarkers();

    function syncMileLayer() {
      if (showMileMarkers) {
        if (!map.hasLayer(mileLayer)) mileLayer.addTo(map);
      } else {
        if (map.hasLayer(mileLayer)) map.removeLayer(mileLayer);
      }
    }

    // Start with markers on.
    syncMileLayer();

    // Location (no API key): show a marker + center on it.
    let myLocationMarker: any = null;

    function locateMe() {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported on this device/browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          if (myLocationMarker) {
            map.removeLayer(myLocationMarker);
          }

          myLocationMarker = L.circleMarker([lat, lon], {
            radius: 7,
            color: "#1d4ed8", // blue-700
            weight: 2,
            fillColor: "#60a5fa", // blue-400
            fillOpacity: 0.75,
          })
            .addTo(map)
            .bindPopup("<b>Your location</b>");

          map.setView([lat, lon], Math.max(map.getZoom(), 12));
          myLocationMarker.openPopup();
        },
        (err) => {
          console.warn(err);
          alert(
            "Couldn’t get your location. If you’re on iPhone, make sure Location Services are enabled and the browser has permission."
          );
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }

    // Custom little control UI
    const Controls = L.Control.extend({
      onAdd: function () {
        const div = L.DomUtil.create("div", "hc-map-controls");
        div.innerHTML = `
          <div class="hc-map-controls-inner">
            <label class="hc-toggle">
              <input id="hc-mile-toggle" type="checkbox" ${showMileMarkers ? "checked" : ""} />
              <span>Mile markers</span>
            </label>
            <button id="hc-locate" type="button">Locate me</button>
          </div>
        `;

        // Prevent clicks from dragging the map.
        L.DomEvent.disableClickPropagation(div);

        const toggle = div.querySelector("#hc-mile-toggle") as HTMLInputElement;
        const locate = div.querySelector("#hc-locate") as HTMLButtonElement;

        toggle.addEventListener("change", () => {
          showMileMarkers = toggle.checked;
          syncMileLayer();
        });

        locate.addEventListener("click", () => locateMe());

        return div;
      },
    });

    new Controls({ position: "topright" }).addTo(map);
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

  :global(.leaflet-container) {
    background: #0b0b0b;
    font: inherit;
  }

  :global(.hc-map-controls) {
    background: rgba(15, 23, 42, 0.92);
    color: #e2e8f0;
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 12px;
    padding: 8px 10px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(8px);
  }

  :global(.hc-map-controls-inner) {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 140px;
  }

  :global(.hc-toggle) {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    user-select: none;
  }

  :global(.hc-map-controls button) {
    background: rgba(34, 197, 94, 0.18);
    color: #bbf7d0;
    border: 1px solid rgba(34, 197, 94, 0.35);
    border-radius: 10px;
    padding: 6px 8px;
    font-weight: 600;
    cursor: pointer;
  }

  :global(.hc-map-controls button:hover) {
    background: rgba(34, 197, 94, 0.26);
    border-color: rgba(34, 197, 94, 0.5);
  }
</style>
