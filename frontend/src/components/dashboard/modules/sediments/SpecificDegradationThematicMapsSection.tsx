import { useState } from "react";
import { Download, Eye, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useSpecificDegradationThematicMaps,
  type ResolvedThematicMap,
} from "@/hooks/useSpecificDegradationThematicMaps";

type SpecificDegradationThematicMapsSectionProps = {
  className?: string;
};

function scenarioBadgeClass(scenario: string): string {
  const key = scenario.toLowerCase();
  if (key.includes("état actuel") || key.includes("etat actuel")) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  if (key.includes("s1")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (key.includes("s2")) return "border-teal-200 bg-teal-50 text-teal-700";
  if (key.includes("s3")) return "border-cyan-200 bg-cyan-50 text-cyan-700";
  if (key.includes("production")) return "border-amber-200 bg-amber-50 text-amber-700";
  if (key.includes("vulnér")) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function ThematicMapCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Skeleton className="h-[200px] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    </div>
  );
}

function ThematicMapCard({
  map,
  onView,
}: {
  map: ResolvedThematicMap;
  onView: (map: ResolvedThematicMap) => void;
}) {
  const downloadHref = map.downloadUrl || map.imageUrl;

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200",
        map.isAvailable ? "hover:shadow-md" : "border-dashed opacity-80",
      )}
    >
      <button
        type="button"
        className="relative flex h-[200px] w-full items-center justify-center overflow-hidden bg-slate-100 text-left"
        disabled={!map.isAvailable}
        onClick={() => onView(map)}
        aria-label={`Visualiser : ${map.title}`}
      >
        {map.isAvailable ? (
          <img
            src={map.imageUrl}
            alt={map.title}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="max-h-full max-w-full object-contain p-1 transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <span className="px-4 text-center text-sm text-muted-foreground">Image non disponible</span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="space-y-1.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {map.title}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {map.description}
          </p>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            scenarioBadgeClass(map.scenario),
          )}
        >
          {map.scenario}
        </Badge>

        <div className="mt-auto flex gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            className="h-9 flex-1 gap-1.5"
            disabled={!map.isAvailable}
            onClick={() => onView(map)}
          >
            <Eye className="h-4 w-4 shrink-0" />
            Voir
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-9 flex-1 gap-1.5"
            disabled={!map.isAvailable}
          >
            <a href={downloadHref} download={map.fileName} rel="noopener">
              <Download className="h-4 w-4 shrink-0" />
              Télécharger
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function SpecificDegradationThematicMapsSection({
  className,
}: SpecificDegradationThematicMapsSectionProps) {
  const { maps, loading, error } = useSpecificDegradationThematicMaps();
  const [previewMap, setPreviewMap] = useState<ResolvedThematicMap | null>(null);

  const previewDownloadHref = previewMap
    ? previewMap.downloadUrl || previewMap.imageUrl
    : undefined;

  return (
    <>
      <Card className={cn("w-full", className)}>
        <CardHeader className="space-y-1 p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="h-5 w-5 text-cyan-700" aria-hidden="true" />
            Cartes thématiques de dégradation spécifique
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ThematicMapCardSkeleton key={`thematic-map-skeleton-${index}`} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {maps.map((map) => (
                <ThematicMapCard key={map.id} map={map} onView={setPreviewMap} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewMap != null} onOpenChange={(open) => !open && setPreviewMap(null)}>
        <DialogContent className="flex max-h-[95vh] w-[min(96vw,1200px)] max-w-none flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-border px-4 py-3 pr-12">
            <DialogTitle className="text-left text-sm leading-snug sm:text-base">
              {previewMap?.title ?? "Carte thématique"}
            </DialogTitle>
            {previewMap && previewDownloadHref ? (
              <Button asChild size="sm" variant="outline" className="absolute right-12 top-3 h-8 gap-1.5">
                <a href={previewDownloadHref} download={previewMap.fileName} rel="noopener">
                  <Download className="h-3.5 w-3.5" />
                  Télécharger
                </a>
              </Button>
            ) : null}
          </DialogHeader>
          {previewMap ? (
            <div className="overflow-auto bg-slate-100/80 p-4">
              <img
                src={previewMap.imageUrl}
                alt={previewMap.title}
                decoding="async"
                className="mx-auto max-h-[78vh] w-full object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
