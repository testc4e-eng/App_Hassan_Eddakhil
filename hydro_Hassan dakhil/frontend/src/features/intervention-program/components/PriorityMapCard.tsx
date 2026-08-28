import { useState } from "react";
import { Download, Expand, FileText, Info, Layers3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  InterventionMapAsset,
  InterventionSourceDocument,
  SupportedLanguage,
} from "@/features/intervention-program/types/interventionProgram.types";
import { getLocalizedText } from "@/features/intervention-program/utils/interventionProgram.utils";

type PriorityMapCardProps = {
  map: InterventionMapAsset;
  language: SupportedLanguage;
  sourceDocument: InterventionSourceDocument;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export function PriorityMapCard({
  map,
  language,
  sourceDocument,
  secondaryActionLabel,
  onSecondaryAction,
}: PriorityMapCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-lg text-slate-950">
                  {getLocalizedText(map.title, language)}
                </CardTitle>
              </div>
              <CardDescription>{getLocalizedText(map.subtitle, language)}</CardDescription>
            </div>

            <Badge variant="secondary" className="rounded-full text-[11px]">
              {t("interventionProgram.common.pdfPage", { page: map.sourcePage })}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group block w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
            aria-label={getLocalizedText(map.title, language)}
          >
            <img
              src={map.imageUrl}
              alt={getLocalizedText(map.title, language)}
              className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </button>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setOpen(true)}
              aria-label={t("interventionProgram.common.enlargeMapAria")}
            >
              <Expand className="h-4 w-4" />
              {t("interventionProgram.common.enlarge")}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" asChild>
              <a href={map.imageUrl} download={map.relativePath.split("/").pop()}>
                <Download className="h-4 w-4" />
                {t("interventionProgram.common.download")}
              </a>
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" asChild>
              <a href={sourceDocument.url} target="_blank" rel="noreferrer">
                <FileText className="h-4 w-4" />
                {t("interventionProgram.common.sourcePdf")}
              </a>
            </Button>
            {secondaryActionLabel && onSecondaryAction ? (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-emerald-700 hover:text-emerald-800"
                onClick={onSecondaryAction}
              >
                <Info className="h-4 w-4" />
                {secondaryActionLabel}
              </Button>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {map.legend.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="text-xs text-slate-700">{getLocalizedText(item.label, language)}</span>
              </div>
            ))}
          </div>

          {map.note ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {getLocalizedText(map.note, language)}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getLocalizedText(map.title, language)}</DialogTitle>
            <DialogDescription>{getLocalizedText(map.subtitle, language)}</DialogDescription>
          </DialogHeader>
          <img
            src={map.imageUrl}
            alt={getLocalizedText(map.title, language)}
            className="w-full rounded-xl border border-slate-200"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
