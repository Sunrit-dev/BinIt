"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { RiskZone } from "@/lib/geo";
import { circleAround } from "@/lib/geo";
import { timeAgo, severityColor } from "@/lib/utils";

const MAP_STYLE = process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/liberty";

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  severity: string;
  category?: string;
  status?: string;
  title?: string;
  description?: string;
  image_url?: string;
  score?: number;
  created_at?: string;
};

export type LivePosition = {
  lat: number;
  lon: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
};

export type BinitMapProps = {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  route?: { type: "LineString"; coordinates: [number, number][] } | null;
  draggablePin?: { lat: number; lon: number; onChange: (lat: number, lon: number) => void };
  cluster?: boolean;
  heatmap?: boolean;
  live?: LivePosition | null;
  riskZones?: RiskZone[];
  heightClass?: string;
  style?: React.CSSProperties;
};

export function BinitMap({
  center = [88.3639, 22.5726],
  zoom = 11.5,
  markers = [],
  selectedId,
  onSelect,
  route,
  draggablePin,
  cluster = false,
  heatmap = false,
  live = null,
  riskZones = [],
  heightClass = "h-[480px]",
  style,
}: BinitMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<Map<string, maplibregl.Marker>>(new Map());
  const heatRef = useRef<maplibregl.GeoJSONSource | null>(null);
  const pinRef = useRef<maplibregl.Marker | null>(null);
  const liveDotRef = useRef<maplibregl.Marker | null>(null);
  const zoneIdsRef = useRef<string[]>([]);
  const zonePulseRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const propsRef = useRef({ onSelect });
  propsRef.current = { onSelect };   const empty = { type: "FeatureCollection" as const, features: [] };

  const whenReady = (map: maplibregl.Map, cb: () => void) => {
    const run = () => {
      try {
        cb();
      } catch {
        setTimeout(run, 200);
      }
    };
    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center,
      zoom,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    mapRef.current = map;

    map.on("load", () => {
      if (draggablePin) {
        addPin(map, draggablePin.lat, draggablePin.lon, draggablePin.onChange);
      }
      if (route) renderRoute(map, route);
      if (heatmap) renderHeatLayer(map, []);
    });
    map.on("click", () => {
      if (draggablePin) {
        return; // dragging handles movement
      }
      propsRef.current.onSelect?.("");
    });

    return () => {
      if (zonePulseRef.current) clearInterval(zonePulseRef.current);
      map.remove();
      mapRef.current = null;
      markerRefs.current.clear();
      pinRef.current = null;
      liveDotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    renderAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (route) renderRoute(map, route);
    else {
      const src = map.getSource("route");
      src && (src as maplibregl.GeoJSONSource).setData({ type: "FeatureCollection", features: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !draggablePin) return;
    if (!pinRef.current) {
      addPin(map, draggablePin.lat, draggablePin.lon, draggablePin.onChange);
    } else {
      pinRef.current.setLngLat([draggablePin.lon, draggablePin.lat]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggablePin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !heatRef.current) return;
    if (heatmap) {
      if (!map.getLayer("heatmap-layer")) renderHeatLayer(map, markers);
      else {
        heatRef.current.setData(geoJsonFromMarkers(markers));
        map.setLayoutProperty("heatmap-layer", "visibility", "visible");
      }
    } else if (map.getLayer("heatmap-layer")) {
      map.setLayoutProperty("heatmap-layer", "visibility", "none");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heatmap, markers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !live) return;
    whenReady(map, () => {
      if (!map.getSource("live-acc")) {
        map.addSource("live-acc", { type: "geojson", data: empty });
        map.addLayer({
          id: "live-acc-fill",
          type: "fill",
          source: "live-acc",
          paint: { "fill-color": "#38bdf8", "fill-opacity": 0.13 },
        });
        map.addLayer({
          id: "live-acc-line",
          type: "line",
          source: "live-acc",
          paint: { "line-color": "#38bdf8", "line-width": 1.5, "line-opacity": 0.7, "line-dasharray": [1, 1.5] },
        });
      }
      const accGeo = live.accuracy
        ? {
            type: "FeatureCollection" as const,
            features: [
              {
                type: "Feature" as const,
                geometry: {
                  type: "Polygon" as const,
                  coordinates: [circleAround(live.lon, live.lat, Math.max(live.accuracy, 8))],
                },
                properties: {},
              },
            ],
          }
        : empty;
      (map.getSource("live-acc") as maplibregl.GeoJSONSource).setData(accGeo as never);

      if (!liveDotRef.current) {
        const el = document.createElement("div");
        const head = typeof live.heading === "number" ? `<span class="live-dot-head" style="transform: rotate(${live.heading}deg)"></span>` : "";
        el.innerHTML = `<div class="live-dot-wrap">${head}<span class="live-dot-dot"></span><span class="live-dot-ping"></span></div>`;
        liveDotRef.current = new maplibregl.Marker({ element: el }).setLngLat([live.lon, live.lat]).addTo(map);
      } else {
        liveDotRef.current.setLngLat([live.lon, live.lat]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, whenReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    whenReady(map, () => {
      const zonesSource = map.getSource("zones-source") as maplibregl.GeoJSONSource | undefined;
      if (!riskZones || riskZones.length === 0) {
        zoneIdsRef.current.forEach((id) => {
          if (map.getLayer(`${id}-fill`)) map.removeLayer(`${id}-fill`);
          if (map.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
        });
        zoneIdsRef.current = [];
        if (zonesSource) zonesSource.setData(empty as never);
        if (zonePulseRef.current) {
          clearInterval(zonePulseRef.current);
          zonePulseRef.current = null;
        }
        return;
      }
      const fs = {
        type: "FeatureCollection" as const,
        features: riskZones.map((z) => ({
          type: "Feature" as const,
          geometry: { type: "Polygon" as const, coordinates: [z.coordinates] },
          properties: { id: z.id, color: z.color },
        })),
      };
      if (zonesSource) {
        zonesSource.setData(fs as never);
      } else {
        map.addSource("zones-source", { type: "geojson", data: fs });
        riskZones.forEach((z) => {
          if (map.getLayer(`${z.id}-fill`)) return;
          map.addLayer(
            {
              id: `${z.id}-fill`,
              type: "fill",
              source: "zones-source",
              filter: ["==", ["get", "id"], z.id],
              paint: { "fill-color": z.color, "fill-opacity": 0.11 },
            },
            "poi-label",
          );
          map.addLayer(
            {
              id: `${z.id}-line`,
              type: "line",
              source: "zones-source",
              filter: ["==", ["get", "id"], z.id],
              layout: { "line-cap": "round", "line-join": "round" },
              paint: { "line-color": z.color, "line-width": 2, "line-opacity": 0.85, "line-dasharray": [2, 1.5] },
            },
            "poi-label",
          );
        });
      }
      zoneIdsRef.current = riskZones.map((z) => z.id);
      if (!zonePulseRef.current) {
        let frame = 0;
        zonePulseRef.current = setInterval(() => {
          frame++;
          zoneIdsRef.current.forEach((id, i) => {
            const wob = 0.09 + 0.06 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
            if (map.getLayer(`${id}-fill`)) map.setPaintProperty(`${id}-fill`, "fill-opacity", wob);
          });
        }, 90);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskZones, whenReady]);

  function addPin(map: maplibregl.Map, lat: number, lon: number, onChange: (lat: number, lon: number) => void) {
    if (pinRef.current) return;
    const el = document.createElement("div");
    el.innerHTML =
      '<svg width="36" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" fill="#1f7a4d" stroke="#ecf8f1" stroke-width="1.5"/><circle cx="12" cy="9" r="3" fill="#ecf8f1"/></svg>';
    el.style.cursor = "grab";
    const marker = new maplibregl.Marker({ element: el, draggable: true })
      .setLngLat([lon, lat])
      .addTo(map);
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      onChange(lngLat.lat, lngLat.lng);
    });
    pinRef.current = marker;
  }

  function geoJsonFromMarkers(list: MapMarker[]) {
    return {
      type: "FeatureCollection" as const,
      features: list.map((m) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [m.longitude, m.latitude] },
        properties: {
          id: m.id,
          severity: m.severity,
          color: severityColor(m.severity),
          score: m.score || (m.severity === "CRITICAL" ? 90 : m.severity === "HIGH" ? 70 : m.severity === "MEDIUM" ? 45 : 20),
        },
      })),
    };
  }

  function renderHeatLayer(map: maplibregl.Map, list: MapMarker[]) {
    const source = map.getSource("heat-source");
    if (source) {
      heatRef.current = source as maplibregl.GeoJSONSource;
      heatRef.current.setData(geoJsonFromMarkers(list));
    } else {
      map.addSource("heat-source", {
        type: "geojson",
        data: geoJsonFromMarkers(list),
      });
      heatRef.current = map.getSource("heat-source") as maplibregl.GeoJSONSource;
      map.addLayer(
        {
          id: "heatmap-layer",
          type: "heatmap",
          source: "heat-source",
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "score"], 0, 0.4, 50, 0.7, 100, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 14, 3],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(16,185,129,0)",
              0.2, "rgba(16,185,129,0.5)",
              0.4, "rgba(245,158,11,0.6)",
              0.6, "rgba(239,68,68,0.75)",
              0.8, "rgba(127,29,29,0.95)",
            ],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 14, 14, 40],
            "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 0, 1, 14, 0.85],
          },
        },
        "poi-label",
      );
    }
  }

  function renderRoute(map: maplibregl.Map, geo: { type: "LineString"; coordinates: [number, number][] }) {
    if (!map.isStyleLoaded()) {
      setTimeout(() => renderRoute(map, geo), 150);
      return;
    }
    const data = { type: "FeatureCollection" as const, features: [{ type: "Feature" as const, geometry: geo, properties: {} }] };
    if (map.getSource("route")) {
      (map.getSource("route") as maplibregl.GeoJSONSource).setData(data);
    } else {
      map.addSource("route", { type: "geojson", data });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#38bdf8", "line-width": 5, "line-opacity": 0.9 },
      });
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#0ea5e9", "line-width": 9, "line-opacity": 0.25 },
      });
    }
    const coords = geo.coordinates;
    if (coords.length > 1) {
      map.fitBounds(
        coords.reduce<bounds>(
          (b, c) => {
            b[0][0] = Math.min(b[0][0], c[0]);
            b[0][1] = Math.min(b[0][1], c[1]);
            b[1][0] = Math.max(b[1][0], c[0]);
            b[1][1] = Math.max(b[1][1], c[1]);
            return b;
          },
          [
            [coords[0][0], coords[0][1]],
            [coords[0][0], coords[0][1]],
          ],
        ),
        { padding: 60, duration: 900 },
      );
    }
  }

  type bounds = [[number, number], [number, number]];

  function renderAll() {
    const map = mapRef.current;
    if (!map || markers.length === 0) return;
    const existing = new Set(markerRefs.current.keys());
    markers.forEach((m) => {
      const popup = new maplibregl.Popup({ offset: 26, closeButton: false, maxWidth: "260px" }).setHTML(
        `<div class="c-popup">
          ${m.image_url ? `<img src="${m.image_url}" class="c-popup-img" />` : ""}
          <div class="c-popup-title">${m.title || m.category || "Waste report"}</div>
          <div class="c-popup-meta">
            <span style="color:${severityColor(m.severity)}">● ${m.severity}${typeof m.score === "number" ? ` (${m.score})` : ""}</span>
            ${m.category ? `<span>${m.category}</span>` : ""}
            ${m.status ? `<span>${m.status.replace(/_/g, " ")}</span>` : ""}
          </div>
          ${m.description ? `<div class="c-popup-desc">${m.description}</div>` : ""}
          <div class="c-popup-time">${timeAgo(m.created_at)}</div>
        </div>`,
      );

      const existingMarker = markerRefs.current.get(m.id);
      let marker;
      if (existingMarker) {
        marker = existingMarker;
        marker.setPopup(popup);
      } else if (cluster) {
        const el = document.createElement("div");
        el.style.width = "15px";
        el.style.height = "15px";
        el.style.borderRadius = "50%";
        el.style.background = severityColor(m.severity);
        el.style.border = "2px solid #ecf8f1";
        marker = new maplibregl.Marker({ element: el }).setLngLat([m.longitude, m.latitude]).setPopup(popup).addTo(map);
      } else {
        marker = new maplibregl.Marker({ element: elFor(m), anchor: "bottom" })
          .setLngLat([m.longitude, m.latitude])
          .setPopup(popup)
          .addTo(map);
      }
      marker.getElement().addEventListener("click", (e) => {
        e.stopPropagation();
        propsRef.current.onSelect?.(m.id);
      });
      markerRefs.current.set(m.id, marker);
      existing.delete(m.id);
    });
    existing.forEach((id) => {
      markerRefs.current.get(id)?.remove();
      markerRefs.current.delete(id);
    });
  }

  function elFor(m: MapMarker) {
    const el = document.createElement("div");
    el.innerHTML = "";
    const lvl = (m.severity || "UNKNOWN").toUpperCase();
    const size = lvl === "CRITICAL" ? "22px" : lvl === "HIGH" ? "19px" : "17px";
    el.style.position = "relative";
    el.style.width = size;
    el.style.height = size;
    el.style.borderRadius = "50% 50% 50% 0";
    el.style.transform = "rotate(-45deg)";
    el.style.background = severityColor(lvl);
    el.style.border = "2px solid #ecf8f1";
    el.style.boxShadow = `0 2px 8px rgba(0,0,0,0.55), 0 0 14px ${severityColor(lvl)}66`;
    el.style.cursor = "pointer";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    if (lvl === "CRITICAL" || lvl === "HIGH") {
      const halo = document.createElement("span");
      halo.className = "marker-halo b-blip";
      halo.style.setProperty("--halo", severityColor(lvl));
      el.appendChild(halo);
    }
    return el;
  }

  useEffect(() => {
    const map = mapRef.current;
    if (map && selectedId && markers.length) {
      const sel = markers.find((m) => m.id === selectedId);
      if (sel) {
        map.flyTo({ center: [sel.longitude, sel.latitude], zoom: 13.5, duration: 900 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div className="relative">
      <div ref={containerRef} className={`w-full overflow-hidden rounded-2xl border border-white/10 ${heightClass}`} style={style} />
      <style jsx global>{`
        .c-popup { font-family: inherit; }
        .c-popup-img { width: 100%; max-height: 110px; object-fit: cover; border-radius: 8px; margin-bottom: 6px; }
        .c-popup-title { font-weight: 700; font-size: 13px; margin-bottom: 2px; }
        .c-popup-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: #a7c9b8; }
        .c-popup-desc { font-size: 11px; color: #cfe8db; margin-top: 4px; }
        .c-popup-time { font-size: 10px; color: #6f9180; margin-top: 4px; }
        .maplibregl-popup-content { pointer-events: auto; }
      `}</style>
    </div>
  );
}