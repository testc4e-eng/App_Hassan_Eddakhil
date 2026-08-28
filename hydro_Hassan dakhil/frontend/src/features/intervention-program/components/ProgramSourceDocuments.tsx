import { Download, Eye, FileText, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DataQualityNote,
  InterventionSourceDocument,
  SupportedLanguage,
} from "@/features/intervention-program/types/interventionProgram.types";
import { getLocalizedText } from "@/features/intervention-program/utils/interventionProgram.utils";

type ProgramSourceDocumentsProps = {
  documents: InterventionSourceDocument[];
  notes: DataQualityNote[];
  language: SupportedLanguage;
  title: string;
  description: string;
  adminOnlyNotice: string;
};

export function ProgramSourceDocuments({
  documents,
  notes,
  language,
  title,
  description,
  adminOnlyNotice,
}: ProgramSourceDocumentsProps) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-950">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {documents.map((document) => (
            <Card key={document.id} className="border-slate-200/80">
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {getLocalizedText(document.title, language)}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">{document.relativePath}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full text-[11px]">
                    {getLocalizedText(document.category, language)}
                  </Badge>
                  <Badge variant="outline" className="rounded-full text-[11px]">
                    {t("interventionProgram.common.pagesCount", { count: document.pageCount })}
                  </Badge>
                  <Badge variant="outline" className="rounded-full text-[11px]">
                    {document.integratedAt}
                  </Badge>
                </div>

                <p className="text-sm text-slate-700">
                  {getLocalizedText(document.sourceLabel, language)}
                </p>

                <div className="mt-auto flex flex-wrap gap-2">
                  <Button size="sm" className="gap-1.5" asChild>
                    <a href={document.url} target="_blank" rel="noreferrer">
                      <Eye className="h-4 w-4" />
                      {t("interventionProgram.common.view")}
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" asChild>
                    <a href={document.url} download>
                      <Download className="h-4 w-4" />
                      {t("interventionProgram.common.download")}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-950">
            {t("interventionProgram.documents.qualityTitle")}
          </CardTitle>
          <CardDescription>
            {t("interventionProgram.documents.qualityDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={`${note.field}-${note.sourcePage}`}
                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-amber-950">{note.field}</p>
                    <Badge variant="outline" className="rounded-full border-amber-300 text-amber-900">
                      {t("interventionProgram.common.pageReference", { page: note.sourcePage })}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-amber-900">
                    <span className="font-medium">{t("interventionProgram.documents.sourceLabel")}:</span> {note.sourceValue}
                  </p>
                  <p className="mt-1 text-sm text-amber-900">
                    <span className="font-medium">{t("interventionProgram.documents.retainedLabel")}:</span> {note.retainedValue}
                  </p>
                  <p className="mt-1 text-sm text-amber-900">
                    <span className="font-medium">{t("interventionProgram.documents.reasonLabel")}:</span> {getLocalizedText(note.reason, language)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <Lock className="h-4 w-4 text-slate-500" />
              <span>{adminOnlyNotice}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
