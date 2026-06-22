// frontend/src/components/dashboard/modules/SpatialModule.tsx
import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HydroMap } from "@/components/map/HydroMap";
import { SpatialInspectorPanel, type SpatialInspectorSelection } from "@/components/dashboard/modules/SpatialInspectorPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
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
  PanelRightOpen,
  Plus,
  Minus,
  X,
} from "lucide-react";
import { BASEMAPS, DEFAULT_BASEMAP, type BasemapId } from "@/config/basemaps";
import { formatStationDisplayName, formatSubbasinDisplayName } from "@/lib/stationLabels";
import type { SpatialDisplayMode } from "@/types/spatial";
import { HASSAN_ADDAKHIL_STATION_IDS } from "@/constants/projectStations";

import {
  fetchBasins,
  fetchBarrages,
  fetchProjectHassanAddakhil,
  fetchSubBasins,
  fetchReaches,
  fetchStations,
  type FeatureCollection,
  type ProjectSpatialData,
} from "@/api/spatial";

type BasinOption = { id: number; name: string };
type BarrageOption = { id: number; name: string };
type SubBasinOption = { id: number; name: string; catchment_id?: number };
type StationOption = { id: number; name: string; code?: string };

const ALL = "__ALL__";
const BARRAGE_NAME = "Barrage Hassan Addakhil";
const BASEMAP_STORAGE_KEY = "hydro-basemap";
const PROJECT_STATION_IDS = HASSAN_ADDAKHIL_STATION_IDS;
const PROJECT_BASIN_ID = 1;
const PROJECT_BASIN_LABEL = "Bassin versant du barrage Hassan Addakhil";

function isBasemapId(value: string): value is BasemapId {
  return Object.prototype.hasOwnProperty.call(BASEMAPS, value);
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

  const [opacityPct, setOpacityPct] = useState([80]); // 0..100
  const opacity = opacityPct[0] / 100;

  // tools (distance / surface)
  const [activeTool, setActiveTool] = useState<"distance" | "area" | null>(null);

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

  // options + filtres
  const [basinOptions, setBasinOptions] = useState<BasinOption[]>([]);
  const [barrageOptions, setBarrageOptions] = useState<BarrageOption[]>([]);
  const [allSubBasinOptions, setAllSubBasinOptions] = useState<SubBasinOption[]>([]);
  const [stationOptions, setStationOptions] = useState<StationOption[]>([]);
  const [selectedBasinId, setSelectedBasinId] = useState<string>(String(PROJECT_BASIN_ID)); // focus bassin projet par défaut
  const [selectedBarrageId, setSelectedBarrageId] = useState<string>(""); // "" = tous les barrages
  const [selectedSubBasinId, setSelectedSubBasinId] = useState<string>(""); // "" = aucun filtre
  const [selectedStationId, setSelectedStationId] = useState<string>(""); // "" = toutes les stations
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(true);
  const [showToolsPanel, setShowToolsPanel] = useState(true);
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

  const resetSelections = (mode: SpatialDisplayMode = displayMode) => {
    const isProjectDefault = mode === "project_hassan_addakhil";
    setSelectedBasinId(isProjectDefault ? String(PROJECT_BASIN_ID) : "");
    setSelectedBarrageId("");
    setSelectedSubBasinId("");
    setSelectedStationId("");
    setInspectorSelection(null);
    setInspectorPopupScale(1);
    inspectorPopupOffsetRef.current = { x: 0, y: 0 };
    if (inspectorPopupRef.current) {
      inspectorPopupRef.current.style.transform = "translate(0px, 0px) scale(1)";
    }
    setResetViewTick((tick) => tick + 1);
  };

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
    setSelectedStationId("");
  };

  const focusBarrage = (value: string) => {
    setSelectedBasinId("");
    setSelectedBarrageId(value === ALL ? "" : value);
    setSelectedSubBasinId("");
    setSelectedStationId("");
  };

  const focusSubBasin = (value: string) => {
    setSelectedBasinId("");
    setSelectedBarrageId("");
    setSelectedSubBasinId(value === ALL ? "" : value);
    setSelectedStationId("");
  };

  const focusStation = (value: string) => {
    setSelectedBasinId("");
    setSelectedBarrageId("");
    setSelectedSubBasinId("");
    setSelectedStationId(value === ALL ? "" : value);
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
      return [{ id: 2, name: BARRAGE_NAME }];
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

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log("Basins", availableBasins.length);
    console.log("SubBasins", availableSubBasins.length);
    console.log("Stations", availableStations.length);
  }, [availableBasins.length, availableSubBasins.length, availableStations.length]);

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
        const [subbasins, stations] = await Promise.all([
          fetchSubBasins(),
          fetchStations(),
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

        setAllSubBasinOptions(allSubbasinOpts);
        setStationOptions(allStationOpts);

        if (import.meta.env.DEV) {
          console.debug("[spatial] catalog options loaded", {
            subbasins: allSubbasinOpts.length,
            stations: allStationOpts.length,
          });
        }
      } catch (e) {
        console.error("fetch spatial catalogs failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isRawMode) return;

    let cancelled = false;

    (async () => {
      try {
        const subIdNum = selectedSubBasinId ? Number(selectedSubBasinId) : undefined;

        const reaches = await fetchReaches(
          subIdNum ? { subbasinId: subIdNum } : undefined
        );

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
  }, [isRawMode, selectedSubBasinId]);

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
        const data = await fetchProjectHassanAddakhil();
        if (!cancelled) {
          setProjectData(data);
        }
      } catch (e) {
        console.error("fetchProjectHassanAddakhil failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isProjectMode]);

  const visibleBasinsFC = isProjectMode ? projectData?.basins ?? null : basinsFC;
  const visibleSubBasinsFC = isProjectMode ? projectData?.subbasins ?? null : subBasinsFC;
  const visibleReachesFC = isProjectMode ? projectData?.reaches ?? reachesFC : reachesFC;
  const visibleStationsFC = isProjectMode ? projectData?.stations ?? null : stationsFC;
  const visibleBarragesFC = isProjectMode ? projectData?.barrages ?? null : barragesFC;

  const activeBasinId = selectedBasinId ? Number(selectedBasinId) : null;
  const activeBarrageId = selectedBarrageId ? Number(selectedBarrageId) : null;
  const activeSubBasinId = selectedSubBasinId ? Number(selectedSubBasinId) : null;
  const activeStationId = selectedStationId ? Number(selectedStationId) : null;

  const mapLayers = useMemo(() => {
    return {
      basins: leftSidebarLayers.basins ? visibleBasinsFC : null,
      subBasins: leftSidebarLayers.subBasins ? visibleSubBasinsFC : null,
      reach: leftSidebarLayers.reach ? visibleReachesFC : null,
      stations: leftSidebarLayers.stations ? visibleStationsFC : null,
    };
  }, [
    leftSidebarLayers,
    visibleBasinsFC,
    visibleSubBasinsFC,
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
    <>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">
              {t("spatial.displayMode")}
            </label>
            <Select
              value={displayMode}
              onValueChange={(value) =>
                changeDisplayMode(value as SpatialDisplayMode)
              }
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder={t("spatial.displayMode")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project_hassan_addakhil">
                  {t("spatial.displayModes.project_hassan_addakhil")}
                </SelectItem>
                <SelectItem value="raw_database">
                  {t("spatial.displayModes.raw_database")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isProjectMode && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full">
                {t("spatial.projectBadge")}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {t("spatial.projectCounts.stations", { count: PROJECT_STATION_IDS.length })}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {t("spatial.projectCounts.subbasins", {
                  count: stats.subbasins,
                })}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {t("spatial.projectCounts.basins", {
                  count: stats.basins,
                })}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {t("spatial.projectCounts.reaches", {
                  count: stats.reaches,
                })}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {t("spatial.projectCounts.barrages", {
                  count: stats.barrages,
                })}
              </Badge>
            </div>
          )}

          {/* Basin filter */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{t("spatial.filters.basin")}</label>

            <Select value={selectedBasinId === "" ? ALL : selectedBasinId} onValueChange={focusBasin}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder={t("spatial.filters.allBasins")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("spatial.filters.allBasins")}</SelectItem>
                {availableBasins.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subbasin filter */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{t("spatial.filters.barrageFilter")}</label>

            <Select value={selectedBarrageId === "" ? ALL : selectedBarrageId} onValueChange={focusBarrage}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder={t("spatial.filters.allBarrages")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("spatial.filters.allBarrages")}</SelectItem>
                {availableBarrages.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subbasin filter */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{t("spatial.filters.subbasin")}</label>

            <Select
              value={selectedSubBasinId === "" ? ALL : selectedSubBasinId}
              onValueChange={focusSubBasin}
              disabled={!availableSubBasins.length}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder={t("spatial.filters.allSubbasins")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("spatial.filters.allSubbasins")}</SelectItem>
                {availableSubBasins.map((sb) => (
                  <SelectItem key={sb.id} value={String(sb.id)}>
                    {sb.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-[11px] text-muted-foreground mt-1">
              {t("spatial.filters.subbasinsShown", { count: availableSubBasins.length })}
            </div>
          </div>

          {/* Station filter */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{t("spatial.filters.station")}</label>

            <Select
              value={selectedStationId === "" ? ALL : selectedStationId}
              onValueChange={focusStation}
              disabled={!availableStations.length}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder={t("spatial.filters.allStations")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("spatial.filters.allStations")}</SelectItem>
                {availableStations.map((station) => (
                  <SelectItem key={station.id} value={String(station.id)}>
                    {station.code ? `${station.name} (${station.code})` : station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Layers checkboxes */}
          <div className="pt-2">
            <label className="text-xs text-muted-foreground mb-2 block">{t("spatial.layers.title")}</label>
            <div className="space-y-2">
              {layerItems.map((layer) => (
                <label
                  key={layer.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    leftSidebarLayers[layer.id]
                      ? "bg-primary/10 ring-1 ring-primary/20"
                      : "hover:bg-muted"
                  }`}
                >
                  <Checkbox
                    checked={leftSidebarLayers[layer.id]}
                    onCheckedChange={() => toggleLayer(layer.id)}
                  />
                  <layer.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{layer.label}</span>
                </label>
              ))}
            </div>
          </div>
    </>
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
        barrages={leftSidebarLayers.barrages ? visibleBarragesFC : null}
        selectionZoomRequest={{ tick: zoomTick }}
        activeTool={activeTool}
        exportPngRequest={{ tick: exportTick, filename: "analyse_spatiale.png" }}
        resetViewRequest={{ tick: resetViewTick }}
        selectedBasinId={activeBasinId}
        selectedSubBasinId={activeSubBasinId}
        selectedBarrageId={activeBarrageId}
        selectedStationId={activeStationId}
        onStationSelect={(payload) => {
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
          setSelectedSubBasinId(String(payload.subbasinId));
          setSelectedStationId("");
          setInspectorSelection({
            kind: "subbasin",
            subbasinId: payload.subbasinId,
            name: payload.name,
            catchmentId: payload.catchmentId ?? null,
            properties: payload.properties,
          });
        }}
        debugMode={debugMode}
      />

      <div className="absolute left-1/2 top-4 z-[520] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/60 bg-white/60 px-2 py-2 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
        {!mapOnlyMode && !showAnalysisPanel && (
          <Button size="sm" variant="ghost" onClick={() => setShowAnalysisPanel(true)}>
            <PanelLeftOpen className="mr-2 h-4 w-4" />
            {t("spatial.tools.showAnalysisPanel")}
          </Button>
        )}
        {!mapOnlyMode && !showToolsPanel && (
          <Button size="sm" variant="ghost" onClick={() => setShowToolsPanel(true)}>
            <PanelRightOpen className="mr-2 h-4 w-4" />
            {t("spatial.tools.showToolsPanel")}
          </Button>
        )}
        <Button
          size="sm"
          variant={mapOnlyMode ? "secondary" : "default"}
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

      {!mapOnlyMode && showAnalysisPanel && (
        <FloatingPanel
          title={t("spatial.title")}
          icon={<Layers className="h-4 w-4" />}
          anchor="left"
          widthClass="w-72 min-w-60 max-w-[32rem]"
          onClose={() => setShowAnalysisPanel(false)}
        >
          {analysisPanel}
        </FloatingPanel>
      )}

      {!mapOnlyMode && showToolsPanel && (
        <FloatingPanel
          title={t("spatial.tools.title")}
          icon={<Ruler className="h-4 w-4" />}
          anchor="right"
          widthClass="w-64 min-w-56 max-w-[28rem]"
          onClose={() => setShowToolsPanel(false)}
        >
          {toolsPanel}
        </FloatingPanel>
      )}

      {!mapOnlyMode && inspectorSelection && (
        <div
          ref={inspectorPopupRef}
          className="absolute right-6 top-20 z-[560] resize overflow-auto rounded-2xl"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
          style={{
            width: `${Math.round(380 * inspectorPopupScale)}px`,
            height: `${Math.round(540 * inspectorPopupScale)}px`,
            minWidth: "320px",
            minHeight: "360px",
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
            stationFeatures={visibleStationsFC}
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
