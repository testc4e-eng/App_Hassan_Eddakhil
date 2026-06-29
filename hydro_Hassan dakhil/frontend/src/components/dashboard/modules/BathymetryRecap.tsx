import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Waves } from "lucide-react";
import { hydroApi, type ReservoirBathymetryPoint } from "@/api/hydro";
import { ChartModeSelect } from "@/components/charts/ChartModeSelect";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChartDisplayMode } from "@/types/chart";
import {
  hasStrictlyPositiveValues,
  transformSeriesForDisplayMode,
} from "@/lib/chartDisplayMode";

type ReservoirOption = {
  key: string;
  name: string;
  code: string | null;
  count: number;
};

type AnnualBathymetryRow = {
  year: number;
  volumeAtNormalCoteHm3: number;
  siltationRateHm3PerYear: number;
  siltationRateM3PerYear: number;
  cumulativeSiltationHm3: number;
  cumulativeSiltationM3: number;
};

const COMMISSIONING_YEAR = 1971;
const REFERENCE_NORMAL_VOLUME_HM3 = 312;
const CUBIC_METERS_PER_HM3 = 1_000_000;

function toFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function reservoirKey(row: ReservoirBathymetryPoint): string {
  return (
    row.reservoir_key ||
    (row.reservoir_id !== null && row.reservoir_id !== undefined
      ? String(row.reservoir_id)
      : row.reservoir_code || row.reservoir_name || "reservoir")
  );
}

function formatNumber(value: unknown, maximumFractionDigits = 2): string {
  const n = toFiniteNumber(value);
  if (n === null) return "-";
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits,
  }).format(n);
}

function minValue(values: Array<number | null>): number | null {
  const finite = values.filter((value): value is number => value !== null);
  return finite.length ? Math.min(...finite) : null;
}

function maxValue(values: Array<number | null>): number | null {
  const finite = values.filter((value): value is number => value !== null);
  return finite.length ? Math.max(...finite) : null;
}

function MetricTile({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-md border bg-white px-3 py-2 shadow-sm">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">
        {value}
        {unit ? <span className="ml-1 text-xs font-medium text-slate-500">{unit}</span> : null}
      </p>
    </div>
  );
}

export function BathymetryRecap() {
  const [rows, setRows] = useState<ReservoirBathymetryPoint[]>([]);
  const [selectedReservoirKey, setSelectedReservoirKey] = useState<string>("");
  const [profileDisplayMode, setProfileDisplayMode] = useState<ChartDisplayMode>("normal");
  const [annualDisplayMode, setAnnualDisplayMode] = useState<ChartDisplayMode>("normal");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    hydroApi
      .getBathymetry()
      .then((data) => {
        if (!active) return;
        setRows(data ?? []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const reservoirs = useMemo<ReservoirOption[]>(() => {
    const byKey = new Map<string, ReservoirOption>();

    rows.forEach((row) => {
      const key = reservoirKey(row);
      const existing = byKey.get(key);

      if (existing) {
        existing.count += 1;
        return;
      }

      byKey.set(key, {
        key,
        name: row.reservoir_name || row.reservoir_code || "Barrage",
        code: row.reservoir_code,
        count: 1,
      });
    });

    return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  useEffect(() => {
    if (!reservoirs.length) return;
    if (!selectedReservoirKey || !reservoirs.some((r) => r.key === selectedReservoirKey)) {
      setSelectedReservoirKey(reservoirs[0].key);
    }
  }, [reservoirs, selectedReservoirKey]);

  const selectedRows = useMemo(() => {
    const key = selectedReservoirKey || reservoirs[0]?.key;
    return rows
      .filter((row) => !key || reservoirKey(row) === key)
      .sort((a, b) => {
        const levelA = toFiniteNumber(a.level_m) ?? Number.POSITIVE_INFINITY;
        const levelB = toFiniteNumber(b.level_m) ?? Number.POSITIVE_INFINITY;
        return levelA - levelB;
      });
  }, [reservoirs, rows, selectedReservoirKey]);

  const chartData = useMemo(
    () =>
      selectedRows
        .map((row) => ({
          ...row,
          level_m: toFiniteNumber(row.level_m),
          volume_hm3: toFiniteNumber(row.volume_hm3),
          area_km2: toFiniteNumber(row.area_km2),
        }))
        .filter(
          (row) =>
            row.level_m !== null &&
            (row.volume_hm3 !== null || row.area_km2 !== null)
        ),
    [selectedRows]
  );

  const stats = useMemo(() => {
    const levels = selectedRows.map((row) => toFiniteNumber(row.level_m));
    const volumes = selectedRows.map((row) => toFiniteNumber(row.volume_hm3));
    const areas = selectedRows.map((row) => toFiniteNumber(row.area_km2));

    return {
      points: selectedRows.length,
      minLevel: minValue(levels),
      maxLevel: maxValue(levels),
      maxVolume: maxValue(volumes),
      maxArea: maxValue(areas),
    };
  }, [selectedRows]);

  const selectedReservoir = reservoirs.find((r) => r.key === selectedReservoirKey);
  const firstUsefulRowIndex = selectedRows.findIndex((row) => {
    const volume = toFiniteNumber(row.volume_hm3) ?? 0;
    const area = toFiniteNumber(row.area_km2) ?? 0;
    return volume > 0 && area > 0;
  });
  const tableRows =
    firstUsefulRowIndex >= 0 ? selectedRows.slice(firstUsefulRowIndex) : selectedRows;
  const displayedRows = tableRows.slice(0, 300);
  const hasVolume = chartData.some((row) => row.volume_hm3 !== null);
  const hasArea = chartData.some((row) => row.area_km2 !== null);
  const profileChartTransformed = useMemo(
    () =>
      transformSeriesForDisplayMode({
        mode: profileDisplayMode,
        rows: chartData as Array<Record<string, unknown>>,
        xKey: "level_m",
        valueKeys: ["volume_hm3", "area_km2"],
        normalLabel: "Cote (m)",
      }),
    [chartData, profileDisplayMode]
  );
  const profileHasLoggableValues = useMemo(
    () =>
      hasStrictlyPositiveValues(
        chartData as Array<Record<string, unknown>>,
        ["volume_hm3", "area_km2"]
      ),
    [chartData]
  );
  const normalCote = stats.maxLevel;
  const bathymetricNormalVolume = stats.maxVolume;

  const annualEvolution = useMemo(() => {
    const normalVolume = bathymetricNormalVolume;
    const latestYear = new Date().getFullYear();
    const yearsCount = latestYear - COMMISSIONING_YEAR;

    if (normalVolume === null || yearsCount <= 0 || normalVolume <= REFERENCE_NORMAL_VOLUME_HM3) {
      return {
        annualSiltationRate: null,
        annualSiltationPercent: null,
        rows: [] as AnnualBathymetryRow[],
      };
    }

    const annualSiltationRate =
      (normalVolume - REFERENCE_NORMAL_VOLUME_HM3) / yearsCount;
    const annualSiltationPercent = (annualSiltationRate / normalVolume) * 100;
    const rows: AnnualBathymetryRow[] = [];

    for (let year = COMMISSIONING_YEAR; year <= latestYear; year += 1) {
      const elapsedYears = year - COMMISSIONING_YEAR;
      const cumulativeSiltationHm3 = annualSiltationRate * elapsedYears;
      rows.push({
        year,
        volumeAtNormalCoteHm3: normalVolume - cumulativeSiltationHm3,
        siltationRateHm3PerYear: annualSiltationRate,
        siltationRateM3PerYear: annualSiltationRate * CUBIC_METERS_PER_HM3,
        cumulativeSiltationHm3,
        cumulativeSiltationM3: cumulativeSiltationHm3 * CUBIC_METERS_PER_HM3,
      });
    }

    return { annualSiltationRate, annualSiltationPercent, rows };
  }, [bathymetricNormalVolume]);

  const annualChartTransformed = useMemo(
    () =>
      transformSeriesForDisplayMode({
        mode: annualDisplayMode,
        rows: annualEvolution.rows as Array<Record<string, unknown>>,
        xKey: "year",
        valueKeys: ["volumeAtNormalCoteHm3", "siltationRateM3PerYear"],
        normalLabel: "Annee",
      }),
    [annualDisplayMode, annualEvolution.rows]
  );

  const annualHasLoggableValues = useMemo(
    () =>
      hasStrictlyPositiveValues(
        annualEvolution.rows as Array<Record<string, unknown>>,
        ["volumeAtNormalCoteHm3", "siltationRateM3PerYear"]
      ),
    [annualEvolution.rows]
  );

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                <Waves className="h-4 w-4" />
              </span>
              <CardTitle className="text-base">Récap bathymétrie</CardTitle>
              {selectedReservoir?.code ? (
                <Badge variant="outline" className="border-cyan-200 text-cyan-800">
                  {selectedReservoir.code}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Profil cote-volume-surface du barrage, exposé comme donnée métier hydro.
            </p>
          </div>

          {reservoirs.length > 1 ? (
            <div className="w-full lg:w-[280px]">
              <Select value={selectedReservoirKey} onValueChange={setSelectedReservoirKey}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Choisir un barrage" />
                </SelectTrigger>
                <SelectContent>
                  {reservoirs.map((reservoir) => (
                    <SelectItem key={reservoir.key} value={reservoir.key}>
                      {reservoir.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4">
        {loading ? (
          <div className="rounded-md border border-dashed py-10 text-center text-sm text-slate-500">
            Chargement de la bathymétrie...
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Impossible de charger la bathymétrie : {error}
          </div>
        ) : !rows.length ? (
          <div className="rounded-md border border-dashed py-10 text-center text-sm text-slate-500">
            Aucune donnée bathymétrique n'est exposée par l'API pour le moment.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricTile label="Points" value={formatNumber(stats.points, 0)} />
              <MetricTile
                label="Cote min / max"
                value={`${formatNumber(stats.minLevel, 2)} - ${formatNumber(stats.maxLevel, 2)}`}
                unit="m"
              />
              <MetricTile
                label="Volume max"
                value={formatNumber(stats.maxVolume, 2)}
                unit="hm3"
              />
              <MetricTile
                label="Surface max"
                value={formatNumber(stats.maxArea, 2)}
                unit="km2"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-md border bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Courbe cote-volume-surface
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {selectedReservoir?.name ?? "Barrage"}
                    </span>
                    <ChartModeSelect value={profileDisplayMode} onValueChange={setProfileDisplayMode} />
                  </div>
                </div>

                <div className="h-[320px]">
                  {profileDisplayMode === "logarithmic" && profileChartTransformed.excludedForLog > 0 ? (
                    <div className="mb-2 text-xs text-muted-foreground">
                      Les valeurs inferieures ou egales a 0 sont exclues en mode logarithmique.
                    </div>
                  ) : null}
                  {profileDisplayMode === "logarithmic" && !profileHasLoggableValues && chartData.length ? (
                    <div className="mb-2 text-xs text-amber-700">
                      Mode logarithmique impossible : aucune valeur strictement positive.
                    </div>
                  ) : null}
                  {chartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={profileChartTransformed.data}
                        margin={{ top: 10, right: 16, bottom: 12, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey={profileChartTransformed.xKey}
                          name="Cote"
                          type="number"
                          domain={profileChartTransformed.xKey === "probability" ? [0, 100] : ["dataMin", "dataMax"]}
                          tickFormatter={(value) =>
                            profileChartTransformed.xKey === "probability"
                              ? `${Number(value).toFixed(0)}%`
                              : formatNumber(value, 0)
                          }
                          stroke="#64748b"
                          tick={{ fontSize: 12 }}
                          label={{ value: profileChartTransformed.xLabel, position: "insideBottom", offset: -10 }}
                        />
                        {hasVolume ? (
                          <YAxis
                            yAxisId="volume"
                            tickFormatter={(value) => formatNumber(value, 0)}
                            stroke="#0f766e"
                            tick={{ fontSize: 12 }}
                            scale={profileDisplayMode === "logarithmic" ? "log" : "auto"}
                            domain={["auto", "auto"]}
                          />
                        ) : null}
                        {hasArea ? (
                          <YAxis
                            yAxisId="area"
                            orientation="right"
                            tickFormatter={(value) => formatNumber(value, 1)}
                            stroke="#0369a1"
                            tick={{ fontSize: 12 }}
                            scale={profileDisplayMode === "logarithmic" ? "log" : "auto"}
                            domain={["auto", "auto"]}
                          />
                        ) : null}
                        <Tooltip
                          labelFormatter={(value) =>
                            profileChartTransformed.xKey === "probability"
                              ? `Probabilite de depassement: ${Number(value).toFixed(2)}%`
                              : `Cote ${formatNumber(value, 2)} m`
                          }
                          formatter={(value, name) => [
                            formatNumber(value, 2),
                            String(name),
                          ]}
                        />
                        <Legend />
                        {hasVolume ? (
                          <Line
                            yAxisId="volume"
                            type="monotone"
                            dataKey="volume_hm3"
                            name="Volume (hm3)"
                            stroke="#0f766e"
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                          />
                        ) : null}
                        {hasArea ? (
                          <Line
                            yAxisId="area"
                            type="monotone"
                            dataKey="area_km2"
                            name="Surface (km2)"
                            stroke="#0369a1"
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                          />
                        ) : null}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Données insuffisantes pour tracer la courbe.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-md border bg-white">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">Tableau bathymétrique</p>
                  <span className="text-xs text-slate-500">
                    {firstUsefulRowIndex > 0 ? `${firstUsefulRowIndex} lignes initiales masquees · ` : ""}
                    {displayedRows.length < tableRows.length
                      ? `${displayedRows.length}/${tableRows.length}`
                      : `${tableRows.length}`}
                  </span>
                </div>

                <ScrollArea className="h-[320px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Cote (m)</TableHead>
                        <TableHead>Volume (hm3)</TableHead>
                        <TableHead>Surface (km2)</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedRows.map((row, index) => (
                        <TableRow key={`${reservoirKey(row)}-${row.bathy_id ?? index}`}>
                          <TableCell>{formatNumber(row.level_m, 2)}</TableCell>
                          <TableCell>{formatNumber(row.volume_hm3, 2)}</TableCell>
                          <TableCell>{formatNumber(row.area_km2, 3)}</TableCell>
                          <TableCell className="text-slate-500">
                            {row.source || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>

            <div className="rounded-md border bg-slate-50/60 p-3">
              <div className="mb-3 flex flex-col gap-1 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Evolution annuelle estimee a la cote normale
                  </p>
                  <p className="text-xs text-slate-500">
                    Taux d'envasement moyen et volume disponible a la cote normale.
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  Reference: mise en service {COMMISSIONING_YEAR}
                </span>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricTile
                  label="Cote normale"
                  value={formatNumber(normalCote, 2)}
                  unit="m"
                />
                <MetricTile
                  label="Volume a cote normale"
                  value={formatNumber(bathymetricNormalVolume, 2)}
                  unit="hm3"
                />
                <MetricTile
                  label="Volume retenue reference"
                  value={formatNumber(REFERENCE_NORMAL_VOLUME_HM3, 2)}
                  unit="hm3"
                />
                <MetricTile
                  label="Taux moyen d'envasement"
                  value={formatNumber(
                    annualEvolution.annualSiltationRate !== null
                      ? annualEvolution.annualSiltationRate * CUBIC_METERS_PER_HM3
                      : null,
                    0
                  )}
                  unit="m3/an"
                />
              </div>

              {annualEvolution.rows.length ? (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-md border bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Volume annuel a la cote normale
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {formatNumber(annualEvolution.annualSiltationPercent, 3)} %/an
                        </span>
                        <ChartModeSelect value={annualDisplayMode} onValueChange={setAnnualDisplayMode} />
                      </div>
                    </div>

                    <div className="h-[280px]">
                      {annualDisplayMode === "logarithmic" && annualChartTransformed.excludedForLog > 0 ? (
                        <div className="mb-2 text-xs text-muted-foreground">
                          Les valeurs inferieures ou egales a 0 sont exclues en mode logarithmique.
                        </div>
                      ) : null}
                      {annualDisplayMode === "logarithmic" && !annualHasLoggableValues && annualEvolution.rows.length ? (
                        <div className="mb-2 text-xs text-amber-700">
                          Mode logarithmique impossible : aucune valeur strictement positive.
                        </div>
                      ) : null}
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={annualChartTransformed.data}
                          margin={{ top: 10, right: 16, bottom: 12, left: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey={annualChartTransformed.xKey}
                            type="number"
                            domain={annualChartTransformed.xKey === "probability" ? [0, 100] : ["dataMin", "dataMax"]}
                            stroke="#64748b"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) =>
                              annualChartTransformed.xKey === "probability"
                                ? `${Number(value).toFixed(0)}%`
                                : String(value)
                            }
                            label={{ value: annualChartTransformed.xLabel, position: "insideBottom", offset: -10 }}
                          />
                          <YAxis
                            yAxisId="volume"
                            tickFormatter={(value) => formatNumber(value, 0)}
                            stroke="#0f766e"
                            tick={{ fontSize: 12 }}
                            scale={annualDisplayMode === "logarithmic" ? "log" : "auto"}
                            domain={["auto", "auto"]}
                          />
                          <YAxis
                            yAxisId="siltation"
                            orientation="right"
                            tickFormatter={(value) => formatNumber(value, 0)}
                            stroke="#b45309"
                            tick={{ fontSize: 12 }}
                            scale={annualDisplayMode === "logarithmic" ? "log" : "auto"}
                            domain={["auto", "auto"]}
                          />
                          <Tooltip
                            labelFormatter={(value) =>
                              annualChartTransformed.xKey === "probability"
                                ? `Probabilite de depassement: ${Number(value).toFixed(2)}%`
                                : `Annee ${value}`
                            }
                            formatter={(value, name) => [
                              String(name).includes("m3/an")
                                ? formatNumber(value, 0)
                                : formatNumber(value, 3),
                              String(name),
                            ]}
                          />
                          <Legend />
                          <Line
                            yAxisId="volume"
                            type="monotone"
                            dataKey="volumeAtNormalCoteHm3"
                            name="Volume cote normale (hm3)"
                            stroke="#0f766e"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            yAxisId="siltation"
                            type="monotone"
                            dataKey="siltationRateM3PerYear"
                            name="Taux envasement (m3/an)"
                            stroke="#b45309"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-md border bg-white">
                    <div className="flex items-center justify-between border-b px-3 py-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Tableau annuel
                      </p>
                      <span className="text-xs text-slate-500">
                        {annualEvolution.rows.length} annees
                      </span>
                    </div>

                    <ScrollArea className="h-[280px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white">
                          <TableRow>
                            <TableHead>Annee</TableHead>
                            <TableHead>Volume (hm3)</TableHead>
                            <TableHead>Taux (m3/an)</TableHead>
                            <TableHead>Envase cumule (m3)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {annualEvolution.rows.map((row) => (
                            <TableRow key={row.year}>
                              <TableCell>{row.year}</TableCell>
                              <TableCell>
                                {formatNumber(row.volumeAtNormalCoteHm3, 2)}
                              </TableCell>
                              <TableCell>
                                {formatNumber(row.siltationRateM3PerYear, 0)}
                              </TableCell>
                              <TableCell>
                                {formatNumber(row.cumulativeSiltationM3, 0)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed bg-white py-8 text-center text-sm text-slate-500">
                  Donnees insuffisantes pour calculer le taux d'envasement annuel.
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
