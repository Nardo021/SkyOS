import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Aircraft } from "@skyos/types";

interface DebugMapViewProps {
  lat: number;
  lon: number;
  radiusKm: number;
  aircraft: Aircraft[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function circleGeoJson(lat: number, lon: number, radiusKm: number) {
  const points = 64;
  const coords: [number, number][] = [];
  const latRad = (lat * Math.PI) / 180;
  const dLat = (radiusKm / 111) * (180 / Math.PI);
  const dLon = (radiusKm / (111 * Math.cos(latRad))) * (180 / Math.PI);
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * 2 * Math.PI;
    coords.push([
      lon + dLon * Math.cos(t),
      lat + dLat * Math.sin(t),
    ]);
  }
  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [coords],
    },
    properties: {},
  };
}

export function DebugMapView({
  lat,
  lon,
  radiusKm,
  aircraft,
  selectedId,
  onSelect,
}: DebugMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [lon, lat],
      zoom: 10,
      attributionControl: {},
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("radius", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [circleGeoJson(lat, lon, radiusKm)],
        },
      });
      map.addLayer({
        id: "radius-fill",
        type: "fill",
        source: "radius",
        paint: {
          "fill-color": "#0ea5e9",
          "fill-opacity": 0.08,
        },
      });
      map.addLayer({
        id: "radius-line",
        type: "line",
        source: "radius",
        paint: {
          "line-color": "#38bdf8",
          "line-width": 2,
          "line-opacity": 0.6,
        },
      });
      map.addSource("observer", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lon, lat] },
          properties: { title: "Observer" },
        },
      });
      map.addLayer({
        id: "observer",
        type: "circle",
        source: "observer",
        paint: {
          "circle-radius": 8,
          "circle-color": "#22d3ee",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getSource("radius")) {
      (map.getSource("radius") as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: [circleGeoJson(lat, lon, radiusKm)],
      });
    }
    if (map.getSource("observer")) {
      (map.getSource("observer") as maplibregl.GeoJSONSource).setData({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon, lat] },
        properties: {},
      });
    }
    map.flyTo({ center: [lon, lat], duration: 800 });
  }, [lat, lon, radiusKm]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const placeMarkers = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      for (const ac of aircraft) {
        const el = document.createElement("button");
        el.type = "button";
        el.className =
          selectedId === ac.id
            ? "h-3 w-3 rounded-full bg-sky-400 ring-2 ring-white"
            : "h-2.5 w-2.5 rounded-full bg-amber-400";
        el.title = ac.callsign ?? ac.id;
        el.onclick = () => onSelect(selectedId === ac.id ? null : ac.id);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([ac.lon, ac.lat])
          .addTo(map);
        markersRef.current.push(marker);
      }
    };

    if (map.isStyleLoaded()) placeMarkers();
    else map.once("load", placeMarkers);
  }, [aircraft, selectedId, onSelect]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-xl overflow-hidden"
    />
  );
}
