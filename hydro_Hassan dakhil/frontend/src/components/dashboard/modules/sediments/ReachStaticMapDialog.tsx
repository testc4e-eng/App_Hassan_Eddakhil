import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  REACH_STATIC_MAP_DOWNLOAD_NAME,
  REACH_STATIC_MAP_TITLE,
  REACH_STATIC_MAP_URL,
} from "@/constants/reachStaticMap";

type ReachStaticMapDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReachStaticMapDialog({ open, onOpenChange }: ReachStaticMapDialogProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!open) {
      setImageLoaded(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(90vw,1200px)] max-w-none flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b px-5 py-4 pr-12">
          <DialogTitle className="text-left text-base font-semibold">
            {REACH_STATIC_MAP_TITLE}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <a href={REACH_STATIC_MAP_URL} download={REACH_STATIC_MAP_DOWNLOAD_NAME}>
                <Download className="h-4 w-4" />
                Télécharger
              </a>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-auto bg-slate-100/80 p-4">
          <div className="relative mx-auto flex min-h-[50vh] max-h-[calc(90vh-5rem)] items-center justify-center">
            {!imageLoaded ? (
              <div className="absolute inset-0 animate-pulse rounded-lg bg-slate-200/80" />
            ) : null}
            {open ? (
              <img
                src={REACH_STATIC_MAP_URL}
                alt={REACH_STATIC_MAP_TITLE}
                decoding="async"
                onLoad={() => setImageLoaded(true)}
                className={cn(
                  "max-h-[calc(90vh-6rem)] w-full max-w-full object-contain",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
              />
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
