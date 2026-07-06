import { useEffect, useState } from "react";
import { Download, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type PreviewAsset =
  | {
      kind: "report";
      title: string;
      fileName: string;
      url: string;
      type: "PDF" | "Word" | "Autre";
    }
  | {
      kind: "map";
      title: string;
      fileName: string;
      url: string;
    };

type AssetPreviewModalProps = {
  asset: PreviewAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AssetPreviewModal({ asset, open, onOpenChange }: AssetPreviewModalProps) {
  const [hdImageSrc, setHdImageSrc] = useState<string | null>(null);
  const [pdfSrc, setPdfSrc] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isPdf = asset?.kind === "report" && asset.type === "PDF";
  const isImage = asset?.kind === "map";

  useEffect(() => {
    if (!open || !asset) {
      setHdImageSrc(null);
      setPdfSrc(null);
      setImageLoaded(false);
      return;
    }

    if (asset.kind === "map") {
      setHdImageSrc(asset.url);
      setPdfSrc(null);
      setImageLoaded(false);
      return;
    }

    if (asset.kind === "report" && asset.type === "PDF") {
      setPdfSrc(asset.url);
      setHdImageSrc(null);
      setImageLoaded(false);
      return;
    }

    setHdImageSrc(null);
    setPdfSrc(null);
    setImageLoaded(false);
  }, [open, asset]);

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[92vh] w-[min(96vw,1100px)] max-w-none flex-col gap-0 overflow-hidden p-0",
          isImage && "w-[min(96vw,1200px)]"
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b px-5 py-4 pr-12">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-left text-base font-semibold">
              {asset.title}
            </DialogTitle>
            <p className="mt-0.5 truncate text-left text-xs text-muted-foreground">{asset.fileName}</p>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 gap-1.5">
            <a href={asset.url} download={asset.fileName}>
              <Download className="h-4 w-4" />
              Télécharger
            </a>
          </Button>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-100/80 p-4">
          {isPdf && pdfSrc ? (
            <iframe
              title={asset.title}
              src={pdfSrc}
              className="h-[min(72vh,820px)] w-full rounded-lg border border-slate-200 bg-white shadow-sm"
            />
          ) : isImage && hdImageSrc ? (
            <div className="relative flex min-h-[min(72vh,820px)] w-full items-center justify-center">
              {!imageLoaded ? (
                <div className="absolute inset-0 animate-pulse rounded-lg bg-slate-200/80" />
              ) : null}
              <img
                src={hdImageSrc}
                alt={asset.title}
                decoding="async"
                fetchPriority="high"
                onLoad={() => setImageLoaded(true)}
                className={cn(
                  "max-h-[min(72vh,820px)] w-auto max-w-full rounded-lg object-contain shadow-md",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              {asset.kind === "report" ? (
                <FileText className="h-12 w-12 text-slate-400" />
              ) : (
                <ImageIcon className="h-12 w-12 text-slate-400" />
              )}
              <p className="max-w-md text-sm text-muted-foreground">
                Aperçu indisponible pour ce type de fichier. Utilisez le bouton Télécharger pour
                consulter le document.
              </p>
              <Button asChild>
                <a href={asset.url} download={asset.fileName}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
