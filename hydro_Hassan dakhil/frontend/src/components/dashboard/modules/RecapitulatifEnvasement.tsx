import { type ComponentType, useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileText, Search } from "lucide-react";
import { CircleMarker, MapContainer, Polygon, TileLayer } from "react-leaflet";
import { siltationApi, type BathymetryCampaignsResponse, type SiltationAvailabilityResponse, type SiltationEvolutionRow, type SiltationHsvRow, type SiltationSummaryResponse } from "@/api/siltation";
import { fetchProjectHassanAddakhil } from "@/api/spatial";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BATHY_HAD_NORMAL_LEVEL_M, BATHY_PERIOD_DEFINITIONS } from "@/constants/bathymetryCampaigns";
import { rechartsXAxisBottomLabel, RECHARTS_X_AXIS_BOTTOM } from "@/lib/chartLayout";

type DamMapData = {
  basinCoords: [number, number][];
  station: [number, number] | null;
};

type HsvChartPoint = {
  level_m: number;
  [campaignKey: string]: number | null;
};

type EvolutionPeriodBar = {
  period: string;
  volume_silted_mhm3: number;
  fromYear: number;
  toYear: number;
  yearCount: number;
};

const PAGE_SIZE = 12;
const HSV_PALETTE = [
  "#dc2626",
  "#f59e0b",
  "#84cc16",
  "#0ea5e9",
  "#8b5cf6",
  "#14b8a6",
  "#f43f5e",
  "#2563eb",
];
const EVOLUTION_BAR_GRADIENTS = [
  { top: "#7dd3fc", bottom: "#38bdf8" },
  { top: "#38bdf8", bottom: "#0ea5e9" },
  { top: "#1d91f2", bottom: "#1769aa" },
  { top: "#1769aa", bottom: "#123f8a" },
  { top: "#123f8a", bottom: "#0b2357" },
] as const;
const MapContainerUnsafe = MapContainer as unknown as ComponentType<any>;
const TileLayerUnsafe = TileLayer as unknown as ComponentType<any>;
const PolygonUnsafe = Polygon as unknown as ComponentType<any>;
const CircleMarkerUnsafe = CircleMarker as unknown as ComponentType<any>;

function fmt(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(Number(value));
}

function fmtFixed(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value));
}

function finiteNumber(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function minMaxFinite(values: number[]) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min === Number.POSITIVE_INFINITY || max === Number.NEGATIVE_INFINITY) {
    return { min: null as number | null, max: null as number | null };
  }
  return { min, max };
}

function toLatLngRing(coords: unknown): [number, number][] {
  if (!Array.isArray(coords)) return [];

  let firstRing: unknown = coords;
  const first = coords[0];
  const second = Array.isArray(first) ? first[0] : null;
  const third = Array.isArray(second) ? second[0] : null;

  if (Array.isArray(third) && typeof third[0] === "number") {
    firstRing = second;
  } else if (Array.isArray(second) && typeof second[0] === "number") {
    firstRing = first;
  }

  if (!Array.isArray(firstRing)) return [];
  return (firstRing as unknown[])
    .map((point) => {
      if (!Array.isArray(point) || point.length < 2) return null;
      const lng = Number(point[0]);
      const lat = Number(point[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return [lat, lng] as [number, number];
    })
    .filter((point): point is [number, number] => Boolean(point));
}

function downloadUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function RecapitulatifEnvasement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SiltationSummaryResponse | null>(null);
  const [hsv, setHsv] = useState<SiltationHsvRow[]>([]);
  const [evolution, setEvolution] = useState<SiltationEvolutionRow[]>([]);
  const [availability, setAvailability] = useState<SiltationAvailabilityResponse | null>(null);
  const [bathyCampaigns, setBathyCampaigns] = useState<BathymetryCampaignsResponse | null>(null);
  const [mapData, setMapData] = useState<DamMapData>({ basinCoords: [], station: null });
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"campaign_year" | "level_m" | "surface_km2" | "volume_mhm3">("campaign_year");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      siltationApi.summary(),
      siltationApi.hsv(),
      siltationApi.evolution(),
      siltationApi.availability(),
      siltationApi.bathymetryCampaigns(),
      fetchProjectHassanAddakhil(),
    ])
      .then(([summaryRes, hsvRes, evolutionRes, availabilityRes, bathyRes, spatialRes]) => {
        if (!active) return;
        setSummary(summaryRes);
        setHsv(hsvRes);
        setEvolution(evolutionRes);
        setAvailability(availabilityRes);
        setBathyCampaigns(bathyRes);

        const basinFeature = spatialRes.basins?.features?.[0];
        const stationFeature = spatialRes.stations?.features?.[0];
        const basinCoords = toLatLngRing(basinFeature?.geometry?.coordinates);
        const stationCoordsRaw = stationFeature?.geometry?.coordinates;
        const station =
          Array.isArray(stationCoordsRaw) && stationCoordsRaw.length >= 2
            ? ([Number(stationCoordsRaw[1]), Number(stationCoordsRaw[0])] as [number, number])
            : null;

        setMapData({ basinCoords, station });
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur de chargement envasement");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const indicators = summary?.indicators;

  const campaignYears = useMemo(
    () => bathyCampaigns?.campaignYears ?? availability?.campaignYears ?? [],
    [availability?.campaignYears, bathyCampaigns?.campaignYears]
  );

  const displayHsv = useMemo(() => {
    if (!campaignYears.length) return hsv;
    const campaignSet = new Set<number>(campaignYears);
    return hsv.filter((row) => {
      const year = finiteNumber(row.campaign_year);
      return year !== null && campaignSet.has(year);
    });
  }, [campaignYears, hsv]);

  const campaigns = campaignYears;

  const normalLevelM = useMemo(() => {
    const apiNormalLevel = finiteNumber(bathyCampaigns?.normal_level_m);
    if (apiNormalLevel !== null) return apiNormalLevel;
    const campaignNormalLevel = finiteNumber(bathyCampaigns?.campaigns?.[0]?.normal_level_m);
    return campaignNormalLevel ?? BATHY_HAD_NORMAL_LEVEL_M;
  }, [bathyCampaigns]);

  const campaignColors = useMemo(() => {
    const map = new Map<number, string>();
    campaigns.forEach((year, index) => {
      map.set(year, HSV_PALETTE[index % HSV_PALETTE.length]);
    });
    return map;
  }, [campaigns]);

  const hsvChartData = useMemo(() => {
    const EPSILON = 1e-9;
    const byCampaign = new Map<number, Array<{ level: number; volume: number }>>();

    displayHsv.forEach((row) => {
      const year = finiteNumber(row.campaign_year);
      const level = finiteNumber(row.level_m);
      const volume = finiteNumber(row.volume_mhm3);
      if (year === null || level === null || volume === null) return;
      const values = byCampaign.get(year) ?? [];
      values.push({ level, volume });
      byCampaign.set(year, values);
    });

    const byLevel = new Map<number, HsvChartPoint>();

    byCampaign.forEach((campaignRows, year) => {
      const sorted = [...campaignRows].sort((a, b) => a.level - b.level);
      if (!sorted.length) return;

      const filteredAtNormal = sorted.filter((row) => row.level <= normalLevelM + EPSILON);
      let normalLevelVolume: number | null = null;

      for (let index = 0; index < sorted.length - 1; index += 1) {
        const start = sorted[index];
        const end = sorted[index + 1];

        if (Math.abs(start.level - normalLevelM) <= EPSILON) {
          normalLevelVolume = start.volume;
          break;
        }
        if (Math.abs(end.level - normalLevelM) <= EPSILON) {
          normalLevelVolume = end.volume;
          break;
        }

        if (normalLevelM > start.level && normalLevelM < end.level) {
          const ratio = (normalLevelM - start.level) / (end.level - start.level);
          normalLevelVolume = start.volume + ratio * (end.volume - start.volume);
          break;
        }
      }

      const clipped = filteredAtNormal.filter(
        (row) => Math.abs(row.level - normalLevelM) > EPSILON
      );
      if (normalLevelVolume !== null) {
        clipped.push({ level: normalLevelM, volume: normalLevelVolume });
      }

      clipped.forEach((row) => {
        const current = byLevel.get(row.level) ?? { level_m: row.level };
        current[`campaign_${year}`] = row.volume;
        byLevel.set(row.level, current);
      });
    });

    return Array.from(byLevel.values()).sort((a, b) => Number(a.level_m) - Number(b.level_m));
  }, [displayHsv, normalLevelM]);

  const hsvVolumeMax = useMemo(() => {
    const max = displayHsv.reduce((acc, row) => {
      const volume = finiteNumber(row.volume_mhm3);
      return volume === null ? acc : Math.max(acc, volume);
    }, 0);
    return Math.max(100, Math.ceil(max / 50) * 50);
  }, [displayHsv]);

  const hsvLevelRange = useMemo(() => {
    const levels = hsvChartData
      .map((row) => finiteNumber(row.level_m))
      .filter((value): value is number => value !== null);

    if (!levels.length) return { min: 1070, max: normalLevelM };

    const range = minMaxFinite(levels);
    if (range.min === null || range.max === null) return { min: 1070, max: normalLevelM };

    return {
      min: Math.min(1070, Math.floor(range.min)),
      max: normalLevelM,
    };
  }, [hsvChartData, normalLevelM]);

  const sortedRows = useMemo(() => {
    const filtered = displayHsv.filter((row) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return `${row.campaign_year} ${row.level_m} ${row.surface_km2 ?? ""} ${row.volume_mhm3 ?? ""}`
        .toLowerCase()
        .includes(q);
    });

    return [...filtered].sort((a, b) => {
      const va = finiteNumber(a[sortKey]) ?? 0;
      const vb = finiteNumber(b[sortKey]) ?? 0;
      return sortAsc ? va - vb : vb - va;
    });
  }, [displayHsv, search, sortAsc, sortKey]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [page, sortedRows]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, sortKey, sortAsc]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const evolutionPeriodData = useMemo<EvolutionPeriodBar[]>(() => {
    if (!bathyCampaigns?.periods?.length) return [];
    return bathyCampaigns.periods.map((row) => ({
      ...row,
      yearCount: row.toYear - row.fromYear,
    }));
  }, [bathyCampaigns]);

  const evolutionMax = useMemo(() => {
    const max = evolutionPeriodData.reduce((acc, row) => Math.max(acc, row.volume_silted_mhm3), 0);
    return Math.max(10, Math.ceil(max / 10) * 10);
  }, [evolutionPeriodData]);

  const hsvAvailabilityMessage = useMemo(() => {
    if (!campaigns.length) return null;
    return `Campagnes d'envasement détectées : ${campaigns.join(", ")}.`;
  }, [campaigns]);

  const periodSourceMessage = useMemo(() => {
    if (!bathyCampaigns?.source_file) return null;
    return `Source officielle : ${bathyCampaigns.source_file.split(/[/\\]/).pop() ?? bathyCampaigns.source_file}`;
  }, [bathyCampaigns?.source_file]);

  const evolutionTooltipFormatter = (value: number | string) => {
    const numericValue = Number(value);
    return [`${fmt(numericValue, 3)} Mm3`, "Volume envasé (Mm3)"];
  };

  const evolutionTooltipLabel = (label: string) => {
    const period = evolutionPeriodData.find((row) => row.period === label);
    if (!period) return label;
    return `${label} (${period.fromYear} → ${period.toYear})`;
  };

  const evolutionBackgroundStyle = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(241,253,250,0.88) 58%, rgba(221,252,246,0.94) 100%)",
  } as const;

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Récapitulatif d'Envasement</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Dashboard envasement professionnel - Barrage HASSAN ADDAKHIL
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadUrl(siltationApi.exportPdfUrl())}>
              <FileText className="h-4 w-4" />
              Exporter PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadUrl(siltationApi.exportExcelUrl())}>
              <Download className="h-4 w-4" />
              Exporter Excel
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadUrl(siltationApi.exportExcelUrl())}>
              Exporter indicateurs barrage
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadUrl(siltationApi.exportPdfUrl())}>
              Exporter rapport d'envasement
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="rounded-md border border-dashed py-10 text-center text-sm text-slate-500">
            Chargement du module envasement...
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
              <Kpi title="Volume initial (Vi)" value={fmt(indicators?.volume_initial_mhm3)} unit="Mm3" />
              <Kpi title="Volume actuel (Vf)" value={fmt(indicators?.volume_current_mhm3)} unit="Mm3" />
              <Kpi title="Volume envasé (Ve)" value={fmt(indicators?.volume_silted_mhm3)} unit="Mm3" />
              <Kpi title="% perte" value={fmt(indicators?.loss_percent)} unit="%" />
              <Kpi title="TEA" value={fmt(indicators?.tea_mhm3_per_year, 3)} unit="Mm3/an" />
              <Kpi title="TER" value={fmt(indicators?.ter_percent_per_year, 3)} unit="%/an" />
              <Kpi title="Durée" value={fmt(indicators?.duration_years, 0)} unit="ans" />
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="border">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Courbes HSV (Volume vs Cote)</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hsvChartData} margin={{ top: 34, right: 18, left: 8, bottom: 32 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="level_m"
                        name="Cote"
                        type="number"
                        domain={[hsvLevelRange.min, hsvLevelRange.max]}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => fmt(Number(value), 0)}
                        {...RECHARTS_X_AXIS_BOTTOM}
                        label={rechartsXAxisBottomLabel("Cote (m)")}
                      />
                      <YAxis
                        domain={[0, hsvVolumeMax]}
                        tick={{ fontSize: 11 }}
                        label={{ value: "Volume (Mm3)", angle: -90, position: "insideLeft" }}
                      />
                      <Tooltip labelFormatter={(value) => `Cote ${fmtFixed(Number(value), 2)} m`} />
                      <Legend
                        verticalAlign="top"
                        align="center"
                        iconType="plainline"
                        height={28}
                        wrapperStyle={{ top: 0 }}
                      />
                      {campaigns.map((campaign) => (
                        <Line
                          key={campaign}
                          type="monotone"
                          dataKey={`campaign_${campaign}`}
                          name={`${campaign}`}
                          stroke={campaignColors.get(campaign) ?? "#0284c7"}
                          strokeWidth={1.8}
                          dot={false}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  {hsvAvailabilityMessage ? (
                    <p className="mt-2 text-xs text-muted-foreground">{hsvAvailabilityMessage}</p>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Mini carte barrage</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  {mapData.basinCoords.length ? (
                    <MapContainerUnsafe center={mapData.basinCoords[0]} zoom={8} style={{ height: "100%", width: "100%" }}>
                      <TileLayerUnsafe
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <PolygonUnsafe positions={mapData.basinCoords} pathOptions={{ color: "#2563eb", weight: 2 }} />
                      {mapData.station ? (
                        <CircleMarkerUnsafe center={mapData.station} radius={6} pathOptions={{ color: "#ea580c" }} />
                      ) : null}
                    </MapContainerUnsafe>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Carte indisponible
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Évolution de l'envasement du barrage (Ve) - Somme par période</CardTitle>
              </CardHeader>
              <CardContent className="h-[320px]">
                <div className="h-full rounded-md border border-slate-100 p-3" style={evolutionBackgroundStyle}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={evolutionPeriodData}
                      margin={{ top: 28, right: 18, left: 10, bottom: 48 }}
                      barCategoryGap="18%"
                    >
                      <defs>
                        {EVOLUTION_BAR_GRADIENTS.map((gradient, index) => (
                          <linearGradient
                            key={`evolution-period-gradient-${index}`}
                            id={`evolution-period-gradient-${index}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor={gradient.top} />
                            <stop offset="100%" stopColor={gradient.bottom} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.7} />
                      <XAxis
                        dataKey="period"
                        interval={0}
                        tickLine={false}
                        axisLine={{ stroke: "#64748b" }}
                        tick={{ fontSize: 12, fontWeight: 600, fill: "#0f172a" }}
                        {...RECHARTS_X_AXIS_BOTTOM}
                        label={rechartsXAxisBottomLabel("Période")}
                      />
                      <YAxis
                        domain={[0, evolutionMax]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: "#475569" }}
                        tickFormatter={(value) => fmt(Number(value), 0)}
                        label={{ value: "Volume envasé (Mm3)", angle: -90, position: "insideLeft" }}
                      />
                        <Tooltip
                          cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                          labelFormatter={(value) => evolutionTooltipLabel(String(value))}
                          formatter={evolutionTooltipFormatter}
                        />
                      <Bar
                        dataKey="volume_silted_mhm3"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={108}
                        stroke="#dbeafe"
                        strokeWidth={2.5}
                      >
                        {evolutionPeriodData.map((entry, index) => (
                          <Cell
                            key={`${entry.period}-cell`}
                            fill={`url(#evolution-period-gradient-${index % EVOLUTION_BAR_GRADIENTS.length})`}
                          />
                        ))}
                        <LabelList
                          dataKey="volume_silted_mhm3"
                          position="top"
                          formatter={(value: number) => fmt(value, 2)}
                          style={{ fontSize: 12, fontWeight: 600, fill: "#0f172a" }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Périodes fixes : {BATHY_PERIOD_DEFINITIONS.map((period) => period.label).join(" | ")}
                  {periodSourceMessage ? ` — ${periodSourceMessage}` : ""}
                </p>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-sm">Tableau bathymétrique</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Recherche campagne/cote/volume..."
                        className="h-9 w-[240px] pl-8"
                      />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSortAsc((value) => !value)}>
                      Tri {sortAsc ? "↑" : "↓"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">Campagne</th>
                        <th className="px-3 py-2 text-left">Cote (m)</th>
                        <th className="px-3 py-2 text-left">Surface (km²)</th>
                        <th className="px-3 py-2 text-left">Volume (Mm³)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRows.map((row, index) => (
                        <tr key={`${row.campaign_year}-${row.level_m}-${index}`} className="border-t">
                          <td className="px-3 py-2">{row.campaign_year}</td>
                          <td className="px-3 py-2">{fmt(row.level_m, 2)}</td>
                          <td className="px-3 py-2">{fmt(row.surface_km2, 3)}</td>
                          <td className="px-3 py-2">{fmt(row.volume_mhm3, 3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!pagedRows.length ? (
                    <div className="p-4 text-sm text-muted-foreground">Aucune donnée.</div>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {sortedRows.length} lignes · page {page}/{totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                      Précédent
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Kpi({ title, value, unit }: { title: string; value: string; unit: string }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="text-[11px] text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">
        {value}
        <span className="ml-1 text-xs font-medium text-slate-500">{unit}</span>
      </p>
    </div>
  );
}
