import { useCallback, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Download, Eye, FileText, Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatFileSize, THEMATIC_MAP_SCENARIOS } from "@/constants/specificDegradationThematicMaps";
import { getScenarioColorTheme } from "@/constants/scenarioColors";
import {
  useSpecificDegradationThematicMaps,
  type ResolvedThematicMap,
} from "@/hooks/useSpecificDegradationThematicMaps";

type RunOption = {
  run_id: number;
  scenario_code: string;
  scenario_name: string;
};

type SpecificDegradationThematicMapsSectionProps = {
  className?: string;
  mode: "simple" | "multi";
  subbasinId: number | null;
  runId: number | null;
  compareRunIds: number[];
  startDate: string;
  endDate: string;
  runOptions: RunOption[];
};

const CARD_WIDTH = 300;
const CARD_GAP = 16;
const THEMATIC_MAP_COUNT = THEMATIC_MAP_SCENARIOS.length;

function formatPeriod(start: string, end: string): string {
  if (!start && !end) return "—";
  if (start && end) return `${start} → ${end}`;
  return start || end;
}

function ThematicMapCardSkeleton() {
  return (
    <div className="flex h-[380px] w-[300px] shrink-0 snap-start flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 rounded-lg" />
        <Skeleton className="h-6 w-4/5" />
      </div>
      <Skeleton className="mt-3 h-10 w-full" />
      <Skeleton className="mt-3 h-6 w-1/2 rounded-full" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="mt-auto flex gap-3 pt-5">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
}

function ThematicMapCard({
  map,
  onView,
  onDownload,
}: {
  map: ResolvedThematicMap;
  onView: (map: ResolvedThematicMap) => void;
  onDownload: (map: ResolvedThematicMap) => void;
}) {
  const fileSizeLabel = formatFileSize(map.resolvedFileSizeBytes);
  const theme = getScenarioColorTheme(map.scenarioCode, map.runId);

  return (
    <article
      className={cn(
        "flex h-[380px] w-[300px] shrink-0 snap-start flex-col rounded-xl border bg-card p-5 transition-all duration-200",
        map.isAvailable ? "hover:-translate-y-0.5" : "border-dashed opacity-90"
      )}
      style={{
        borderColor: map.isAvailable ? theme.border : undefined,
        boxShadow: map.isAvailable ? theme.shadow : undefined,
      }}
      onMouseEnter={(event) => {
        if (!map.isAvailable) return;
        event.currentTarget.style.boxShadow = theme.hoverShadow;
        event.currentTarget.style.borderColor = theme.badge;
      }}
      onMouseLeave={(event) => {
        if (!map.isAvailable) return;
        event.currentTarget.style.boxShadow = theme.shadow;
        event.currentTarget.style.borderColor = theme.border;
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1"
          style={{
            backgroundColor: theme.accent,
            color: theme.icon,
            borderColor: theme.border,
          }}
        >
          <FileText className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug text-foreground">{map.title}</h3>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {map.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className="inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-snug text-white"
          style={{ backgroundColor: theme.badge }}
        >
          {map.scenarioLabel}
        </span>
        {!map.isAvailable ? (
          <Badge variant="outline" className="whitespace-normal text-[11px] text-amber-700">
            PDF non disponible
          </Badge>
        ) : null}
      </div>

      <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="font-medium text-foreground/80">Période</dt>
            <dd className="break-words">{formatPeriod(map.periodStart, map.periodEnd)}</dd>
          </div>
        </div>
        {fileSizeLabel ? (
          <div>
            <dt className="font-medium text-foreground/80">Taille</dt>
            <dd>{fileSizeLabel}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 min-w-0 flex-1"
          disabled={!map.isAvailable}
          onClick={() => onView(map)}
          style={
            map.isAvailable
              ? { borderColor: theme.border, color: theme.icon }
              : undefined
          }
        >
          <Eye className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          Visualiser
        </Button>
        <button
          type="button"
          className="inline-flex h-9 min-w-0 flex-1 items-center justify-center rounded-md px-2 text-[11px] font-semibold leading-tight text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!map.isAvailable}
          onClick={() => onDownload(map)}
          style={map.isAvailable ? { backgroundColor: theme.badge } : undefined}
          title="Télécharger PDF"
        >
          <Download className="mr-1 h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Télécharger PDF</span>
        </button>
      </div>
    </article>
  );
}

export function SpecificDegradationThematicMapsSection({
  className,
  mode,
  subbasinId,
  runId,
  compareRunIds,
  startDate,
  endDate,
  runOptions,
}: SpecificDegradationThematicMapsSectionProps) {
  const { maps, loading, error } = useSpecificDegradationThematicMaps({
    mode,
    subbasinId,
    runId,
    compareRunIds,
    startDate,
    endDate,
    runOptions,
  });

  const [previewMap, setPreviewMap] = useState<ResolvedThematicMap | null>(null);
  const [activePage, setActivePage] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const skeletonCount = THEMATIC_MAP_COUNT;

  const pageCount = useMemo(() => {
    const count = maps.length || THEMATIC_MAP_COUNT;
    return Math.max(1, Math.ceil(count / 3));
  }, [maps.length]);

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      const container = scrollRef.current;
      if (!container) return;

      const stride = (CARD_WIDTH + CARD_GAP) * 3;
      container.scrollBy({ left: direction * stride, behavior: "smooth" });

      setActivePage((page) => {
        const next = page + direction;
        if (next < 0) return 0;
        if (next >= pageCount) return Math.max(0, pageCount - 1);
        return next;
      });
    },
    [pageCount]
  );

  const handleDownload = (map: ResolvedThematicMap) => {
    const anchor = document.createElement("a");
    anchor.href = map.pdfUrl;
    anchor.download = `${map.id}.pdf`;
    anchor.rel = "noopener";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <>
      <Card className={cn("flex w-full flex-col", className)}>
        <CardHeader className="shrink-0 space-y-0 p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="h-5 w-5 text-cyan-700" aria-hidden="true" />
            Cartes thématiques de dégradation spécifique
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="flex gap-4 overflow-hidden pb-2">
              {Array.from({ length: skeletonCount }).map((_, index) => (
                <ThematicMapCardSkeleton key={`thematic-map-skeleton-${index}`} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div className="relative">
              {maps.length > 3 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 rounded-full bg-background shadow-md md:inline-flex"
                    aria-label="Cartes précédentes"
                    onClick={() => scrollByPage(-1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 rounded-full bg-background shadow-md md:inline-flex"
                    aria-label="Cartes suivantes"
                    onClick={() => scrollByPage(1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              ) : null}

              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:thin]"
              >
                {maps.map((map) => (
                  <ThematicMapCard
                    key={map.id}
                    map={map}
                    onView={setPreviewMap}
                    onDownload={handleDownload}
                  />
                ))}
              </div>

              {maps.length > 3 ? (
                <div className="mt-3 flex items-center justify-center gap-2">
                  {Array.from({ length: pageCount }).map((_, index) => (
                    <button
                      key={`thematic-map-page-${index}`}
                      type="button"
                      aria-label={`Page ${index + 1}`}
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        index === activePage ? "bg-cyan-600" : "bg-muted-foreground/30"
                      )}
                      onClick={() => {
                        const container = scrollRef.current;
                        if (!container) return;
                        const stride = (CARD_WIDTH + CARD_GAP) * 3;
                        container.scrollTo({ left: index * stride, behavior: "smooth" });
                        setActivePage(index);
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewMap != null} onOpenChange={(open) => !open && setPreviewMap(null)}>
        <DialogContent className="flex h-[95vh] w-[98vw] max-w-[98vw] flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-4 py-3">
            <DialogTitle className="text-sm">
              {previewMap?.title ?? "Visualisation PDF"}
            </DialogTitle>
          </DialogHeader>
          {previewMap ? (
            <iframe
              title={previewMap.title}
              src={previewMap.pdfUrl}
              className="h-full min-h-0 w-full flex-1 border-0 bg-muted/10"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
