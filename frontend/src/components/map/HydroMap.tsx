// frontend/src/components/map/HydroMap.tsx
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { FeatureCollection } from "@/api/spatial";
import type { SpatialDisplayMode } from "@/types/spatial";
import L, { type Layer, type LatLngExpression, type LatLng } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { BASEMAPS, type BasemapId } from "@/config/basemaps";
import { formatStationDisplayName, formatSubbasinDisplayName } from "@/lib/stationLabels";

const AnyTileLayer = TileLayer as any;

type ZoomToBasinRequest = { tick: number; basinName: string; barrageName?: string };
type ResetViewRequest = { tick: number };
type SelectionZoomRequest = { tick: number };
type ExportPngRequest = { tick: number; filename?: string };
type ViewportPadding = {
  topLeft?: [number, number];
  bottomRight?: [number, number];
};

type ThematicConfig = {
  stationValues: Map<number, number | null>;
  colors: string[]; // low -> high
  min: number | null;
  max: number | null;
  unit: string;
  label: string;
};

type Props = {
  className?: string;
  opacity?: number; // 0..1
  basemap?: BasemapId;
  displayMode?: SpatialDisplayMode;
  layers?: {
    basins?: FeatureCollection | null;
    subBasins?: FeatureCollection | null;
    reach?: FeatureCollection | null;
    stations?: FeatureCollection | null;
    hruSummary?: FeatureCollection | null;
  };
  barrages?: FeatureCollection | null;
  thematic?: ThematicConfig;

  zoomToBasinRequest?: ZoomToBasinRequest;
  resetViewRequest?: ResetViewRequest;
  selectionZoomRequest?: SelectionZoomRequest;
  activeTool?: "distance" | "area" | null;
  exportPngRequest?: ExportPngRequest;
  selectedBasinId?: number | null;
  selectedSubBasinId?: number | null;
  selectedBarrageId?: number | null;
  selectedReachId?: number | null;
  selectedStationId?: number | null;
  onStationSelect?: (payload: {
    stationId: number;
    name: string;
    code?: string;
    catchmentId?: number | null;
    stationType?: string | null;
    properties: Record<string, any>;
  }) => void;
  onSubBasinSelect?: (payload: {
    subbasinId: number;
    name: string;
    catchmentId?: number | null;
    properties: Record<string, any>;
  }) => void;
  onReachSelect?: (payload: {
    reachId: number;
    name: string;
    code?: string;
    subbasinId?: number | null;
    catchmentId?: number | null;
    properties: Record<string, any>;
  }) => void;
  onBarrageSelect?: (payload: {
    barrageId: number;
    name: string;
    catchmentId?: number | null;
    properties: Record<string, any>;
  }) => void;
  debugMode?: boolean;
  viewportPadding?: ViewportPadding;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function polygonAreaM2(map: L.Map, latlngs: LatLng[]) {
  if (latlngs.length < 3) return 0;
  const pts = latlngs.map((ll) => map.options.crs.project(ll));
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    sum += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(sum) / 2;
}

// 0..(k-1) avec min/max
function valueToClass(value: number, min: number, max: number, k: number) {
  if (k <= 1) return 0;
  if (min === max) return 0;
  const t = (value - min) / (max - min);
  const idx = Math.floor(t * k);
  return Math.max(0, Math.min(k - 1, idx >= k ? k - 1 : idx));
}

function fmt(v: number, unit: string) {
  if (!Number.isFinite(v)) return "—";
  const d = Math.abs(v) >= 100 ? 1 : 2;
  return `${v.toFixed(d)} ${unit}`;
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\bbarrage\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* -------------------- Subbasins palette (soft, not flashy) -------------------- */
const SUBBASIN_PALETTE = [
  "#7AA6C2", // blue gray
  "#8FB9A8", // green gray
  "#C3B091", // sand
  "#B79BBE", // violet gray
  "#A3B18A", // olive
  "#D4A373", // warm sand
  "#9BB6CF", // light blue
  "#B6C7A2", // light olive
  "#C7A4A4", // muted red
  "#A7C6ED", // pastel blue
];

function hashToIndex(x: unknown, mod: number) {
  const s = String(x ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return mod ? h % mod : 0;
}

function getFeatureId(f: any) {
  return f?.properties?.id ?? f?.properties?.subbasin_id ?? f?.id ?? "";
}

function getFeatureName(f: any) {
  return (
    f?.properties?.subbasin_label ??
    formatSubbasinDisplayName(
      f?.properties?.name ?? f?.properties?.nom ?? f?.properties?.subbasin_name,
      f?.properties?.subbasin_code,
      getFeatureId(f),
    )
  );
}

function prettyKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAny(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "—";
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function subBasinPopupHtml(feature: any) {
  const p: any = feature?.properties || {};
  const name = getFeatureName(feature);
  const id = p?.id ?? p?.subbasin_id ?? feature?.id ?? "—";
  const catchment = p?.catchment_id ?? p?.catchment ?? p?.basin_id ?? "—";

  const entries = Object.entries(p)
    .filter(([k]) => !["name", "nom", "subbasin_name"].includes(k))
    .sort(([a], [b]) => a.localeCompare(b));

  const rowsHtml = entries
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:6px 10px;border-top:1px solid #e2e8f0;color:#475569;font-weight:600;white-space:nowrap;">
          ${prettyKey(k)}
        </td>
        <td style="padding:6px 10px;border-top:1px solid #e2e8f0;color:#0f172a;word-break:break-word;">
          ${formatAny(v)}
        </td>
      </tr>`
    )
    .join("");

  return `
  <div style="min-width:340px;max-width:520px;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
      <div>
        <div style="font-weight:900;font-size:14px;margin-bottom:6px;color:#0f172a;">
          ${name}
        </div>
        <div style="font-size:12px;color:#334155;line-height:1.35;">
          <div><b>ID:</b> ${formatAny(id)}</div>
          <div><b>Catchment:</b> ${formatAny(catchment)}</div>
        </div>
      </div>
    </div>

    <div style="margin-top:10px;">
      <div style="font-size:12px;font-weight:800;color:#0f172a;margin-bottom:6px;">
        Propriétés du sous-bassin
      </div>

      <div style="max-height:260px;overflow:auto;border:1px solid #e2e8f0;border-radius:10px;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          ${
            rowsHtml ||
            `<tr><td style="padding:10px;color:#64748b;">Aucune propriété disponible.</td></tr>`
          }
        </table>
      </div>
    </div>
  </div>`;
}

function reachPopupHtml(feature: any) {
  const p: any = feature?.properties || {};
  if (p?.flow_out_cms !== undefined || p?.drainage_area_km2 !== undefined || p?.scenario_code !== undefined) {
    const id = p?.id ?? p?.reach_id ?? feature?.id ?? "-";
    const reachCode = p?.reach_code ?? id;
    const subbasinId = p?.subbasin_id ?? "-";
    const flowOut = p?.flow_out_cms;
    const scenario = p?.scenario_code ?? "Etat actuel";
    const lengthKm = typeof p?.length_m === "number" ? p.length_m / 1000 : p?.length_km;
    const drainageArea = p?.drainage_area_km2;

    return `
    <div style="min-width:280px;max-width:380px;">
      <div style="font-weight:900;font-size:14px;margin-bottom:8px;color:#0f172a;">
        Reach : ${formatAny(reachCode)}
      </div>
      <div style="font-size:12px;color:#334155;line-height:1.55;">
        <div><b>Subbasin :</b> ${formatAny(subbasinId)}</div>
        <div><b>Débits m³/s :</b> ${
          typeof flowOut === "number"
            ? `${flowOut.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} m3/s`
            : "-"
        }</div>
        <div><b>Scenario :</b> ${formatAny(scenario)}</div>
        <div><b>Longueur :</b> ${
          typeof lengthKm === "number"
            ? `${lengthKm.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} km`
            : "-"
        }</div>
        <div><b>Surface drainee :</b> ${
          typeof drainageArea === "number"
            ? `${drainageArea.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} km2`
            : "-"
        }</div>
      </div>
    </div>`;
  }
  const name = p?.reach_name ?? p?.name ?? p?.reach_code ?? `Reach ${p?.id ?? "—"}`;
  const id = p?.id ?? p?.reach_id ?? feature?.id ?? "—";
  const reachCode = p?.reach_code ?? "—";
  const subbasinId = p?.subbasin_id ?? "—";
  const catchmentId = p?.catchment_id ?? "—";
  const lengthM = p?.length_m ?? "—";
  const slopePct = p?.slope_pct ?? "—";

  const entries = Object.entries(p)
    .filter(([k]) => !["name", "nom", "reach_name"].includes(k))
    .sort(([a], [b]) => a.localeCompare(b));

  const rowsHtml = entries
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:6px 10px;border-top:1px solid #e2e8f0;color:#475569;font-weight:600;white-space:nowrap;">
          ${prettyKey(k)}
        </td>
        <td style="padding:6px 10px;border-top:1px solid #e2e8f0;color:#0f172a;word-break:break-word;">
          ${formatAny(v)}
        </td>
      </tr>`
    )
    .join("");

  return `
  <div style="min-width:340px;max-width:520px;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
      <div>
        <div style="font-weight:900;font-size:14px;margin-bottom:6px;color:#0f172a;">
          ${name}
        </div>
        <div style="font-size:12px;color:#334155;line-height:1.35;">
          <div><b>ID:</b> ${formatAny(id)}</div>
          <div><b>Reach code:</b> ${formatAny(reachCode)}</div>
          <div><b>Sub-basin:</b> ${formatAny(subbasinId)}</div>
          <div><b>Catchment:</b> ${formatAny(catchmentId)}</div>
          <div><b>Length (m):</b> ${formatAny(lengthM)}</div>
          <div><b>Slope (%):</b> ${formatAny(slopePct)}</div>
        </div>
      </div>
    </div>

    <div style="margin-top:10px;">
      <div style="font-size:12px;font-weight:800;color:#0f172a;margin-bottom:6px;">
        Propriétés du reach
      </div>

      <div style="max-height:260px;overflow:auto;border:1px solid #e2e8f0;border-radius:10px;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          ${
            rowsHtml ||
            `<tr><td style="padding:10px;color:#64748b;">Aucune propriété disponible.</td></tr>`
          }
        </table>
      </div>
    </div>
  </div>`;
}

/* -------------------- Map helpers -------------------- */
function CreatePanes() {
  const map = useMap();

  useEffect(() => {
    const ensure = (name: string, z: number) => {
      if (!map.getPane(name)) map.createPane(name);
      const pane = map.getPane(name)!;
      pane.style.zIndex = String(z);
    };

    ensure("basinsPane", 401);
    ensure("subBasinsPane", 402);
    ensure("hruPane", 402);
    ensure("reachPane", 403);
    ensure("barragesPane", 404);
    ensure("labelsPane", 9980);
    ensure("stationsPane", 9999);
  }, [map]);

  return null;
}

function BasemapLayers({ basemap }: { basemap: BasemapId }) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  const activeBasemap = BASEMAPS[basemap] || BASEMAPS.satellite_labels;

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on("zoomend", onZoom);
    return () => map.off("zoomend", onZoom);
  }, [map]);

  const showLabels =
    Boolean(activeBasemap.labelsUrl) &&
    zoom >= (activeBasemap.labelsMinZoom ?? 0);

  return (
    <>
      <AnyTileLayer
        key={`base-${activeBasemap.id}`}
        url={activeBasemap.baseUrl}
        attribution={activeBasemap.attribution}
      />
      {showLabels && activeBasemap.labelsUrl && (
        <AnyTileLayer
          key={`labels-${activeBasemap.id}`}
          url={activeBasemap.labelsUrl}
          pane="labelsPane"
          opacity={0.96}
          attribution={activeBasemap.attribution}
        />
      )}
    </>
  );
}

function ZoomToBasin({
  barrages,
  basins,
  req,
}: {
  barrages?: FeatureCollection | null;
  basins: FeatureCollection | null | undefined;
  req?: ZoomToBasinRequest;
}) {
  const map = useMap();

  useEffect(() => {
    if (!req?.tick) return;

    const fitFeature = (feature: any): boolean => {
      const bounds = L.geoJSON(feature as any).getBounds();
      if (!bounds.isValid()) return false;
      map.fitBounds(bounds, { padding: [30, 30] });
      return true;
    };

    const findByName = (fc: FeatureCollection | null | undefined, wanted: string) => {
      if (!fc?.features?.length) return null;
      const target = normalizeName(wanted);
      return (
        fc.features.find((x: any) => {
          const name = normalizeName(String(x?.properties?.name ?? ""));
          return name.includes(target) || target.includes(name);
        }) ?? null
      );
    };

    const barrageWanted = req.barrageName ?? req.basinName;
    const barrageFeature = findByName(barrages, barrageWanted);
    if (barrageFeature && fitFeature(barrageFeature)) return;

    const basinFeature = findByName(basins, req.basinName);
    if (basinFeature && fitFeature(basinFeature)) return;

    if (basins?.features?.length) {
      const allBounds = L.geoJSON(basins as any).getBounds();
      if (allBounds.isValid()) map.fitBounds(allBounds, { padding: [30, 30] });
    }
  }, [req?.tick, barrages, basins, req?.basinName, req?.barrageName, map]);

  return null;
}

function featureId(feature: any, keys: string[]) {
  for (const key of keys) {
    const value = Number(feature?.properties?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function featureBounds(feature: any) {
  const bounds = L.geoJSON(feature as any).getBounds();
  return bounds.isValid() ? bounds : null;
}

function collectionBounds(collections: Array<FeatureCollection | null | undefined>) {
  const bounds = L.latLngBounds([]);
  for (const fc of collections) {
    if (!fc?.features?.length) continue;
    const fcBounds = L.geoJSON(fc as any).getBounds();
    if (fcBounds.isValid()) bounds.extend(fcBounds);
  }
  return bounds.isValid() ? bounds : null;
}

function findFeatureById(
  fc: FeatureCollection | null | undefined,
  id: number | null | undefined,
  keys: string[]
) {
  if (id == null || !fc?.features?.length) return null;
  return (
    fc.features.find((feature: any) => {
      const candidate = featureId(feature, keys);
      return candidate != null && candidate === id;
    }) ?? null
  );
}

function AutoMapView({
  layers,
  barrages,
  resetViewRequest,
  selectionZoomRequest,
  selectedBasinId,
  selectedSubBasinId,
  selectedBarrageId,
  selectedReachId,
  selectedStationId,
  viewportPadding,
}: {
  layers?: Props["layers"];
  barrages?: FeatureCollection | null;
  resetViewRequest?: ResetViewRequest;
  selectionZoomRequest?: SelectionZoomRequest;
  selectedBasinId?: number | null;
  selectedSubBasinId?: number | null;
  selectedBarrageId?: number | null;
  selectedReachId?: number | null;
  selectedStationId?: number | null;
  viewportPadding?: ViewportPadding;
}) {
  const map = useMap();
  const hasAutoFitOnceRef = useRef(false);
  const lastResetTickRef = useRef<number | null>(null);
  const lastSelectionZoomTickRef = useRef<number | null>(null);
  const dataSignature = [
    layers?.basins?.features?.length ?? 0,
    layers?.subBasins?.features?.length ?? 0,
    layers?.hruSummary?.features?.length ?? 0,
    layers?.reach?.features?.length ?? 0,
    layers?.stations?.features?.length ?? 0,
    barrages?.features?.length ?? 0,
  ].join("|");

  useEffect(() => {
    const hasData =
      (layers?.basins?.features?.length ?? 0) +
        (layers?.subBasins?.features?.length ?? 0) +
        (layers?.hruSummary?.features?.length ?? 0) +
        (layers?.reach?.features?.length ?? 0) +
        (layers?.stations?.features?.length ?? 0) +
        (barrages?.features?.length ?? 0) >
      0;
    if (!hasData) return;

    const tick = resetViewRequest?.tick ?? null;
    const isResetRequest = tick !== null && lastResetTickRef.current !== tick;
    const shouldAutoFit = !hasAutoFitOnceRef.current || isResetRequest;
    if (!shouldAutoFit) return;

    const bounds = collectionBounds([
      layers?.basins,
      layers?.subBasins,
      layers?.hruSummary,
      layers?.reach,
      layers?.stations,
      barrages,
    ]);
    if (!bounds) return;

    if (import.meta.env.DEV) {
      console.debug("[hydro-map] auto-fit bounds", {
        reason: isResetRequest ? "reset" : "initial",
        tick,
      });
    }

    map.fitBounds(bounds, {
      paddingTopLeft: viewportPadding?.topLeft ?? [36, 36],
      paddingBottomRight: viewportPadding?.bottomRight ?? [36, 36],
      maxZoom: 11,
    });
    hasAutoFitOnceRef.current = true;
    if (isResetRequest) lastResetTickRef.current = tick;
  }, [dataSignature, resetViewRequest?.tick, layers, barrages, map, viewportPadding]);

  useEffect(() => {
    const tick = selectionZoomRequest?.tick ?? null;
    if (tick === null || lastSelectionZoomTickRef.current === tick) return;

    const station = findFeatureById(layers?.stations, selectedStationId, [
      "station_id",
      "id",
    ]);
    const reach = findFeatureById(layers?.reach, selectedReachId, ["id", "reach_id"]);
    const barrage = findFeatureById(barrages, selectedBarrageId, ["id", "barrage_id"]);
    const subBasin =
      findFeatureById(layers?.subBasins, selectedSubBasinId, ["id", "subbasin_id"]) ??
      findFeatureById(layers?.hruSummary, selectedSubBasinId, ["id", "subbasin_id", "Subbasin"]);
    const basin = findFeatureById(layers?.basins, selectedBasinId, [
      "id",
      "catchment_id",
    ]);

    const target = station ?? reach ?? subBasin ?? barrage ?? basin;
    if (!target) return;

    const geometryType = String(target?.geometry?.type ?? "");
    if (import.meta.env.DEV) {
      console.debug("[hydro-map] selection zoom", {
        tick,
        stationId: selectedStationId,
        reachId: selectedReachId,
        barrageId: selectedBarrageId,
        subBasinId: selectedSubBasinId,
        basinId: selectedBasinId,
        geometryType,
      });
    }

    if (geometryType.includes("Point")) {
      const coords = target?.geometry?.coordinates;
      const point = Array.isArray(coords?.[0]) ? coords[0] : coords;
      if (Array.isArray(point) && point.length >= 2) {
        const pointBounds = L.latLng(Number(point[1]), Number(point[0])).toBounds(1500);
        map.fitBounds(pointBounds, {
          paddingTopLeft: viewportPadding?.topLeft ?? [42, 42],
          paddingBottomRight: viewportPadding?.bottomRight ?? [42, 42],
          maxZoom: 12,
        });
        lastSelectionZoomTickRef.current = tick;
      }
      return;
    }

    const bounds = featureBounds(target);
    if (bounds) {
      map.fitBounds(bounds, {
        paddingTopLeft: viewportPadding?.topLeft ?? [42, 42],
        paddingBottomRight: viewportPadding?.bottomRight ?? [42, 42],
        maxZoom: 12,
      });
      lastSelectionZoomTickRef.current = tick;
    }
  }, [
    dataSignature,
    layers,
    barrages,
    map,
    selectedBasinId,
    selectedSubBasinId,
    selectedBarrageId,
    selectedReachId,
    selectedStationId,
    selectionZoomRequest?.tick,
    viewportPadding,
  ]);

  return null;
}

function ClickLocationMarker({
  activeTool,
  enabled,
}: {
  activeTool?: "distance" | "area" | null;
  enabled?: boolean;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!enabled || activeTool) return;

    const onClick = (e: L.LeafletMouseEvent) => {
      if (markerRef.current) {
        try {
          map.removeLayer(markerRef.current);
        } catch {}
        markerRef.current = null;
      }

      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      markerRef.current = L.marker(e.latlng)
        .addTo(map)
        .bindPopup(
          `<div style="min-width:180px;"><b>Emplacement</b><br/>Latitude: ${lat}<br/>Longitude: ${lng}</div>`
        );
      markerRef.current.openPopup();
    };

    map.on("click", onClick);

    return () => {
      map.off("click", onClick);
    };
  }, [map, activeTool, enabled]);

  return null;
}

function MouseDebug({ enabled }: { enabled?: boolean }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    const onMove = (e: L.LeafletMouseEvent) => {
      const content = `Lat ${e.latlng.lat.toFixed(5)} | Lng ${e.latlng.lng.toFixed(5)} | Zoom ${map.getZoom()}`;
      if (!markerRef.current) {
        markerRef.current = L.marker(e.latlng, { interactive: false }).addTo(map);
      } else {
        markerRef.current.setLatLng(e.latlng);
      }
      markerRef.current.bindTooltip(content, {
        permanent: true,
        direction: "top",
        className: "leaflet-debug-tooltip",
        offset: [0, -10],
      });
    };

    map.on("mousemove", onMove);
    return () => {
      map.off("mousemove", onMove);
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [enabled, map]);

  return null;
}

function ExportPng({
  req,
  containerSelector,
}: {
  req?: ExportPngRequest;
  containerSelector: string;
}) {
  useMap();

  useEffect(() => {
    if (!req?.tick) return;

    setTimeout(async () => {
      const el = document.querySelector(containerSelector) as HTMLElement | null;
      if (!el) return;

      try {
        const dataUrl = await toPng(el, {
          cacheBust: true,
          pixelRatio: 2, // meilleure qualité
        });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = req.filename ?? "map.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) {
        console.error("Export PNG failed", e);
      }
    }, 250);
  }, [req?.tick, req?.filename, containerSelector]);

  return null;
}

function MeasureTool({ activeTool }: { activeTool?: "distance" | "area" | null }) {
  const map = useMap();
  const ptsRef = useRef<LatLng[]>([]);
  const layerRef = useRef<L.Layer | null>(null);
  const resultRef = useRef<L.Popup | null>(null);

  const active = useMemo(
    () => activeTool === "distance" || activeTool === "area",
    [activeTool]
  );

  useEffect(() => {
    ptsRef.current = [];
    if (layerRef.current) {
      try {
        map.removeLayer(layerRef.current);
      } catch {}
      layerRef.current = null;
    }
    if (resultRef.current) {
      try {
        map.closePopup(resultRef.current);
      } catch {}
      resultRef.current = null;
    }

    if (!active) {
      map.doubleClickZoom.enable();
      map.getContainer().style.cursor = "";
      return;
    }

    map.doubleClickZoom.disable();
    const container = map.getContainer();
    container.style.cursor = "crosshair";

    const commitPoint = (latlng: LatLng) => {
      if (!activeTool) return;

      ptsRef.current.push(latlng);

      if (layerRef.current) {
        try {
          map.removeLayer(layerRef.current);
        } catch {}
        layerRef.current = null;
      }

      if (activeTool === "distance") {
        layerRef.current = L.polyline(ptsRef.current, {
          color: "#0ea5e9",
          weight: 4,
        }).addTo(map);
      } else {
        layerRef.current = L.polygon(ptsRef.current, {
          color: "#f59e0b",
          weight: 3,
          fillColor: "#f59e0b",
          fillOpacity: 0.18,
        }).addTo(map);
      }

      const pts = ptsRef.current;
      const ready =
        (activeTool === "distance" && pts.length >= 2) ||
        (activeTool === "area" && pts.length >= 3);

      if (!ready) return;

      if (resultRef.current) {
        try {
          map.closePopup(resultRef.current);
        } catch {}
        resultRef.current = null;
      }

      const content =
        activeTool === "distance"
          ? `<b>Distance</b><br/>${pts
              .slice(1)
              .reduce((sum, point, index) => sum + haversineKm(pts[index], point), 0)
              .toFixed(3)} km`
          : `<b>Surface</b><br/>${(polygonAreaM2(map, pts) / 1_000_000).toFixed(3)} km²`;

      resultRef.current = L.popup({
        closeButton: true,
        autoClose: true,
        closeOnClick: false,
        className: "measurement-result-popup",
      })
        .setLatLng(latlng)
        .setContent(content)
        .openOn(map);
    };

    const onClick = (event: MouseEvent) => {
      if (!activeTool) return;

      event.preventDefault();
      event.stopPropagation();
      commitPoint(map.mouseEventToLatLng(event));
    };

    const onDblClick = (event: MouseEvent) => {
      if (!activeTool) return;

      event.preventDefault();
      event.stopPropagation();
      ptsRef.current = [];
      if (layerRef.current) {
        try {
          map.removeLayer(layerRef.current);
        } catch {}
        layerRef.current = null;
      }
    };

    container.addEventListener("click", onClick, true);
    container.addEventListener("dblclick", onDblClick, true);

    return () => {
      container.removeEventListener("click", onClick, true);
      container.removeEventListener("dblclick", onDblClick, true);
      map.doubleClickZoom.enable();
      map.getContainer().style.cursor = "";
      if (resultRef.current) {
        try {
          map.closePopup(resultRef.current);
        } catch {}
        resultRef.current = null;
      }
    };
  }, [map, active, activeTool]);

  return null;
}

/* -------------------- MAIN COMPONENT -------------------- */
export function HydroMap({
  className,
  opacity = 1,
  basemap = "satellite_labels",
  displayMode = "raw_database",
  layers,
  barrages,
  thematic,
  zoomToBasinRequest,
  resetViewRequest,
  selectionZoomRequest,
  activeTool,
  exportPngRequest,
  selectedBasinId,
  selectedSubBasinId,
  selectedBarrageId,
  selectedReachId,
  selectedStationId,
  onStationSelect,
  onSubBasinSelect,
  onReachSelect,
  onBarrageSelect,
  debugMode,
  viewportPadding,
}: Props) {
  const o = clamp01(opacity);
  const isProjectMode = displayMode === "project_hassan_addakhil";
  const center: LatLngExpression = [32.1, -4.8];
  const exportSelector = ".leaflet-container";
  const layerKey = (name: string, fc?: FeatureCollection | null) =>
    `${displayMode}-${name}-${fc?.features?.length ?? 0}`;

  // ✅ Styles lisibles (pas flashy)
  const basinsStyle = useMemo(
    () => (feature: any) => {
      const id = Number(feature?.properties?.id);
      const isSelected = Number.isFinite(id) && selectedBasinId != null && id === selectedBasinId;
      return {
        color: isSelected ? "#22C55E" : "#1E3A8A",
        weight: isSelected ? 3.8 : 2,
        opacity: 0.95,
        fillColor: isSelected ? "#16A34A" : "#1E3A8A",
        fillOpacity: isSelected
          ? Math.max(0.24, Math.min(0.38, o * 0.35))
          : Math.max(0.12, Math.min(0.2, o * 0.2)),
      };
    },
    [o, selectedBasinId]
  );

  const subBasinsStyle = useMemo(
    () => (feature: any) => {
      const id = Number(feature?.properties?.id ?? feature?.properties?.subbasin_id);
      const isSelected =
        Number.isFinite(id) && selectedSubBasinId != null && id === selectedSubBasinId;
      return {
        color: isSelected ? "#F59E0B" : "#16A34A",
        weight: isSelected ? 3.2 : 1.5,
        opacity: 0.95,
        fillColor: isSelected ? "#FBBF24" : "#22C55E",
        fillOpacity: isSelected
          ? Math.max(0.3, Math.min(0.42, o * 0.4))
          : Math.max(0.18, Math.min(0.25, o * 0.25)),
      };
    },
    [o, selectedSubBasinId]
  );

  const barragesStyle = useMemo(
    () => (feature: any) => {
      const id = Number(feature?.properties?.id);
      const isSelected =
        Number.isFinite(id) && selectedBarrageId != null && id === selectedBarrageId;
      return {
        color: isSelected ? "#F59E0B" : "#0891B2",
        weight: isSelected ? 3.8 : 2.4,
        opacity: 1,
        fillColor: isSelected ? "#F59E0B" : "#06B6D4",
        fillOpacity: isSelected ? 0.55 : 0.35,
      };
    },
    [selectedBarrageId]
  );

  const reachStyle = useMemo(
    () => (feature: any) => {
      const id = Number(feature?.properties?.id ?? feature?.properties?.reach_id);
      const isSelected =
        Number.isFinite(id) && selectedReachId != null && id === selectedReachId;
      return {
        color: isSelected ? "#F59E0B" : isProjectMode ? "#2563EB" : "#3B82F6",
        weight: isSelected ? 5 : isProjectMode ? 4 : 3,
        opacity: isSelected ? 1 : 0.95,
      };
    },
    [isProjectMode, selectedReachId]
  );

  const hruSummaryStyle = useMemo(
    () => (feature: any) => {
      const id = Number(feature?.properties?.id ?? feature?.properties?.Subbasin ?? feature?.properties?.subbasin_id);
      const isSelected =
        Number.isFinite(id) && selectedSubBasinId != null && id === selectedSubBasinId;
      const className = String(feature?.properties?.DOM_LANDUSE ?? "UNKNOWN");
      const idx = hashToIndex(className, SUBBASIN_PALETTE.length);
      return {
        color: isSelected ? "#F59E0B" : "#7C3AED",
        weight: isSelected ? 3.2 : 2,
        opacity: 0.95,
        fillColor: isSelected ? "#FBBF24" : SUBBASIN_PALETTE[idx] ?? "#A78BFA",
        fillOpacity: isSelected
          ? Math.max(0.34, Math.min(0.48, o * 0.45))
          : Math.max(0.24, Math.min(0.38, o * 0.34)),
      };
    },
    [o, selectedSubBasinId]
  );

  const onEachBasin = useMemo(
    () => (feature: any, layer: Layer) => {
      const p: any = feature?.properties || {};
      const name = p?.name ?? p?.nom ?? `Bassin ${p?.id ?? "hydrologique"}`;
      const areaKm2 = p?.area_km2;
      const areaLabel =
        typeof areaKm2 === "number"
          ? `${areaKm2.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} km2`
          : formatAny(areaKm2);

      (layer as any).bindTooltip(String(name), {
        sticky: true,
        direction: "top",
        opacity: 0.95,
      });
      (layer as any).bindPopup(
        `
        <div style="min-width:260px;max-width:380px;">
          <div style="font-weight:900;font-size:14px;margin-bottom:8px;color:#0f172a;">Bassin : ${formatAny(name)}</div>
          <div style="font-size:12px;color:#334155;line-height:1.55;">
            <div><b>Surface :</b> ${areaLabel}</div>
            <div><b>Sous-bassins :</b> ${formatAny(p?.subbasins_count)}</div>
            <div><b>Stations :</b> ${formatAny(p?.stations_count)}</div>
            <div><b>Reaches :</b> ${formatAny(p?.reaches_count)}</div>
          </div>
        </div>
        `,
        { maxWidth: 420, closeButton: true, autoPan: true }
      );
      layer.on({
        mouseover: () => {
          (layer as any).setStyle({
            weight: 3,
            fillOpacity: Math.min(0.32, Math.max(0.18, o * 0.28)),
          });
          (layer as any).bringToFront?.();
        },
        mouseout: () => {
          (layer as any).setStyle((basinsStyle as any)(feature));
        },
      });
    },
    [o, basinsStyle]
  );

  const onEachReach = useMemo(
    () => (feature: any, layer: Layer) => {
      const p: any = feature?.properties || {};
      const name = p?.reach_name ?? p?.name ?? p?.reach_code ?? `Reach ${p?.id ?? "—"}`;
      const code = p?.reach_code ?? "—";
      const subbasinId = p?.subbasin_id ?? "—";
      const catchmentId = p?.catchment_id ?? "—";

      (layer as any).bindTooltip(`${name} • ${code}`, {
        sticky: true,
        direction: "top",
        opacity: 0.95,
      });

      (layer as any).bindPopup(reachPopupHtml(feature), {
        maxWidth: 560,
        closeButton: true,
        autoPan: true,
      });

      layer.on({
        mouseover: () => {
          (layer as any).setStyle({
            color: selectedReachId === Number(p?.id ?? p?.reach_id) ? "#F59E0B" : "#1D4ED8",
            weight: selectedReachId === Number(p?.id ?? p?.reach_id) ? 5 : 3.5,
            opacity: 1,
          });
          (layer as any).bringToFront?.();
        },
        mouseout: () => {
          (layer as any).setStyle((reachStyle as any)(feature));
        },
        click: () => {
          const reachId = Number(p?.id ?? p?.reach_id);
          const subbasinId = Number(p?.subbasin_id ?? NaN);
          const catchmentId = Number(p?.catchment_id ?? NaN);
          onReachSelect?.({
            reachId,
            name: String(name),
            code: code === "—" ? undefined : String(code),
            subbasinId: Number.isFinite(subbasinId) ? subbasinId : null,
            catchmentId: Number.isFinite(catchmentId) ? catchmentId : null,
            properties: p,
          });
          (layer as any).openPopup?.();
        },
      });
    },
    [onReachSelect, reachStyle, selectedReachId]
  );

  // ✅ popup + hover subbasins
  const onEachSubBasin = useMemo(
    () => (feature: any, layer: Layer) => {
      const name = getFeatureName(feature);
      const id = getFeatureId(feature);
      const p = feature?.properties ?? {};

      (layer as any).bindTooltip(`${name}`, {
        sticky: true,
        direction: "top",
        opacity: 0.95,
      });

      layer.on({
        mouseover: () => {
          (layer as any).setStyle({
            weight: 3.6,
            fillOpacity: Math.min(0.55, Math.max(0.25, o * 0.4)),
          });
          (layer as any).bringToFront?.();
        },
        mouseout: () => {
          (layer as any).setStyle((subBasinsStyle as any)(feature));
        },
        click: () => {
          onSubBasinSelect?.({
            subbasinId: Number(p?.id ?? p?.subbasin_id ?? id),
            name: String(name),
            catchmentId: Number(p?.catchment_id ?? p?.catchment ?? p?.basin_id ?? null),
            properties: p,
          });
        },
      });
    },
    [o, subBasinsStyle, onSubBasinSelect]
  );

  const onEachHruSummary = useMemo(
    () => (feature: any, layer: Layer) => {
      const p: any = feature?.properties || {};
      const subbasinId = Number(p.id ?? p.Subbasin ?? p.subbasin_id ?? NaN);
      const title = p.name ?? `Subbasin ${p.Subbasin ?? p.id ?? "-"}`;
      const landuse = p.DOM_LANDUSE ?? "-";
      const soil = p.DOM_SOIL ?? "-";
      const slope = p.DOM_SLOPE_BAND ?? "-";
      const area = p.AREA_HA_TOTAL ?? "-";
      const hruCount = p.HRU_COUNT ?? "-";

      (layer as any).bindTooltip(`${title} • ${landuse}`, {
        sticky: true,
        direction: "top",
        opacity: 0.95,
      });

      (layer as any).bindPopup(
        `
        <div style="min-width:280px;max-width:420px;">
          <div style="font-weight:800;font-size:14px;margin-bottom:8px;">${title}</div>
          <div style="font-size:12px;line-height:1.5;color:#334155;">
            <div><b>HRU count:</b> ${formatAny(hruCount)}</div>
            <div><b>Area total (ha):</b> ${formatAny(area)}</div>
            <div><b>Dominant LULC:</b> ${formatAny(landuse)} (${formatAny(p.DOM_LANDUSE_PCT)}%)</div>
            <div><b>Dominant SOIL:</b> ${formatAny(soil)} (${formatAny(p.DOM_SOIL_PCT)}%)</div>
            <div><b>Dominant SLOPE:</b> ${formatAny(slope)} (${formatAny(p.DOM_SLOPE_BAND_PCT)}%)</div>
          </div>
        </div>
        `
      );

      layer.on({
        mouseover: () => {
          (layer as any).setStyle({
            weight: 3.2,
            fillOpacity: Math.min(0.52, Math.max(0.3, o * 0.45)),
          });
          (layer as any).bringToFront?.();
        },
        mouseout: () => {
          (layer as any).setStyle((hruSummaryStyle as any)(feature));
        },
        click: () => {
          if (!Number.isFinite(subbasinId)) return;
          onSubBasinSelect?.({
            subbasinId,
            name: String(title),
            catchmentId: Number.isFinite(Number(p.catchment_id))
              ? Number(p.catchment_id)
              : null,
            properties: p,
          });
          (layer as any).openPopup?.();
        },
      });
    },
    [o, hruSummaryStyle, onSubBasinSelect]
  );

  return (
    <div className={className}>
      <MapContainer
        {...({
          style: { height: "100%", width: "100%" },
          center,
          zoom: 7,
          scrollWheelZoom: true,
        } as any)}
      >
        <CreatePanes />

        <BasemapLayers basemap={basemap} />

        {zoomToBasinRequest && (
          <ZoomToBasin barrages={barrages} basins={layers?.basins} req={zoomToBasinRequest} />
        )}

        <AutoMapView
          layers={layers}
          barrages={barrages}
          resetViewRequest={resetViewRequest}
          selectionZoomRequest={selectionZoomRequest}
          selectedBasinId={selectedBasinId}
          selectedSubBasinId={selectedSubBasinId}
          selectedBarrageId={selectedBarrageId}
          selectedReachId={selectedReachId}
          selectedStationId={selectedStationId}
          viewportPadding={viewportPadding}
        />

        {exportPngRequest && (
          <ExportPng req={exportPngRequest} containerSelector={exportSelector} />
        )}

        <MeasureTool activeTool={activeTool} />
        <ClickLocationMarker activeTool={activeTool} enabled={debugMode} />
        <MouseDebug enabled={debugMode} />

        {barrages && (
          <GeoJSON
            key={layerKey("barrages", barrages)}
            {...({
              data: barrages as any,
              style: barragesStyle,
              pane: "barragesPane",
              pointToLayer: (feature: any, latlng: any) => {
                const id = Number(feature?.properties?.id);
                const isSelected =
                  Number.isFinite(id) &&
                  selectedBarrageId != null &&
                  id === selectedBarrageId;

                if (isProjectMode) {
                  return L.circleMarker(latlng, {
                    radius: isSelected ? 12 : 11,
                    color: "#ffffff",
                    weight: isSelected ? 4 : 3,
                    opacity: 1,
                    fillColor: isSelected ? "#06B6D4" : "#22D3EE",
                    fillOpacity: 0.96,
                    pane: "barragesPane",
                  });
                }

                return L.circleMarker(latlng, {
                  radius: isSelected ? 9 : 7,
                  color: isSelected ? "#F59E0B" : "#0891B2",
                  weight: isSelected ? 3 : 2,
                  opacity: 1,
                  fillColor: isSelected ? "#FBBF24" : "#06B6D4",
                  fillOpacity: isSelected ? 0.9 : 0.72,
                  pane: "barragesPane",
                });
              },
              onEachFeature: (feature: any, layer: Layer) => {
                const p = feature?.properties ?? {};
                const name = p.name ?? "Barrage";
                const rows = Object.entries(p)
                  .map(
                    ([k, v]) =>
                      `<div><b>${prettyKey(k)}:</b> ${formatAny(v)}</div>`
                  )
                  .join("");

                (layer as any).bindPopup(
                  `<div style="min-width:220px"><div style="font-weight:700;margin-bottom:8px">${name}</div>${rows}</div>`
                );

                layer.on({
                  click: () => {
                    const barrageId = Number(p.id ?? p.barrage_id);
                    if (!Number.isFinite(barrageId)) return;
                    onBarrageSelect?.({
                      barrageId,
                      name: String(name),
                      catchmentId: Number.isFinite(Number(p.catchment_id)) ? Number(p.catchment_id) : null,
                      properties: p,
                    });
                  },
                  mouseover: () => {
                    const anyLayer = layer as any;
                    if (typeof anyLayer.setStyle === "function") {
                      if (isProjectMode) {
                        const hoveredId = Number(feature?.properties?.id);
                        const isSelectedHovered =
                          Number.isFinite(hoveredId) &&
                          selectedBarrageId != null &&
                          hoveredId === selectedBarrageId;
                        anyLayer.setStyle({
                          radius: isSelectedHovered ? 13 : 12,
                          color: "#ffffff",
                          weight: isSelectedHovered ? 4 : 3,
                          fillColor: isSelectedHovered ? "#06B6D4" : "#22D3EE",
                          fillOpacity: 1,
                        });
                      } else {
                        anyLayer.setStyle({ weight: 3.5, fillOpacity: 1 });
                      }
                    }
                    anyLayer.bringToFront?.();
                  },
                  mouseout: () => {
                    const anyLayer = layer as any;
                    const id = Number(feature?.properties?.id);
                    const isSelected =
                      Number.isFinite(id) &&
                      selectedBarrageId != null &&
                      id === selectedBarrageId;
                    if (typeof anyLayer.setStyle === "function") {
                      if (isProjectMode) {
                        anyLayer.setStyle({
                          radius: isSelected ? 12 : 11,
                          color: "#ffffff",
                          weight: isSelected ? 4 : 3,
                          fillColor: isSelected ? "#06B6D4" : "#22D3EE",
                          fillOpacity: 0.96,
                        });
                      } else {
                        anyLayer.setStyle({
                          radius: isSelected ? 9 : 7,
                          color: isSelected ? "#F59E0B" : "#0891B2",
                          weight: isSelected ? 3 : 2,
                          fillColor: isSelected ? "#FBBF24" : "#06B6D4",
                          fillOpacity: isSelected ? 0.9 : 0.72,
                        });
                      }
                    }
                  },
                });
              },
            } as any)}
          />
        )}

        {/* BASINS */}
        {layers?.basins && (
          <GeoJSON
            key={layerKey("basins", layers.basins)}
            {...({
              data: layers.basins as any,
              style: basinsStyle,
              onEachFeature: onEachBasin,
              pane: "basinsPane",
            } as any)}
          />
        )}

        {/* SUBBASINS */}
        {layers?.subBasins && (
          <GeoJSON
            key={layerKey("subbasins", layers.subBasins)}
            {...({
              data: layers.subBasins as any,
              style: subBasinsStyle,
              onEachFeature: onEachSubBasin,
              pane: "subBasinsPane",
            } as any)}
          />
        )}

        {/* HRU SUMMARY (LULC/SOL/PENTE dominants par sous-bassin) */}
        {layers?.hruSummary && (
          <GeoJSON
            key={layerKey("hru-summary", layers.hruSummary)}
            {...({
              data: layers.hruSummary as any,
              style: hruSummaryStyle,
              onEachFeature: onEachHruSummary,
              pane: "hruPane",
            } as any)}
          />
        )}

        {/* REACH */}
        {layers?.reach && (
          <GeoJSON
            key={layerKey("reach", layers.reach)}
            {...({
              data: layers.reach as any,
              style: reachStyle,
              onEachFeature: onEachReach,
              pane: "reachPane",
            } as any)}
          />
        )}

        {/* STATIONS */}
        {layers?.stations && (
          <GeoJSON
            key={layerKey("stations", layers.stations)}
            {...({
              data: layers.stations as any,
              pane: "stationsPane",
              pointToLayer: (feature: any, latlng: any) => {
                const p: any = feature?.properties || {};
                const stationId = Number(p.station_id ?? p.id);
                const isSelected =
                  Number.isFinite(stationId) &&
                  selectedStationId != null &&
                  stationId === selectedStationId;
                const val = thematic?.stationValues?.get(stationId) ?? null;
                const stationType = String(p.station_type_code ?? p.type_station ?? "").toLowerCase();
                const baseRadius = 8;

                // ✅ defaults (visible)
                let fill = "#F97316";
                let stroke = "#ffffff";
                let radius = baseRadius;

                if (!thematic) {
                  if (stationType.includes("meteo") || stationType.includes("météo")) {
                    fill = "#F97316";
                    stroke = "#ffffff";
                    radius = 8;
                  } else if (stationType.includes("hydro") || stationType.includes("hydrolog")) {
                    fill = "#F97316";
                    stroke = "#ffffff";
                  }
                }

                // ✅ thematic
                if (
                  thematic &&
                  typeof val === "number" &&
                  Number.isFinite(val) &&
                  thematic.min !== null &&
                  thematic.max !== null
                ) {
                  const cls = valueToClass(val, thematic.min, thematic.max, thematic.colors.length);
                  fill = thematic.colors[cls] ?? thematic.colors[0] ?? fill;
                  radius = 8;
                } else if (val === null && thematic) {
                  // no data
                  fill = "#94a3b8";
                  stroke = "#334155";
                }

                const halo = L.circleMarker(latlng, {
                  radius: radius + (isSelected ? 8 : 5),
                  weight: 0,
                  color: isSelected ? "#0EA5E9" : "#F97316",
                  opacity: isSelected ? 0.9 : 0,
                  fillColor: isSelected ? "#0EA5E9" : "#F97316",
                  fillOpacity: isSelected ? 0.3 : 0.22,
                  interactive: false,
                  pane: "stationsPane",
                });

                const core = L.circleMarker(latlng, {
                  radius: isSelected ? radius + 2 : radius,
                  weight: isSelected ? 3 : 2,
                  color: isSelected ? "#0F172A" : stroke,
                  opacity: 1,
                  fillColor: fill,
                  fillOpacity: 1,
                  pane: "stationsPane",
                });

                const group = L.featureGroup([halo, core]) as any;
                group.__hydroBaseRadius = radius;
                return group;
              },

              onEachFeature: (feature: any, layer: Layer) => {
                const p: any = feature?.properties || {};
                const stationId = Number(p.station_id ?? p.id);
                const code = p.station_code ?? "-";
                const name = p.station_label ?? formatStationDisplayName(p.station_name ?? p.name ?? "Station", code);
                const kind = p.station_type_code ?? p.type_station ?? "";
                const label = kind ? `${name} • ${kind}` : name;

                const val = thematic?.stationValues?.get(stationId) ?? null;
                const valHtml =
                  typeof val === "number" && Number.isFinite(val) && thematic
                    ? fmt(val, thematic.unit)
                    : thematic
                    ? "Aucune donnée"
                    : "";

                const anyLayer = layer as any;
                const baseRadius = anyLayer.__hydroBaseRadius ?? 8;
                const children = anyLayer.getLayers?.() || [];
                const halo = children[0];
                const core = children[1];

                anyLayer.bindTooltip(thematic ? `${label} • ${valHtml}` : label, {
                  sticky: true,
                  direction: "top",
                  opacity: 0.98,
                  className: "station-tooltip",
                });

                anyLayer.on("mouseover", () => {
                  if (halo?.setStyle) {
                    halo.setStyle({ fillOpacity: 0.35, opacity: 0.95 });
                  }
                  if (core?.setRadius) {
                    core.setRadius(baseRadius + 1);
                  }
                  anyLayer.openTooltip?.();
                  const map = anyLayer._map as L.Map | undefined;
                  if (map) map.getContainer().style.cursor = "pointer";
                });

                anyLayer.on("mouseout", () => {
                  if (halo?.setStyle) {
                    halo.setStyle({
                      fillOpacity: stationId === selectedStationId ? 0.3 : 0.22,
                      opacity: stationId === selectedStationId ? 0.9 : 0,
                    });
                  }
                  if (core?.setRadius) {
                    core.setRadius(stationId === selectedStationId ? baseRadius + 2 : baseRadius);
                  }
                  const map = anyLayer._map as L.Map | undefined;
                  if (map) map.getContainer().style.cursor = "";
                });

                anyLayer.on("add", () => {
                  const children = anyLayer.getLayers?.() || [];
                  for (const child of children) {
                    child?.bringToFront?.();
                  }
                  anyLayer.bringToFront?.();
                });
                anyLayer.on("click", () => {
                  onStationSelect?.({
                    stationId,
                    name,
                    code,
                    catchmentId: Number(p?.catchment_id ?? null),
                    stationType: kind || null,
                    properties: p,
                  });
                });
              },
            } as any)}
          />
        )}
      </MapContainer>
    </div>
  );
}
