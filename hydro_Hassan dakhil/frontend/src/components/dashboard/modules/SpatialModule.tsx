// frontend/src/components/dashboard/modules/SpatialModule.tsx
import { type PointerEvent as ReactPointerEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HydroMap } from "@/components/map/HydroMap";
import { SpatialInspectorPanel, type SpatialInspectorSelection } from "@/components/dashboard/modules/SpatialInspectorPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Ruler,
  Download,
  Eye,
  MapPin,
  Landmark,
  Waves,
  Grid3X3,
  Search,
  Maximize2,
  Minimize2,
  Move,
  PanelLeftOpen,
  Plus,
  Minus,
  X,
  Map,
  Info,
  Loader2,
} from "lucide-react";
import { BASEMAPS, DEFAULT_BASEMAP, type BasemapId } from "@/config/basemaps";
import { formatStationDisplayName, formatSubbasinDisplayName } from "@/lib/stationLabels";
import type { SpatialDisplayMode } from "@/types/spatial";
import { HASSAN_ADDAKHIL_STATION_IDS } from "@/constants/projectStations";
import { ThematicSubbasinPanel } from "./ThematicSubbasinPanel";
import { ThematicReachPanel } from "./ThematicReachPanel";
import { ThematicLegend } from "@/components/map/ThematicLegend";
import type { ThematicLayerConfig } from "@/types/thematic";

import {
  fetchBasins,
  fetchBarrages,
  fetchProjectHassanAddakhil,
  fetchSubBasins,
  fetchSubbasinHruSummary,
  fetchNvStreamNetwork,
  normalizeNvStreamReachCollection,
  fetchReaches,
  fetchStations,
  type FeatureCollection,
  type ProjectSpatialData,
} from "@/api/spatial";

type BasinOption = { id: number; name: string };
type BarrageOption = { id: number; name: string };
type SubBasinOption = { id: number; name: string; catchment_id?: number };
type StationOption = { id: number; name: string; code?: string };
type ReachOption = {
  id: number;
  name: string;
  code?: string;
  subbasinId?: number;
  catchmentId?: number;
};
type EntityControlOption = { id: number; label: string; meta?: string };
type ManagedLayerKey = "barrages" | "basins" | "subBasins" | "reach" | "stations";

const ALL = "__ALL__";
const BARRAGE_NAME = "Barrage Hassan Addakhil";
const BASEMAP_STORAGE_KEY = "hydro-basemap";
const PROJECT_STATION_IDS = HASSAN_ADDAKHIL_STATION_IDS;
const PROJECT_BASIN_ID = 1;
const PROJECT_BASIN_LABEL = "Bassin versant du barrage Hassan Addakhil";

function isBasemapId(value: string): value is BasemapId {
  return Object.prototype.hasOwnProperty.call(BASEMAPS, value);
}

function EntityControlCard({
  title,
  helper,
  icon,
  iconColorClass = "text-slate-700",
  visible,
  count,
  selectedValue,
  options,
  placeholder,
  onToggleVisibility,
  onSelect,
}: {
  title: string;
  helper: string;
  icon: ReactNode;
  iconColorClass?: string;
  visible: boolean;
  count: number;
  selectedValue: string;
  options: EntityControlOption[];
  placeholder: string;
  onToggleVisibility: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className={`shrink-0 ${iconColorClass}`}>{icon}</div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-900 truncate">{title}</div>
            <div className="text-[10px] text-slate-500 truncate">{helper}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">{count}</span>
          <Checkbox checked={visible} onCheckedChange={onToggleVisibility} className="h-4 w-4" />
        </div>
      </div>

      <Select value={selectedValue === "" ? ALL : selectedValue} onValueChange={onSelect} disabled={!options.length}>
        <SelectTrigger className="relative h-9 w-full bg-white pl-8 text-xs">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={String(option.id)} className="text-xs">
              {option.meta ? `${option.label} (${option.meta})` : option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FloatingPanel({
  title,
  icon,
  anchor,
  widthClass,
  onClose,
  children,
}: {
  title: string;
  icon: ReactNode;
  anchor: "left" | "right";
  widthClass: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement | null>(null);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, select, input, textarea, [role='combobox'], [data-radix-select-trigger]")) {
      return;
    }
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = offset;
    event.currentTarget.setPointerCapture(event.pointerId);

    const move = (moveEvent: PointerEvent) => {
      setOffset({
        x: initial.x + moveEvent.clientX - startX,
        y: initial.y + moveEvent.clientY - startY,
      });
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  return (
    <div
      ref={panelRef}
      className={`absolute top-16 z-[450] max-h-[calc(100%-5rem)] ${widthClass} resize-x overflow-auto ${
        anchor === "left" ? "left-4" : "right-4"
      }`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <Card className="border-white/60 bg-white/60 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
      <CardHeader
        className="cursor-move select-none border-b border-white/50 px-3 py-2"
        onPointerDown={startDrag}
      >
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            {icon}
            {title}
          </CardTitle>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Move className="h-3.5 w-3.5" />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-3">{children}</CardContent>
      </Card>
    </div>
  );
}

export function OperationalSpatialModule() {
  const { t } = useTranslation();
  const [displayMode, setDisplayMode] =
    useState<SpatialDisplayMode>("project_hassan_addakhil");
  const [basemap, setBasemap] = useState<BasemapId>(() => {
    if (typeof window === "undefined") return DEFAULT_BASEMAP;
    const saved = window.localStorage.getItem(BASEMAP_STORAGE_KEY);
    if (saved && isBasemapId(saved)) return saved;
    return DEFAULT_BASEMAP;
  });
  const [debugMode, setDebugMode] = useState(false);

  // couches
  const [leftSidebarLayers, setLeftSidebarLayers] = useState({
    barrages: true,
    basins: true,
    subBasins: true,
    reach: true,
    stations: true,
  });

  const [opacityPct, setOpacityPct] = useState([80]);
  const opacity = opacityPct[0] / 100;

  const [activeTool, setActiveTool] = useState<"distance" | "area" | null>(null);

  // cartes thématiques
  const [thematicLayers, setThematicLayers] = useState<ThematicLayerConfig[]>([]);
  const [activeThematicTab, setActiveThematicTab] = useState<"none" | "subbasin" | "reach">("none");

  // tick zoom bassin
  const [zoomTick, setZoomTick] = useState(0);
  const [resetViewTick, setResetViewTick] = useState(0);

  // tick export png
  const [exportTick, setExportTick] = useState(0);

  // geojson
  const [basinsFC, setBasinsFC] = useState<FeatureCollection | null>(null);
  const [barragesFC, setBarragesFC] = useState<FeatureCollection | null>(null);
  const [subBasinsFC, setSubBasinsFC] = useState<FeatureCollection | null>(null);
  const [reachesFC, setReachesFC] = useState<FeatureCollection | null>(null);
  const [stationsFC, setStationsFC] = useState<FeatureCollection | null>(null);
  const [projectData, setProjectData] = useState<ProjectSpatialData | null>(null);
  const [hruSummaryFC, setHruSummaryFC] = useState<FeatureCollection | null>(null);
  const [nvStreamFC, setNvStreamFC] = useState<FeatureCollection | null>(null);

  // options + filtres
  const [basinOptions, setBasinOptions] = useState<BasinOption[]>([]);
  const [barrageOptions, setBarrageOptions] = useState<BarrageOption[]>([]);
  const [allSubBasinOptions, setAllSubBasinOptions] = useState<SubBasinOption[]>([]);
  const [stationOptions, setStationOptions] = useState<StationOption[]>([]);
  const [reachOptions, setReachOptions] = useState<ReachOption[]>([]);
  const [selectedBasinId, setSelectedBasinId] = useState<string>("");
  const [selectedBarrageId, setSelectedBarrageId] = useState<string>(""); // "" = tous les barrages
  const [selectedSubBasinId, setSelectedSubBasinId] = useState<string>(""); // "" = aucun filtre
  const [selectedReachId, setSelectedReachId] = useState<string>("");
  const [selectedStationId, setSelectedStationId] = useState<string>(""); // "" = toutes les stations
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(true);
  const [mapOnlyMode, setMapOnlyMode] = useState(false);
  const [inspectorSelection, setInspectorSelection] = useState<SpatialInspectorSelection | null>(null);
  const [inspectorPopupScale, setInspectorPopupScale] = useState(1);
  const inspectorPopupRef = useRef<HTMLDivElement | null>(null);
  const inspectorPopupOffsetRef = useRef({ x: 0, y: 0 });

  const toggleLayer = (layer: keyof typeof leftSidebarLayers) => {
    setLeftSidebarLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  useEffect(() => {
    window.localStorage.setItem(BASEMAP_STORAGE_KEY, basemap);
  }, [basemap]);

  const isRawMode = displayMode === "raw_database";
  const isProjectMode = displayMode === "project_hassan_addakhil";

  const resetSelections = useCallback((mode: SpatialDisplayMode = displayMode) => {
    void mode;
    setSelectedBasinId("");
    setSelectedBarrageId("");
    setSelectedSubBasinId("");
    setSelectedReachId("");
    setSelectedStationId("");
    setInspectorSelection(null);
    setInspectorPopupScale(1);
    inspectorPopupOffsetRef.current = { x: 0, y: 0 };
    if (inspectorPopupRef.current) {
      inspectorPopupRef.current.style.transform = "translate(0px, 0px) scale(1)";
    }
    setResetViewTick((tick) => tick + 1);
  }, [displayMode]);

  const startInspectorDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = inspectorPopupOffsetRef.current;
    let rafId = 0;

    const applyTransform = () => {
      if (!inspectorPopupRef.current) return;
      const { x, y } = inspectorPopupOffsetRef.current;
      inspectorPopupRef.current.style.transform = `translate(${x}px, ${y}px) scale(${inspectorPopupScale})`;
    };

    const move = (moveEvent: PointerEvent) => {
      inspectorPopupOffsetRef.current = {
        x: initial.x + moveEvent.clientX - startX,
        y: initial.y + moveEvent.clientY - startY,
      };
      if (rafId) cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(applyTransform);
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      if (rafId) cancelAnimationFrame(rafId);
      applyTransform();
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  useEffect(() => {
    if (!inspectorPopupRef.current) return;
    const { x, y } = inspectorPopupOffsetRef.current;
    inspectorPopupRef.current.style.transform = `translate(${x}px, ${y}px) scale(${inspectorPopupScale})`;
  }, [inspectorPopupScale]);

  const focusBasin = (value: string) => {
    setSelectedBasinId(value === ALL ? "" : value);
    setSelectedBarrageId("");
    setSelectedSubBasinId("");
    setSelectedReachId("");
    setSelectedStationId("");
    setInspectorSelection(null);
  };

  const focusBarrage = (value: string) => {
    const nextValue = value === ALL ? "" : value;
    setSelectedBasinId("");
    setSelectedBarrageId(nextValue);
    setSelectedSubBasinId("");
    setSelectedReachId("");
    setSelectedStationId("");
    setInspectorSelection(nextValue ? buildBarrageSelection(Number(nextValue)) : null);
  };

  const focusSubBasin = (value: string) => {
    const nextValue = value === ALL ? "" : value;
    setSelectedBasinId("");
    setSelectedBarrageId("");
    setSelectedSubBasinId(nextValue);
    setSelectedStationId("");
    if (nextValue) {
      const subId = Number(nextValue);
      const linkedReach = availableReaches.find((reach) => reach.subbasinId === subId);
      setSelectedReachId(linkedReach ? String(linkedReach.id) : "");
      setLeftSidebarLayers((prev) => (prev.reach ? prev : { ...prev, reach: true }));
    } else {
      setSelectedReachId("");
    }
    setInspectorSelection(nextValue ? buildSubBasinSelection(Number(nextValue)) : null);
  };

  const focusStation = (value: string) => {
    const nextValue = value === ALL ? "" : value;
    setSelectedBasinId("");
    setSelectedBarrageId("");
    setSelectedSubBasinId("");
    setSelectedReachId("");
    setSelectedStationId(nextValue);
    setInspectorSelection(nextValue ? buildStationSelection(Number(nextValue)) : null);
  };

  const focusReach = (value: string) => {
    const nextValue = value === ALL ? "" : value;
    setSelectedBasinId("");
    setSelectedBarrageId("");
    setSelectedSubBasinId("");
    setSelectedReachId(nextValue);
    setSelectedStationId("");
    setInspectorSelection(nextValue ? buildReachSelection(Number(nextValue)) : null);
  };

  const changeDisplayMode = (value: SpatialDisplayMode) => {
    setDisplayMode(value);
    resetSelections(value);
  };

  const layerItems = useMemo(
    () => [
      { id: "barrages" as const, label: t("spatial.layers.barrages"), icon: Landmark },
      { id: "basins" as const, label: t("spatial.layers.basins"), icon: Grid3X3 },
      { id: "subBasins" as const, label: t("spatial.layers.subbasins"), icon: Grid3X3 },
      { id: "reach" as const, label: t("spatial.layers.reach"), icon: Waves },
      { id: "stations" as const, label: t("spatial.layers.stations"), icon: MapPin },
    ],
    [t]
  );

  const availableBasins = useMemo(() => {
    if (isProjectMode) {
      return [{ id: PROJECT_BASIN_ID, name: PROJECT_BASIN_LABEL }];
    }
    return basinOptions;
  }, [isProjectMode, projectData, basinOptions]);

  const availableBarrages = useMemo(() => {
    if (isProjectMode) {
      const features = projectData?.barrages?.features ?? [];
      const list = features
        .map((f) => ({
          id: Number(f?.properties?.id),
          name: String(f?.properties?.name ?? BARRAGE_NAME),
        }))
        .filter((x) => Number.isFinite(x.id))
        .sort((a, b) => a.name.localeCompare(b.name));
      return list.length ? list : barrageOptions;
    }
    return barrageOptions;
  }, [isProjectMode, projectData, barrageOptions]);

  const availableSubBasins = useMemo(() => {
    if (isProjectMode) {
      const features = projectData?.subbasins?.features ?? [];
      const list = features
        .map((f) => ({
          id: Number(f?.properties?.id),
          name: formatSubbasinDisplayName(
            String(f?.properties?.name ?? ""),
            String(f?.properties?.subbasin_code ?? ""),
            String(f?.properties?.id ?? ""),
          ),
          catchment_id: Number(f?.properties?.catchment_id ?? PROJECT_BASIN_ID),
        }))
        .filter((x) => Number.isFinite(x.id))
        .sort((a, b) => a.name.localeCompare(b.name));
      return list.length ? list : allSubBasinOptions;
    }
    return allSubBasinOptions;
  }, [isProjectMode, projectData, allSubBasinOptions]);

  const availableStations = useMemo(() => {
    if (isProjectMode) {
      const features = projectData?.stations?.features ?? [];
      const list = features
        .map((f) => {
          const p = f?.properties ?? {};
          const id = Number(p.station_id ?? p.id);
          return {
            id,
            name: formatStationDisplayName(
              String(p.station_name ?? p.name ?? `Station ${id}`),
              p.station_code ? String(p.station_code) : undefined,
            ),
            code: p.station_code ? String(p.station_code) : undefined,
          };
        })
        .filter((x) => Number.isFinite(x.id))
        .sort((a, b) => a.name.localeCompare(b.name));
      return list.length ? list : stationOptions;
    }
    return stationOptions;
  }, [isProjectMode, projectData, stationOptions]);

  // ===== 1) Load raw layers when the raw mode is active =====
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const basins = await fetchBasins();
        if (cancelled) return;
        setBasinsFC(basins);

        const opts: BasinOption[] = basins.features
          .map((f) => ({
            id: Number(f?.properties?.id),
            name: String(f?.properties?.name ?? `Basin ${f?.properties?.id}`),
          }))
          .filter((x) => Number.isFinite(x.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        setBasinOptions(opts);
      } catch (e) {
        console.error("fetchBasins failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isRawMode]);

  useEffect(() => {
    if (!isRawMode) return;

    let cancelled = false;

    (async () => {
      try {
        const barrages = await fetchBarrages();
        if (cancelled) return;
        setBarragesFC(barrages);

        const opts: BarrageOption[] = barrages.features
          .map((f) => ({
            id: Number(f?.properties?.id),
            name: String(f?.properties?.name ?? `Barrage ${f?.properties?.id}`),
          }))
          .filter((x) => Number.isFinite(x.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        setBarrageOptions(opts);
      } catch (e) {
        console.error("fetchBarrages failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isRawMode]);

  useEffect(() => {
    if (!isRawMode) return;

    let cancelled = false;

    (async () => {
      try {
        const basinIdNum = selectedBasinId ? Number(selectedBasinId) : undefined;
        const barrageIdNum = selectedBarrageId ? Number(selectedBarrageId) : undefined;

        const subbasins = await fetchSubBasins({
          ...(basinIdNum ? { catchmentId: basinIdNum } : {}),
          ...(barrageIdNum ? { barrageId: barrageIdNum } : {}),
        });

        if (cancelled) return;
        setSubBasinsFC(subbasins);

        const opts: SubBasinOption[] = subbasins.features
        .map((f) => ({
          id: Number(f?.properties?.id),
          name: formatSubbasinDisplayName(
            String(f?.properties?.name ?? ""),
            String(f?.properties?.subbasin_code ?? ""),
            String(f?.properties?.id ?? ""),
          ),
          catchment_id: Number(f?.properties?.catchment_id ?? PROJECT_BASIN_ID),
        }))
          .filter((x) => Number.isFinite(x.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        const currentSubBasinId = selectedSubBasinId ? Number(selectedSubBasinId) : null;
        const currentIsValid =
          currentSubBasinId != null && opts.some((item) => item.id === currentSubBasinId);
        if (!currentIsValid) {
          setSelectedSubBasinId("");
        }

        if (import.meta.env.DEV) {
          console.debug("[spatial] subbasins loaded for map", {
            selectedBasinId,
            selectedBarrageId,
            count: opts.length,
          });
        }
      } catch (e) {
        console.error("fetchSubBasins failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isRawMode, selectedBasinId, selectedBarrageId]);

  useEffect(() => {
    if (!isRawMode) return;

    let cancelled = false;

    (async () => {
      try {
        const [subbasins, stations, reaches] = await Promise.all([
          fetchSubBasins(),
          fetchStations(),
          fetchReaches(),
        ]);
        if (cancelled) return;

        const allSubbasinOpts: SubBasinOption[] = subbasins.features
          .map((f) => ({
            id: Number(f?.properties?.id),
            name: formatSubbasinDisplayName(
            String(f?.properties?.name ?? ""),
            String(f?.properties?.subbasin_code ?? ""),
            String(f?.properties?.id ?? ""),
          ),
            catchment_id: Number(f?.properties?.catchment_id ?? PROJECT_BASIN_ID),
          }))
          .filter((x) => Number.isFinite(x.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        const allStationOpts: StationOption[] = stations.features
          .map((f) => {
            const p = f?.properties ?? {};
            const id = Number(p.id ?? p.station_id);
            return {
              id,
              name: formatStationDisplayName(
                String(p.name ?? p.station_name ?? `Station ${id}`),
                p.station_code ? String(p.station_code) : undefined,
              ),
              code: p.station_code ? String(p.station_code) : undefined,
            };
          })
          .filter((x) => Number.isFinite(x.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        const allReachOpts: ReachOption[] = reaches.features
          .map((f) => {
            const p = f?.properties ?? {};
            const id = Number(p.id ?? p.reach_id);
            const code = p.reach_code ? String(p.reach_code) : undefined;
            return {
              id,
              name: code ? `Troncon ${code}` : `Troncon ${id}`,
              code,
              subbasinId: Number(p.subbasin_id ?? NaN),
              catchmentId: Number(p.catchment_id ?? NaN),
            };
          })
          .filter((x) => Number.isFinite(x.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        setAllSubBasinOptions(allSubbasinOpts);
        setStationOptions(allStationOpts);
        setReachOptions(allReachOpts);

        if (import.meta.env.DEV) {
          console.debug("[spatial] catalog options loaded", {
            subbasins: allSubbasinOpts.length,
            stations: allStationOpts.length,
            reaches: allReachOpts.length,
          });
        }
      } catch (e) {
        console.error("fetch spatial catalogs failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isRawMode]);

  useEffect(() => {
    if (!isRawMode) return;

    let cancelled = false;

    (async () => {
      try {
        const subIdNum = selectedSubBasinId ? Number(selectedSubBasinId) : undefined;

        const basinIdNum = selectedBasinId ? Number(selectedBasinId) : undefined;
        const reaches = await fetchReaches({
          ...(subIdNum ? { subbasinId: subIdNum } : {}),
          ...(basinIdNum ? { catchmentId: basinIdNum } : {}),
        });

        if (!cancelled) {
          setReachesFC(reaches);
        }
      } catch (e) {
        console.error("fetchReaches failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isRawMode, selectedBasinId, selectedSubBasinId]);

  useEffect(() => {
    if (!isRawMode) return;

    let cancelled = false;

    (async () => {
      try {
        const basinIdNum = selectedBasinId ? Number(selectedBasinId) : undefined;

        const stations = await fetchStations(
          basinIdNum ? { catchmentId: basinIdNum } : undefined
        );

        if (!cancelled) {
          setStationsFC(stations);
        }
      } catch (e) {
        console.error("fetchStations failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isRawMode, selectedBasinId]);

  // ===== project mode layers =====
  useEffect(() => {
    if (!isProjectMode) return;

    let cancelled = false;

    (async () => {
      try {
        const [data, hruSummary, nvStream] = await Promise.all([
          fetchProjectHassanAddakhil(),
          fetchSubbasinHruSummary(),
          fetchNvStreamNetwork(),
        ]);
        if (!cancelled) {
          setProjectData(data);
          setHruSummaryFC(hruSummary);
          setNvStreamFC(nvStream);
        }
      } catch (e) {
        console.error("fetchProjectHassanAddakhil failed", e);
      }
    })();

    return () => {
      cancelled = true;
      setHruSummaryFC(null);
      setNvStreamFC(null);
    };
  }, [isProjectMode]);

  const projectReachMapFC = useMemo(() => {
    if (!isProjectMode || !nvStreamFC) return null;
    return normalizeNvStreamReachCollection(nvStreamFC, projectData?.reaches ?? null);
  }, [isProjectMode, nvStreamFC, projectData?.reaches]);

  const visibleBasinsFC = isProjectMode ? projectData?.basins ?? null : basinsFC;
  const visibleSubBasinsFC = isProjectMode ? projectData?.subbasins ?? null : subBasinsFC;
  const visibleSubBasinMapFC = isProjectMode
    ? hruSummaryFC ?? visibleSubBasinsFC
    : visibleSubBasinsFC;
  const visibleReachesFC = isProjectMode
    ? projectReachMapFC ?? projectData?.reaches ?? null
    : reachesFC;
  const visibleStationsFC = isProjectMode ? projectData?.stations ?? null : stationsFC;
  const visibleBarragesFC = isProjectMode ? projectData?.barrages ?? null : barragesFC;

  const availableReaches = useMemo(() => {
    const features = visibleReachesFC?.features ?? [];
    const list = features
      .map((f) => {
        const p = f?.properties ?? {};
        const id = Number(p.id ?? p.reach_id);
        const code = p.reach_code ? String(p.reach_code) : undefined;
        return {
          id,
          name: code ? `Troncon ${code}` : `Troncon ${id}`,
          code,
          subbasinId: Number(p.subbasin_id ?? p.Subbasin ?? NaN),
          catchmentId: Number(p.catchment_id ?? NaN),
        };
      })
      .filter((x) => Number.isFinite(x.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    return list.length ? list : reachOptions;
  }, [visibleReachesFC, reachOptions]);

  const reachesForSelection = useMemo(() => {
    if (!selectedSubBasinId) return availableReaches;
    const subId = Number(selectedSubBasinId);
    if (!Number.isFinite(subId)) return availableReaches;
    const filtered = availableReaches.filter((reach) => reach.subbasinId === subId);
    return filtered.length ? filtered : availableReaches;
  }, [availableReaches, selectedSubBasinId]);

  const activeBasinId = selectedBasinId ? Number(selectedBasinId) : null;
  const activeBarrageId = selectedBarrageId ? Number(selectedBarrageId) : null;
  const activeSubBasinId = selectedSubBasinId ? Number(selectedSubBasinId) : null;
  const activeReachId = selectedReachId ? Number(selectedReachId) : null;
  const activeStationId = selectedStationId ? Number(selectedStationId) : null;
  const spatialLoading = isProjectMode
    ? !projectData
    : !visibleBasinsFC && !visibleSubBasinsFC && !visibleStationsFC && !visibleBarragesFC;

  const findFeatureById = (
    collection: FeatureCollection | null | undefined,
    id: number,
    keys: string[]
  ) =>
    collection?.features.find((feature: any) =>
      keys.some((key) => Number(feature?.properties?.[key]) === id)
    ) ?? null;

  const buildStationSelection = (stationId: number): SpatialInspectorSelection | null => {
    const feature = findFeatureById(visibleStationsFC, stationId, ["station_id", "id"]);
    const properties = (feature?.properties ?? {}) as Record<string, unknown>;
    const option = availableStations.find((item) => item.id === stationId);
    const catchmentId = Number(properties.catchment_id ?? NaN);
    const name =
      option?.name ||
      formatStationDisplayName(
        String(properties.station_name ?? properties.name ?? `Station ${stationId}`),
        properties.station_code ? String(properties.station_code) : undefined,
      );

    return {
      kind: "station",
      stationId,
      name,
      code: option?.code || (properties.station_code ? String(properties.station_code) : undefined),
      catchmentId: Number.isFinite(catchmentId) ? catchmentId : null,
      stationType: properties.station_type_code
        ? String(properties.station_type_code)
        : properties.type_station
        ? String(properties.type_station)
        : null,
      properties: feature?.properties ?? {},
    };
  };

  const buildSubBasinSelection = (subbasinId: number): SpatialInspectorSelection | null => {
    const feature =
      findFeatureById(visibleSubBasinsFC, subbasinId, ["id", "subbasin_id"]) ??
      findFeatureById(visibleSubBasinMapFC, subbasinId, ["id", "subbasin_id", "Subbasin"]);
    if (!feature) return null;
    const properties = (feature.properties ?? {}) as Record<string, unknown>;
    const catchmentId = Number(properties.catchment_id ?? NaN);
    return {
      kind: "subbasin",
      subbasinId,
      name: formatSubbasinDisplayName(
        String(properties.name ?? ""),
        String(properties.subbasin_code ?? ""),
        String(properties.id ?? subbasinId),
      ),
      catchmentId: Number.isFinite(catchmentId) ? catchmentId : null,
      properties: feature.properties,
    };
  };

  const buildReachSelection = (reachId: number): SpatialInspectorSelection | null => {
    const feature = findFeatureById(visibleReachesFC, reachId, ["id", "reach_id"]);
    const properties = (feature?.properties ?? {}) as Record<string, unknown>;
    const option = availableReaches.find((item) => item.id === reachId);
    const subbasinId = Number(properties.subbasin_id ?? NaN);
    const catchmentId = Number(properties.catchment_id ?? NaN);
    return {
      kind: "reach",
      reachId,
      name:
        option?.name ||
        (properties.reach_code ? `Troncon ${String(properties.reach_code)}` : `Troncon ${reachId}`),
      code: option?.code || (properties.reach_code ? String(properties.reach_code) : undefined),
      subbasinId: Number.isFinite(subbasinId) ? subbasinId : null,
      catchmentId: Number.isFinite(catchmentId) ? catchmentId : null,
      properties: feature?.properties ?? {},
    };
  };

  const buildBarrageSelection = (barrageId: number): SpatialInspectorSelection | null => {
    const feature = findFeatureById(visibleBarragesFC, barrageId, ["id", "barrage_id"]);
    if (!feature) return null;
    const properties = (feature.properties ?? {}) as Record<string, unknown>;
    const option = availableBarrages.find((item) => item.id === barrageId);
    const catchmentId = Number(properties.catchment_id ?? NaN);
    return {
      kind: "barrage",
      barrageId,
      name: option?.name || String(properties.name ?? `Barrage ${barrageId}`),
      catchmentId: Number.isFinite(catchmentId) ? catchmentId : null,
      properties: feature.properties,
    };
  };

  const toStationEntityOptions = useMemo<EntityControlOption[]>(
    () =>
      availableStations.map((station) => ({
        id: station.id,
        label: station.name,
        meta: station.code && !station.name.toLowerCase().includes(station.code.toLowerCase()) ? station.code : undefined,
      })),
    [availableStations]
  );

  const toSubBasinEntityOptions = useMemo<EntityControlOption[]>(
    () =>
      availableSubBasins.map((subbasin) => ({
        id: subbasin.id,
        label: subbasin.name,
      })),
    [availableSubBasins]
  );

  const toReachEntityOptions = useMemo<EntityControlOption[]>(
    () =>
      reachesForSelection.map((reach) => ({
        id: reach.id,
        label: reach.name,
        meta:
          reach.subbasinId && Number.isFinite(reach.subbasinId)
            ? `SB ${reach.subbasinId}${reach.code ? ` • ${reach.code}` : ""}`
            : reach.code,
      })),
    [reachesForSelection]
  );

  const toBarrageEntityOptions = useMemo<EntityControlOption[]>(
    () =>
      availableBarrages.map((barrage) => ({
        id: barrage.id,
        label: barrage.name,
      })),
    [availableBarrages]
  );

  const toBasinEntityOptions = useMemo<EntityControlOption[]>(
    () =>
      availableBasins.map((basin: any) => ({
        id: basin.id,
        label: basin.name,
      })),
    [availableBasins]
  );

  const viewportPadding = useMemo(
    () => ({
      topLeft: [showAnalysisPanel ? 440 : 36, 96] as [number, number],
      bottomRight: [96, 64] as [number, number],
    }),
    [showAnalysisPanel]
  );

  const ensureLayerVisible = (layer: ManagedLayerKey) => {
    setLeftSidebarLayers((prev) => (prev[layer] ? prev : { ...prev, [layer]: true }));
  };

  const emphasizeSelection = (layer: ManagedLayerKey, value: string, handler: (value: string) => void) => {
    if (!value) return;
    ensureLayerVisible(layer);
    handler(value);
  };

  const zoomToSelection = (layer: ManagedLayerKey, value: string, handler: (value: string) => void) => {
    if (!value) return;
    ensureLayerVisible(layer);
    handler(value);
    setZoomTick((tick) => tick + 1);
  };

  const selectAndZoomToEntity = (layer: ManagedLayerKey, value: string, handler: (value: string) => void) => {
    ensureLayerVisible(layer);
    handler(value);
    if (value !== ALL) {
      setZoomTick((tick) => tick + 1);
    }
  };

  const mapLayers = useMemo(() => {
    const showSubBasins = leftSidebarLayers.subBasins;
    return {
      basins: leftSidebarLayers.basins ? visibleBasinsFC : null,
      subBasins: showSubBasins && !isProjectMode ? visibleSubBasinsFC : null,
      hruSummary: showSubBasins && isProjectMode ? visibleSubBasinMapFC : null,
      reach: leftSidebarLayers.reach ? visibleReachesFC : null,
      stations: leftSidebarLayers.stations ? visibleStationsFC : null,
    };
  }, [
    isProjectMode,
    leftSidebarLayers,
    visibleBasinsFC,
    visibleSubBasinsFC,
    visibleSubBasinMapFC,
    visibleReachesFC,
    visibleStationsFC,
  ]);

  const stats = useMemo(
    () => ({
      basins: visibleBasinsFC?.features.length ?? 0,
      subbasins: visibleSubBasinsFC?.features.length ?? 0,
      reaches: visibleReachesFC?.features.length ?? 0,
      stations: visibleStationsFC?.features.length ?? 0,
      barrages: visibleBarragesFC?.features.length ?? 0,
    }),
    [visibleBasinsFC, visibleSubBasinsFC, visibleReachesFC, visibleStationsFC, visibleBarragesFC]
  );

  const analysisPanel = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="rounded-md bg-teal-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-teal-700">
          Hassan Addakhil
        </Badge>
        <div className="flex items-center gap-1 text-[11px] text-slate-600">
          <Landmark className="h-3.5 w-3.5 text-cyan-600" />
          <span className="font-semibold">{stats.barrages}</span>
          <span>Barrage</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-orange-500" />
          <span className="font-semibold">{stats.stations}</span>
          <span>Stations</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-600">
          <Grid3X3 className="h-3.5 w-3.5 text-green-600" />
          <span className="font-semibold">{stats.subbasins}</span>
          <span>Sous-bassins</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-600">
          <Waves className="h-3.5 w-3.5 text-blue-500" />
          <span className="font-semibold">{stats.reaches}</span>
          <span>Tronçons</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm">
        <div className="mb-3">
          <div className="text-sm font-semibold text-slate-900">Zone d'intérêt</div>
          <div className="text-[11px] text-slate-500">Choisir l'emprise cartographique principale.</div>
        </div>

        <Select value={displayMode} onValueChange={(value) => changeDisplayMode(value as SpatialDisplayMode)}>
          <SelectTrigger className="relative h-10 w-full bg-white pl-9 text-xs">
            <MapPin className="absolute left-2.5 h-4 w-4 text-slate-400" />
            <SelectValue placeholder="Choisir une zone d'intérêt" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="project_hassan_addakhil">Bassin Hassan Dakhil</SelectItem>
            <SelectItem value="raw_database">Bassin ABH</SelectItem>
          </SelectContent>
        </Select>

        <label className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700">
          <span>Contour du bassin</span>
          <Checkbox checked={leftSidebarLayers.basins} onCheckedChange={() => toggleLayer("basins")} />
        </label>

        <label className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700">
          <span>Tronçons (reaches)</span>
          <Checkbox checked={leftSidebarLayers.reach} onCheckedChange={() => toggleLayer("reach")} />
        </label>
      </div>

      <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm">
        <div className="mb-3">
          <div className="text-sm font-semibold text-slate-900">Carte thématique</div>
          <div className="text-[11px] text-slate-500">
            Visualiser les indicateurs de vulnérabilité et de sédiments.
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeThematicTab === "subbasin" ? "default" : "outline"}
            className="h-auto flex-col items-start gap-1 px-3 py-2.5 text-left"
            onClick={() => setActiveThematicTab(activeThematicTab === "subbasin" ? "none" : "subbasin")}
          >
            <Layers className="h-4 w-4 text-cyan-600" />
            <span className="text-xs leading-tight">
              Vulnérabilité
              <br />
              sous-bassins
            </span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeThematicTab === "reach" ? "default" : "outline"}
            className="h-auto flex-col items-start gap-1 px-3 py-2.5 text-left"
            onClick={() => setActiveThematicTab(activeThematicTab === "reach" ? "none" : "reach")}
          >
            <Waves className="h-4 w-4 text-cyan-600" />
            <span className="text-xs leading-tight">
              Sédiments
              <br />
              reaches
            </span>
          </Button>
        </div>

        {activeThematicTab === "subbasin" && (
          <ThematicSubbasinPanel
            onChange={(config) => {
              setThematicLayers((prev) => {
                const others = prev.filter((l) => l.entityType !== "subbasin");
                return config ? [...others, config] : others;
              });
            }}
          />
        )}

        {activeThematicTab === "reach" && (
          <ThematicReachPanel
            onChange={(config) => {
              setThematicLayers((prev) => {
                const others = prev.filter((l) => l.entityType !== "reach");
                return config ? [...others, config] : others;
              });
            }}
          />
        )}

        {thematicLayers.map((layer) => (
          <div key={`${layer.entityType}-${layer.label}`} className="mt-3">
            <ThematicLegend
              title={layer.label}
              colors={layer.colors}
              min={layer.min}
              max={layer.max}
              unit={layer.unit}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <EntityControlCard
          title="Barrages"
          helper="Sélection du barrage principal."
          icon={<Landmark className="h-5 w-5" />}
          iconColorClass="text-cyan-600"
          visible={leftSidebarLayers.barrages}
          count={stats.barrages}
          selectedValue={selectedBarrageId}
          options={toBarrageEntityOptions}
          placeholder="Tous les barrages"
          onToggleVisibility={() => toggleLayer("barrages")}
          onSelect={(value) => selectAndZoomToEntity("barrages", value, focusBarrage)}
        />

        <EntityControlCard
          title="Stations"
          helper="Priorité de clic la plus haute."
          icon={<MapPin className="h-5 w-5" />}
          iconColorClass="text-orange-500"
          visible={leftSidebarLayers.stations}
          count={stats.stations}
          selectedValue={selectedStationId}
          options={toStationEntityOptions}
          placeholder="Toutes les stations"
          onToggleVisibility={() => toggleLayer("stations")}
          onSelect={(value) => selectAndZoomToEntity("stations", value, focusStation)}
        />

        <EntityControlCard
          title="Sous-bassins"
          helper="Polygones de référence."
          icon={<Grid3X3 className="h-5 w-5" />}
          iconColorClass="text-green-600"
          visible={leftSidebarLayers.subBasins}
          count={stats.subbasins}
          selectedValue={selectedSubBasinId}
          options={toSubBasinEntityOptions}
          placeholder="Tous les sous-bassins"
          onToggleVisibility={() => toggleLayer("subBasins")}
          onSelect={(value) => selectAndZoomToEntity("subBasins", value, focusSubBasin)}
        />

        <EntityControlCard
          title="Tronçons (reaches)"
          helper="Réseau hydro linéaire."
          icon={<Waves className="h-5 w-5" />}
          iconColorClass="text-blue-500"
          visible={leftSidebarLayers.reach}
          count={stats.reaches}
          selectedValue={selectedReachId}
          options={toReachEntityOptions}
          placeholder={selectedSubBasinId ? "Tronçon du sous-bassin" : "Tous les tronçons"}
          onToggleVisibility={() => toggleLayer("reach")}
          onSelect={(value) => selectAndZoomToEntity("reach", value, focusReach)}
        />
      </div>
    </div>
  );

  const toolsPanel = (
    <>
          {/* Navigation */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{t("spatial.tools.navigation")}</label>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setZoomTick((t) => t + 1)}
            >
              <Search className="w-3.5 h-3.5 mr-2" />
              {t("spatial.tools.zoomSelection")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="mt-2 w-full"
              onClick={() => resetSelections()}
            >
              {t("spatial.tools.fullView")}
            </Button>
          </div>

          {/* Basemap */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{t("spatial.tools.basemap")}</label>
            <Select value={basemap} onValueChange={(value) => setBasemap(value as BasemapId)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder={t("spatial.tools.basemap")} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(BASEMAPS).map((bm) => (
                  <SelectItem key={bm.id} value={bm.id}>
                    {bm.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mesure */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{t("spatial.tools.measure")}</label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={activeTool === "distance" ? "default" : "outline"}
                onClick={() => setActiveTool(activeTool === "distance" ? null : "distance")}
                className="flex-1"
              >
                <Ruler className="w-3.5 h-3.5 mr-1" />
                {t("spatial.tools.distance")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTool === "area" ? "default" : "outline"}
                onClick={() => setActiveTool(activeTool === "area" ? null : "area")}
                className="flex-1"
              >
                <Grid3X3 className="w-3.5 h-3.5 mr-1" />
                {t("spatial.tools.surface")}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-2">
            <span className="text-xs text-muted-foreground">{t("spatial.tools.debugMode")}</span>
            <Checkbox checked={debugMode} onCheckedChange={(v) => setDebugMode(Boolean(v))} />
          </div>

          {/* Opacité */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {t("spatial.tools.layersOpacity")}
            </label>
            <Slider value={opacityPct} onValueChange={setOpacityPct} max={100} step={1} />
            <span className="text-xs text-muted-foreground">{opacityPct[0]}%</span>
          </div>

          {/* Export */}
          <div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setExportTick((t) => t + 1)}
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              {t("spatial.tools.exportPng")}
            </Button>
          </div>

          {/* Légende station */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs font-semibold mb-2">{t("spatial.legend.title")}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#F97316] border-2 border-white shadow-[0_0_0_3px_rgba(249,115,22,0.22)]" />
              {t("spatial.legend.stations")}
            </div>
            <div className="mt-2 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#06B6D4] border-2 border-[#0891B2]" />
                <span>{t("spatial.legend.barrages")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-1.5 w-5 rounded bg-[#1E3A8A]" />
                <span>{t("spatial.legend.basinOutline")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-3 w-5 rounded-sm bg-[#22C55E] border border-[#16A34A]" />
                <span>{t("spatial.legend.subbasins")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-1 w-5 rounded bg-[#3B82F6]" />
                <span>{t("spatial.legend.reach")}</span>
              </div>
            </div>
          </div>
    </>
  );

  const legendContent = (
    <div className="space-y-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#F97316] shadow-[0_0_0_3px_rgba(249,115,22,0.22)]" />
        <span>{t("spatial.legend.stations")}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#0891B2] bg-[#06B6D4]" />
        <span>{t("spatial.legend.barrages")}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-1.5 w-5 rounded bg-[#1E3A8A]" />
        <span>{t("spatial.legend.basinOutline")}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-3 w-5 rounded-sm border border-[#16A34A] bg-[#22C55E]" />
        <span>{t("spatial.legend.subbasins")}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-1 w-5 rounded bg-[#3B82F6]" />
        <span>{t("spatial.legend.reach")}</span>
      </div>
    </div>
  );

  const entityBadgeBar = (
    <div className="pointer-events-none absolute inset-x-0 top-14 z-[530] flex justify-center sm:top-16">
      <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/60 bg-white/70 px-2 py-1 shadow-lg shadow-slate-950/15 backdrop-blur-xl">
        <Button
          size="sm"
          variant={leftSidebarLayers.barrages ? "secondary" : "ghost"}
          className="h-7 gap-1 rounded-full px-2.5 text-xs"
          onClick={() => toggleLayer("barrages")}
        >
          <Landmark className="h-3.5 w-3.5 text-cyan-600" />
          <span className="hidden sm:inline">Barrages</span>
          <Badge variant="outline" className="ml-0.5 rounded-full px-1.5 py-0 text-[10px]">
            {stats.barrages}
          </Badge>
        </Button>
        <Button
          size="sm"
          variant={leftSidebarLayers.stations ? "secondary" : "ghost"}
          className="h-7 gap-1 rounded-full px-2.5 text-xs"
          onClick={() => toggleLayer("stations")}
        >
          <MapPin className="h-3.5 w-3.5 text-orange-500" />
          <span className="hidden sm:inline">Stations</span>
          <Badge variant="outline" className="ml-0.5 rounded-full px-1.5 py-0 text-[10px]">
            {stats.stations}
          </Badge>
        </Button>
        <Button
          size="sm"
          variant={leftSidebarLayers.subBasins ? "secondary" : "ghost"}
          className="h-7 gap-1 rounded-full px-2.5 text-xs"
          onClick={() => toggleLayer("subBasins")}
        >
          <Grid3X3 className="h-3.5 w-3.5 text-green-600" />
          <span className="hidden sm:inline">Sous-bassins</span>
          <Badge variant="outline" className="ml-0.5 rounded-full px-1.5 py-0 text-[10px]">
            {stats.subbasins}
          </Badge>
        </Button>
        <Button
          size="sm"
          variant={leftSidebarLayers.reach ? "secondary" : "ghost"}
          className="h-7 gap-1 rounded-full px-2.5 text-xs"
          onClick={() => toggleLayer("reach")}
        >
          <Waves className="h-3.5 w-3.5 text-blue-500" />
          <span className="hidden sm:inline">Tronçons</span>
          <Badge variant="outline" className="ml-0.5 rounded-full px-1.5 py-0 text-[10px]">
            {stats.reaches}
          </Badge>
        </Button>
      </div>
    </div>
  );

  const mapTopToolbar = (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-[540] grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:inset-x-4 sm:top-4">
      <div aria-hidden className="min-w-0" />

      <div className="pointer-events-auto flex shrink-0 items-center gap-2 rounded-full border border-white/60 bg-white/60 px-2 py-1.5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
        {!mapOnlyMode && !showAnalysisPanel && (
          <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowAnalysisPanel(true)}>
            <PanelLeftOpen className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">{t("spatial.tools.showAnalysisPanel")}</span>
          </Button>
        )}
        <Button
          size="sm"
          variant={mapOnlyMode ? "secondary" : "default"}
          className="h-8"
          onClick={() => setMapOnlyMode((current) => !current)}
        >
          {mapOnlyMode ? (
            <Minimize2 className="mr-2 h-4 w-4" />
          ) : (
            <Maximize2 className="mr-2 h-4 w-4" />
          )}
          {mapOnlyMode ? t("spatial.tools.exitMapOnly") : t("spatial.tools.mapOnly")}
        </Button>
      </div>

      <div className="pointer-events-auto flex min-w-0 items-center justify-end">
        <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-white/60 bg-white/70 p-1 shadow-lg shadow-slate-950/15 backdrop-blur-xl sm:gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 gap-1.5 rounded-full px-2.5 text-xs font-medium text-slate-700 hover:bg-white/80"
                title={t("spatial.tools.basemap")}
              >
                <Map className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t("spatial.tools.basemap")}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              className="z-[99999] w-64 space-y-2 bg-white/95 p-3 backdrop-blur-xl"
            >
              <div className="text-sm font-semibold">{t("spatial.tools.basemap")}</div>
              <Select value={basemap} onValueChange={(value) => setBasemap(value as BasemapId)}>
                <SelectTrigger className="h-9 w-full bg-white">
                  <SelectValue placeholder={t("spatial.tools.basemap")} />
                </SelectTrigger>
                <SelectContent className="z-[100000]">
                  {Object.values(BASEMAPS).map((bm) => (
                    <SelectItem key={bm.id} value={bm.id}>
                      {bm.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PopoverContent>
          </Popover>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 shrink-0 gap-1.5 rounded-full px-2.5 text-xs font-medium text-slate-700 hover:bg-white/80"
            title={t("spatial.tools.exportPng")}
            onClick={() => setExportTick((tick) => tick + 1)}
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">{t("spatial.tools.exportPng")}</span>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 gap-1.5 rounded-full px-2.5 text-xs font-medium text-slate-700 hover:bg-white/80"
                title={t("spatial.legend.title")}
              >
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t("spatial.legend.title")}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              className="z-[99999] w-64 bg-white/95 p-3 backdrop-blur-xl"
            >
              <div className="mb-3 text-sm font-semibold">{t("spatial.legend.title")}</div>
              {legendContent}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`${
        mapOnlyMode
          ? "fixed inset-0 z-[100] bg-slate-950"
          : "relative h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-xl"
      }`}
    >
      <HydroMap
        className="h-full w-full"
        opacity={opacity}
        basemap={basemap}
        displayMode={displayMode}
        layers={mapLayers}
        thematicLayers={thematicLayers}
        barrages={leftSidebarLayers.barrages ? visibleBarragesFC : null}
        selectionZoomRequest={{ tick: zoomTick }}
        activeTool={activeTool}
        exportPngRequest={{ tick: exportTick, filename: "analyse_spatiale.png" }}
        resetViewRequest={{ tick: resetViewTick }}
        selectedBasinId={activeBasinId}
        selectedSubBasinId={activeSubBasinId}
        selectedBarrageId={activeBarrageId}
        selectedReachId={activeReachId}
        selectedStationId={activeStationId}
        viewportPadding={viewportPadding}
        onStationSelect={(payload) => {
          setSelectedBarrageId("");
          setSelectedReachId("");
          setSelectedStationId(String(payload.stationId));
          setSelectedSubBasinId("");
          setInspectorSelection({
            kind: "station",
            stationId: payload.stationId,
            name: payload.name,
            code: payload.code,
            catchmentId: payload.catchmentId ?? null,
            stationType: payload.stationType ?? null,
            properties: payload.properties,
          });
        }}
        onSubBasinSelect={(payload) => {
          setSelectedBarrageId("");
          setSelectedSubBasinId(String(payload.subbasinId));
          setSelectedStationId("");
          const linkedReach = availableReaches.find(
            (reach) => reach.subbasinId === payload.subbasinId
          );
          setSelectedReachId(linkedReach ? String(linkedReach.id) : "");
          setLeftSidebarLayers((prev) => (prev.reach ? prev : { ...prev, reach: true }));
          setInspectorSelection({
            kind: "subbasin",
            subbasinId: payload.subbasinId,
            name: payload.name,
            catchmentId: payload.catchmentId ?? null,
            properties: payload.properties,
          });
        }}
        onReachSelect={(payload) => {
          setSelectedBarrageId("");
          setSelectedSubBasinId("");
          setSelectedReachId(String(payload.reachId));
          setSelectedStationId("");
          setInspectorSelection({
            kind: "reach",
            reachId: payload.reachId,
            name: payload.name,
            code: payload.code,
            subbasinId: payload.subbasinId ?? null,
            catchmentId: payload.catchmentId ?? null,
            properties: payload.properties,
          });
        }}
        onBarrageSelect={(payload) => {
          setSelectedSubBasinId("");
          setSelectedReachId("");
          setSelectedStationId("");
          setSelectedBarrageId(String(payload.barrageId));
          setInspectorSelection({
            kind: "barrage",
            barrageId: payload.barrageId,
            name: payload.name,
            catchmentId: payload.catchmentId ?? null,
            properties: payload.properties,
          });
        }}
        debugMode={debugMode}
      />

      {spatialLoading && (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-[530] mx-auto flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
          Chargement des couches cartographiques...
        </div>
      )}

      {mapTopToolbar}

      {false && entityBadgeBar}

      {showAnalysisPanel && (
        <FloatingPanel
          title={t("spatial.title")}
          icon={<Layers className="h-4 w-4" />}
          anchor="left"
          widthClass="w-[22rem] min-w-[20rem] max-w-[42rem]"
          onClose={() => setShowAnalysisPanel(false)}
        >
          {analysisPanel}
        </FloatingPanel>
      )}

      {inspectorSelection && (
        <div
          ref={inspectorPopupRef}
          className="absolute right-6 top-20 z-[560] resize overflow-auto rounded-2xl"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
          style={{
            width: `${Math.round(340 * inspectorPopupScale)}px`,
            height: `${Math.round(480 * inspectorPopupScale)}px`,
            minWidth: "300px",
            minHeight: "320px",
            maxWidth: "calc(100vw - 2rem)",
            maxHeight: "calc(100vh - 8rem)",
            willChange: "transform",
            transformOrigin: "top right",
          }}
        >
          <div
            className="mb-2 flex items-center justify-between rounded-t-2xl border border-white/60 bg-white/70 px-2.5 py-1.5 backdrop-blur-xl cursor-move select-none"
            onPointerDown={startInspectorDrag}
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
              <Move className="h-3.5 w-3.5" />
              Détails
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-6 w-6" onPointerDown={(e) => e.stopPropagation()} onClick={() => setInspectorPopupScale((s) => Math.max(0.75, Number((s - 0.1).toFixed(2))))}>
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onPointerDown={(e) => e.stopPropagation()} onClick={() => setInspectorPopupScale((s) => Math.min(1.4, Number((s + 0.1).toFixed(2))))}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onPointerDown={(e) => e.stopPropagation()} onClick={() => resetSelections()}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <SpatialInspectorPanel
            className="h-[calc(100%-2rem)] w-full"
            selection={inspectorSelection}
            onClear={resetSelections}
          />
        </div>
      )}
    </div>
  );
}
export function SpatialModule() {
  return <OperationalSpatialModule />;
}
