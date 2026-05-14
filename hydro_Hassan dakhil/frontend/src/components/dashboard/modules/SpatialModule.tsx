// frontend/src/components/dashboard/modules/SpatialModule.tsx
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HydroMap } from "@/components/map/HydroMap";
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
} from "lucide-react";
import { BASEMAPS, DEFAULT_BASEMAP, type BasemapId } from "@/config/basemaps";
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

const ALL = "__ALL__";
const BARRAGE_NAME = "Barrage Hassan Addakhil";
const BASEMAP_STORAGE_KEY = "hydro-basemap";
const PROJECT_STATION_IDS = HASSAN_ADDAKHIL_STATION_IDS;
const PROJECT_BASIN_ID = 1;
const PROJECT_BARRAGE_ID = 2;
const PROJECT_BASIN_LABEL = "Bassin versant Guir-Ziz-Rheris";

function isBasemapId(value: string): value is BasemapId {
  return Object.prototype.hasOwnProperty.call(BASEMAPS, value);
}

export function SpatialModule() {
  const { t } = useTranslation();
  const [displayMode, setDisplayMode] =
    useState<SpatialDisplayMode>("raw_database");
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
  const [subBasinOptions, setSubBasinOptions] = useState<SubBasinOption[]>([]);
  const [selectedBasinId, setSelectedBasinId] = useState<string>(""); // "" = aucun filtre
  const [selectedBarrageId, setSelectedBarrageId] = useState<string>(""); // "" = tous les barrages
  const [selectedSubBasinId, setSelectedSubBasinId] = useState<string>(""); // "" = aucun filtre

  const toggleLayer = (layer: keyof typeof leftSidebarLayers) => {
    setLeftSidebarLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  useEffect(() => {
    window.localStorage.setItem(BASEMAP_STORAGE_KEY, basemap);
  }, [basemap]);

  const isRawMode = displayMode === "raw_database";
  const isProjectMode = displayMode === "project_hassan_addakhil";

  const layerItems = useMemo(
    () => [
      { id: "barrages" as const, label: t("spatial.layers.barrages"), icon: Landmark },
      ...(isRawMode
        ? [{ id: "basins" as const, label: t("spatial.layers.basins"), icon: Grid3X3 }]
        : []),
      { id: "subBasins" as const, label: t("spatial.layers.subbasins"), icon: Grid3X3 },
      { id: "reach" as const, label: t("spatial.layers.reach"), icon: Waves },
      { id: "stations" as const, label: t("spatial.layers.stations"), icon: MapPin },
    ],
    [isRawMode, t]
  );

  // ===== 1) Load raw layers when the raw mode is active =====
  useEffect(() => {
    if (!isRawMode) return;

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
          name: String(f?.properties?.name ?? `Subbasin ${f?.properties?.id}`),
          catchment_id: Number(f?.properties?.catchment_id ?? PROJECT_BASIN_ID),
        }))
          .filter((x) => Number.isFinite(x.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        setSubBasinOptions(opts);
        setSelectedSubBasinId("");
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

  const visibleBasinOptions = isProjectMode
    ? [
        {
          id: PROJECT_BASIN_ID,
          name: PROJECT_BASIN_LABEL,
        },
      ]
    : basinOptions;

  const visibleBarrageOptions = isProjectMode
    ? [
        {
          id: PROJECT_BARRAGE_ID,
          name: BARRAGE_NAME,
        },
      ]
    : barrageOptions;

  const visibleSubBasinOptions = isProjectMode
    ? (projectData?.subbasins?.features ?? [])
        .map((f) => ({
          id: Number(f?.properties?.id),
          name: String(f?.properties?.name ?? `Subbasin ${f?.properties?.id}`),
          catchment_id: Number(f?.properties?.catchment_id ?? PROJECT_BASIN_ID),
        }))
        .filter((x) => Number.isFinite(x.id))
    : subBasinOptions;

  const activeBasinId = isProjectMode
    ? PROJECT_BASIN_ID
    : selectedBasinId
      ? Number(selectedBasinId)
      : null;
  const activeBarrageId = isProjectMode
    ? PROJECT_BARRAGE_ID
    : selectedBarrageId
      ? Number(selectedBarrageId)
      : null;
  const activeSubBasinId = isProjectMode
    ? null
    : selectedSubBasinId
      ? Number(selectedSubBasinId)
      : null;

  const mapLayers = useMemo(() => {
    return {
      basins: isRawMode && leftSidebarLayers.basins ? visibleBasinsFC : null,
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
    isProjectMode,
  ]);

  const zoomTargetName = useMemo(() => {
    if (isProjectMode) return BARRAGE_NAME;
    if (!selectedBarrageId) return BARRAGE_NAME;
    const found = barrageOptions.find((b) => String(b.id) === selectedBarrageId);
    return found?.name || BARRAGE_NAME;
  }, [isProjectMode, selectedBarrageId, barrageOptions]);

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

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Left Sidebar */}
      <Card className="w-72 flex-shrink-0 overflow-y-auto">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="w-4 h-4" />
            {t("spatial.title")}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">
              {t("spatial.displayMode")}
            </label>
            <Select
              value={displayMode}
              onValueChange={(v) => setDisplayMode(v as SpatialDisplayMode)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("spatial.displayMode")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="raw_database">
                  {t("spatial.displayModes.raw_database")}
                </SelectItem>
                <SelectItem value="project_hassan_addakhil">
                  {t("spatial.displayModes.project_hassan_addakhil")}
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

            <Select
              value={isProjectMode ? String(PROJECT_BASIN_ID) : selectedBasinId === "" ? ALL : selectedBasinId}
              onValueChange={(v) => {
                if (isProjectMode) return;
                setSelectedBasinId(v === ALL ? "" : v);
              }}
              disabled={isProjectMode}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("spatial.filters.chooseBasin")} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={ALL}>{t("spatial.filters.allBasins")}</SelectItem>
                {visibleBasinOptions.map((b) => (
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

            <Select
              value={isProjectMode ? String(PROJECT_BARRAGE_ID) : selectedBarrageId === "" ? ALL : selectedBarrageId}
              onValueChange={(v) => {
                if (isProjectMode) return;
                setSelectedBarrageId(v === ALL ? "" : v);
              }}
              disabled={isProjectMode}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("spatial.filters.filterByBarrage")} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={ALL}>{t("spatial.filters.allBarrages")}</SelectItem>
                {visibleBarrageOptions.map((b) => (
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
              value={isProjectMode ? ALL : selectedSubBasinId === "" ? ALL : selectedSubBasinId}
              onValueChange={(v) => {
                if (isProjectMode) return;
                setSelectedSubBasinId(v === ALL ? "" : v);
              }}
              disabled={isProjectMode || !visibleSubBasinOptions.length}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("spatial.filters.chooseSubbasin")} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={ALL}>{t("spatial.filters.allSubbasins")}</SelectItem>
                {visibleSubBasinOptions.map((sb) => (
                  <SelectItem key={sb.id} value={String(sb.id)}>
                    {sb.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-[11px] text-muted-foreground mt-1">
              {t("spatial.filters.subbasinsShown", { count: visibleSubBasinOptions.length })}
            </div>
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
        </CardContent>
      </Card>

      {/* Map */}
      <div className="flex-1 relative">
        <HydroMap
          className="h-full w-full"
          opacity={opacity}
          basemap={basemap}
          displayMode={displayMode}
          layers={mapLayers}
          barrages={leftSidebarLayers.barrages ? visibleBarragesFC : null}
          zoomToBasinRequest={{
            tick: zoomTick,
            basinName: zoomTargetName,
            barrageName: zoomTargetName,
          }}
          activeTool={activeTool}
          exportPngRequest={{ tick: exportTick, filename: "analyse_spatiale.png" }}
          selectedBasinId={activeBasinId}
          selectedSubBasinId={activeSubBasinId}
          selectedBarrageId={activeBarrageId}
          debugMode={debugMode}
        />
      </div>

      {/* Right Sidebar */}
      <Card className="w-64 flex-shrink-0 overflow-y-auto">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            {t("spatial.tools.title")}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-4">
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
              {t("spatial.tools.zoom")} {zoomTargetName}
            </Button>
          </div>

          {/* Basemap */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{t("spatial.tools.basemap")}</label>
            <Select value={basemap} onValueChange={(v) => setBasemap(v as BasemapId)}>
              <SelectTrigger>
                <SelectValue placeholder={t("spatial.tools.chooseBasemap")} />
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
                size="sm"
                variant={activeTool === "distance" ? "default" : "outline"}
                onClick={() => setActiveTool(activeTool === "distance" ? null : "distance")}
                className="flex-1"
              >
                <Ruler className="w-3.5 h-3.5 mr-1" />
                {t("spatial.tools.distance")}
              </Button>
              <Button
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
        </CardContent>
      </Card>
    </div>
  );
}
