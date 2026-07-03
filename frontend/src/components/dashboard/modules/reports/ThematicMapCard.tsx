import { memo } from "react";
import { Download, ImageIcon, Maximize2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { downloadThematicMap, type ThematicMap } from "@/data/reportAssets";
import type { PreviewAsset } from "@/components/dashboard/modules/reports/AssetPreviewModal";
import { LazyImage } from "@/components/dashboard/modules/reports/LazyImage";

type ThematicMapCardProps = {
  map: ThematicMap;
  onPreview: (asset: PreviewAsset) => void;
};

export const ThematicMapCard = memo(function ThematicMapCard({
  map,
  onPreview,
}: ThematicMapCardProps) {
  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-sm">
      <LazyImage src={map.thumbnailUrl} alt={map.title} />
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-2">
          <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{map.title}</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{map.fileName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() =>
              onPreview({
                kind: "map",
                title: map.title,
                fileName: map.fileName,
                url: map.imageUrl,
              })
            }
          >
            <Maximize2 className="h-4 w-4" />
            Agrandir
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => downloadThematicMap(map)}
          >
            <Download className="h-4 w-4" />
            Télécharger
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
