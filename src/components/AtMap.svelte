<script lang="ts">
  import { onMount } from "svelte";
  import "leaflet/dist/leaflet.css";

  import atWaterSources from "../data/at-water-sources.json";
  import { RESUPPLY_STOPS } from "../data/resupplyStops";
  import { AT_ROAD_CROSSINGS } from "../data/at-road-crossings";

  let container: HTMLDivElement;

  // UI state
  let showMileMarkers = true;
  let showWaterSources = false;
  let showResupplyStops = true;
  let showRoadCrossings = false;
  let showShelters = true;

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

    // Layers
    const canvasRenderer = L.canvas({ padding: 0.5 });
    const mileLayer = L.layerGroup();
    const waterLayer = L.layerGroup();
    const resupplyLayer = L.layerGroup();
    const crossingLayer = L.layerGroup();
    const shelterLayer = L.layerGroup();

    // Mile coordinate lookup (used to "place" things that only have a mile number)
    const mileCoord = new Map<number, { lat: number; lon: number }>();

    function coordForMile(mile: number): [number, number] | null {
      if (!Number.isFinite(mile)) return null;

      const lo = Math.floor(mile);
      const hi = Math.ceil(mile);
      const a = mileCoord.get(lo);
      const b = mileCoord.get(hi);

      if (!a && !b) return null;
      if (a && !b) return [a.lat, a.lon];
      if (!a && b) return [b.lat, b.lon];
      if (lo === hi) return [a!.lat, a!.lon];

      const t = (mile - lo) / (hi - lo);
      return [a!.lat + (b!.lat - a!.lat) * t, a!.lon + (b!.lon - a!.lon) * t];
    }

    async function loadMilepostsAndBuildLayers() {
      const res = await fetch("/at-mileposts.json", {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`mileposts fetch failed: ${res.status}`);
      const data = await res.json();

      const mileposts = data?.mileposts || [];

      for (const mp of mileposts) {
        if (typeof mp?.mile !== "number") continue;
        if (typeof mp?.lat !== "number" || typeof mp?.lon !== "number") continue;
        mileCoord.set(mp.mile, { lat: mp.lat, lon: mp.lon });
      }

      // Mile markers (every 10)
      const step = 10;
      for (const mp of mileposts) {
        const mile = mp.mile;
        if (typeof mile !== "number") continue;
        if (mile % step !== 0) continue;

        const lat = mp.lat;
        const lon = mp.lon;
        if (typeof lat !== "number" || typeof lon !== "number") continue;

        L.circleMarker([lat, lon], {
          radius: 4,
          color: "#0f172a", // slate-900
          weight: 1,
          opacity: 0.9,
          fillColor: "#22c55e", // green-500
          fillOpacity: 0.85,
          renderer: canvasRenderer,
        })
          .bindPopup(`<b>Mile ${mile}</b>`)
          .addTo(mileLayer);
      }

      // Resupply stops
      for (const stop of RESUPPLY_STOPS) {
        const ll = coordForMile(stop.mile);
        if (!ll) continue;

        const title = `${stop.name}${stop.state ? ", " + stop.state : ""}`;
        const services = stop.services?.length ? stop.services.join(", ") : "";

        L.circleMarker(ll, {
          radius: 6,
          color: "#7f1d1d", // red-900
          weight: 2,
          opacity: 0.95,
          fillColor: "#ef4444", // red-500
          fillOpacity: 0.75,
          renderer: canvasRenderer,
        })
          .bindPopup(
            `<b>${title}</b><br/>Mile ${stop.mile}<br/><small>${stop.type}${services ? " • " + services : ""}</small>`
          )
          .addTo(resupplyLayer);
      }

      // Water sources (approx placed by mile; shown at higher zoom)
      for (const src of atWaterSources as any[]) {
        const mile = src?.mile;
        if (typeof mile !== "number") continue;
        const ll = coordForMile(mile);
        if (!ll) continue;

        const name = src?.name || "Water";
        const type = src?.type || "";
        const offTrail = src?.offTrail ? " (off-trail)" : "";

        L.circleMarker(ll, {
          radius: 4,
          color: "#0c4a6e", // sky-900
          weight: 1,
          opacity: 0.9,
          fillColor: "#38bdf8", // sky-400
          fillOpacity: 0.75,
          renderer: canvasRenderer,
        })
          .bindPopup(`<b>${name}</b><br/>Mile ${mile}<br/><small>${type}${offTrail}</small>`)
          .addTo(waterLayer);
      }

      // Road crossings / bailouts
      for (const x of AT_ROAD_CROSSINGS) {
        const ll = coordForMile(x.mile);
        if (!ll) continue;

        const subtitle = `${x.road} • ${x.nearestTown} (${x.townDist}mi)`;

        L.circleMarker(ll, {
          radius: 5,
          color: "#312e81", // indigo-900
          weight: 2,
          opacity: 0.95,
          fillColor: "#a78bfa", // violet-400
          fillOpacity: 0.7,
          renderer: canvasRenderer,
        })
          .bindPopup(
            `<b>${x.name}</b><br/>Mile ${x.mile}<br/><small>${subtitle}</small>${x.notes ? `<br/><small>${x.notes}</small>` : ""}`
          )
          .addTo(crossingLayer);
      }
    }

    async function loadShelters() {
      try {
        const res = await fetch("/data/at-shelters.geojson", {
          headers: { Accept: "application/geo+json, application/json" },
        });
        if (!res.ok) throw new Error(`shelters fetch failed: ${res.status}`);
        const data = await res.json();

        const features = data?.features || [];
        for (const ft of features) {
          const coords = ft?.geometry?.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) continue;
          const lon = coords[0];
          const lat = coords[1];
          if (typeof lat !== "number" || typeof lon !== "number") continue;

          const props = ft?.properties || {};
          const name = props?.name || props?.tags?.name || "Shelter";
          const shelterType = props?.shelter_type ? String(props.shelter_type) : "";

          L.circleMarker([lat, lon], {
            radius: 5,
            color: "#92400e", // amber-800
            weight: 2,
            opacity: 0.95,
            fillColor: "#f59e0b", // amber-500
            fillOpacity: 0.75,
            renderer: canvasRenderer,
          })
            .bindPopup(
              `<b>${name}</b>${shelterType ? `<br/><small>${shelterType}</small>` : ""}`
            )
            .addTo(shelterLayer);
        }
      } catch (err) {
        console.error(err);
      }
    }

    try {
      await loadMilepostsAndBuildLayers();
      await loadShelters();
    } catch (err) {
      console.error(err);
    }

    function syncOverlays() {
      // Mile markers
      if (showMileMarkers) {
        if (!map.hasLayer(mileLayer)) mileLayer.addTo(map);
      } else {
        if (map.hasLayer(mileLayer)) map.removeLayer(mileLayer);
      }

      // Resupply stops
      if (showResupplyStops) {
        if (!map.hasLayer(resupplyLayer)) resupplyLayer.addTo(map);
      } else {
        if (map.hasLayer(resupplyLayer)) map.removeLayer(resupplyLayer);
      }

      // Road crossings
      if (showRoadCrossings) {
        if (!map.hasLayer(crossingLayer)) crossingLayer.addTo(map);
      } else {
        if (map.hasLayer(crossingLayer)) map.removeLayer(crossingLayer);
      }

      const zoom = map.getZoom();

      // Water sources (only show when zoomed in enough)
      const waterAllowed = zoom >= 11;
      if (showWaterSources && waterAllowed) {
        if (!map.hasLayer(waterLayer)) waterLayer.addTo(map);
      } else {
        if (map.hasLayer(waterLayer)) map.removeLayer(waterLayer);
      }

      // Shelters (OSM-derived)
      const shelterAllowed = zoom >= 10;
      if (showShelters && shelterAllowed) {
        if (!map.hasLayer(shelterLayer)) shelterLayer.addTo(map);
      } else {
        if (map.hasLayer(shelterLayer)) map.removeLayer(shelterLayer);
      }
    }

    // Initial overlay sync
    syncOverlays();
    map.on("zoomend", syncOverlays);

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

            <label class="hc-toggle">
              <input id="hc-resupply-toggle" type="checkbox" ${showResupplyStops ? "checked" : ""} />
              <span>Resupply</span>
            </label>

            <label class="hc-toggle">
              <input id="hc-water-toggle" type="checkbox" ${showWaterSources ? "checked" : ""} />
              <span>Water (zoom 11+)</span>
            </label>

            <label class="hc-toggle">
              <input id="hc-shelter-toggle" type="checkbox" ${showShelters ? "checked" : ""} />
              <span>Shelters (zoom 10+)</span>
            </label>

            <label class="hc-toggle">
              <input id="hc-cross-toggle" type="checkbox" ${showRoadCrossings ? "checked" : ""} />
              <span>Road crossings</span>
            </label>

            <button id="hc-locate" type="button">Locate me</button>
          </div>
        `;

        // Prevent clicks from dragging the map.
        L.DomEvent.disableClickPropagation(div);

        const mileToggle = div.querySelector("#hc-mile-toggle") as HTMLInputElement;
        const resupplyToggle = div.querySelector("#hc-resupply-toggle") as HTMLInputElement;
        const waterToggle = div.querySelector("#hc-water-toggle") as HTMLInputElement;
        const shelterToggle = div.querySelector("#hc-shelter-toggle") as HTMLInputElement;
        const crossToggle = div.querySelector("#hc-cross-toggle") as HTMLInputElement;
        const locate = div.querySelector("#hc-locate") as HTMLButtonElement;

        mileToggle.addEventListener("change", () => {
          showMileMarkers = mileToggle.checked;
          syncOverlays();
        });

        resupplyToggle.addEventListener("change", () => {
          showResupplyStops = resupplyToggle.checked;
          syncOverlays();
        });

        waterToggle.addEventListener("change", () => {
          showWaterSources = waterToggle.checked;
          syncOverlays();
        });

        shelterToggle.addEventListener("change", () => {
          showShelters = shelterToggle.checked;
          syncOverlays();
        });

        crossToggle.addEventListener("change", () => {
          showRoadCrossings = crossToggle.checked;
          syncOverlays();
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
