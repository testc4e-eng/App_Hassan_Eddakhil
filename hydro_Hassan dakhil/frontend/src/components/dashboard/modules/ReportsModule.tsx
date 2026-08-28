// frontend/src/components/dashboard/modules/ReportsModule.tsx
import { memo, useCallback, useMemo, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  FileType,
  Map,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  missionReports,
  thematicMaps,
  type MissionReport,
  type MissionReportType,
} from "@/data/reportAssets";
import {
  AssetPreviewModal,
  type PreviewAsset,
} from "@/components/dashboard/modules/reports/AssetPreviewModal";
import { ThematicMapCard } from "@/components/dashboard/modules/reports/ThematicMapCard";

type LibraryFilter = "all" | "reports" | "maps";

const MAPS_INITIAL_COUNT = 4;
const MAPS_PAGE_SIZE = 4;

const LIBRARY_COUNTS = {
  reports: missionReports.length,
  maps: thematicMaps.length,
  total: missionReports.length + thematicMaps.length,
} as const;

function reportTypeIcon(type: MissionReportType) {
  if (type === "PDF") return FileText;
  if (type === "Word") return FileType;
  return FileText;
}

function reportTypeBadgeClass(type: MissionReportType) {
  if (type === "PDF") return "border-red-200 bg-red-50 text-red-700";
  if (type === "Word") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

const MissionReportCard = memo(function MissionReportCard({
  report,
  onPreview,
}: {
  report: MissionReport;
  onPreview: (asset: PreviewAsset) => void;
}) {
  const Icon = reportTypeIcon(report.type);

  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-sm">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{report.title}</h3>
            <p className="mt-1 truncate text-xs text-muted-foreground">{report.fileName}</p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn("w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium", reportTypeBadgeClass(report.type))}
        >
          {report.type}
        </Badge>

        {report.category ? (
          <Badge variant="secondary" className="w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium">
            {report.category}
          </Badge>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() =>
              onPreview({
                kind: "report",
                title: report.title,
                fileName: report.fileName,
                url: report.url,
                type: report.type,
              })
            }
          >
            <Eye className="h-4 w-4" />
            Voir
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <a href={report.url} download={report.fileName}>
              <Download className="h-4 w-4" />
              Télécharger
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

const ThematicMapsSection = memo(function ThematicMapsSection({
  visibleMapCount,
  onLoadMore,
  onPreview,
}: {
  visibleMapCount: number;
  onLoadMore: () => void;
  onPreview: (asset: PreviewAsset) => void;
}) {
  const visibleMaps = useMemo(
    () => thematicMaps.slice(0, visibleMapCount),
    [visibleMapCount]
  );
  const remainingMaps = thematicMaps.length - visibleMapCount;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Map className="h-5 w-5 text-emerald-600" />
        <h3 className="text-base font-semibold text-slate-900">Cartes thématiques</h3>
        <Badge variant="secondary" className="rounded-full text-xs">
          {LIBRARY_COUNTS.maps}
        </Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleMaps.map((map) => (
          <ThematicMapCard key={map.id} map={map} onPreview={onPreview} />
        ))}
      </div>
      {remainingMaps > 0 ? (
        <div className="flex justify-center pt-2">
          <Button type="button" variant="outline" onClick={onLoadMore}>
            Afficher plus ({remainingMaps} restante{remainingMaps > 1 ? "s" : ""})
          </Button>
        </div>
      ) : null}
    </section>
  );
});

export function ReportsModule() {
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [previewAsset, setPreviewAsset] = useState<PreviewAsset | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [visibleMapCount, setVisibleMapCount] = useState(MAPS_INITIAL_COUNT);

  const showReports = filter === "all" || filter === "reports";
  const showMaps = filter === "all" || filter === "maps";

  const openPreview = useCallback((asset: PreviewAsset) => {
    setPreviewAsset(asset);
    setPreviewOpen(true);
  }, []);

  const handlePreviewOpenChange = useCallback((open: boolean) => {
    setPreviewOpen(open);
    if (!open) {
      setPreviewAsset(null);
    }
  }, []);

  const loadMoreMaps = useCallback(() => {
    setVisibleMapCount((count) => Math.min(count + MAPS_PAGE_SIZE, thematicMaps.length));
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-8 lg:px-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Rapport & Carte</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Consultation, aperçu et téléchargement des rapports de mission et des cartes
            thématiques du projet Hassan Addakhil.
          </p>
        </div>
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as LibraryFilter)}
          className="shrink-0"
        >
          <TabsList className="grid h-9 grid-cols-3 rounded-full bg-slate-100 p-1">
            <TabsTrigger value="all" className="rounded-full px-4 text-xs">
              Tous ({LIBRARY_COUNTS.total})
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-full px-4 text-xs">
              Rapports ({LIBRARY_COUNTS.reports})
            </TabsTrigger>
            <TabsTrigger value="maps" className="rounded-full px-4 text-xs">
              Cartes ({LIBRARY_COUNTS.maps})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {showReports ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-600" />
            <h3 className="text-base font-semibold text-slate-900">Rapports de mission</h3>
            <Badge variant="secondary" className="rounded-full text-xs">
              {LIBRARY_COUNTS.reports}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {missionReports.map((report) => (
              <MissionReportCard key={report.fileName} report={report} onPreview={openPreview} />
            ))}
          </div>
        </section>
      ) : null}

      {showMaps ? (
        <ThematicMapsSection
          visibleMapCount={visibleMapCount}
          onLoadMore={loadMoreMaps}
          onPreview={openPreview}
        />
      ) : null}

      {previewOpen ? (
        <AssetPreviewModal
          asset={previewAsset}
          open={previewOpen}
          onOpenChange={handlePreviewOpenChange}
        />
      ) : null}
    </div>
  );
}
