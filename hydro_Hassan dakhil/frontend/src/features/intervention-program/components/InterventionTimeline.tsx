import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  InterventionAction,
  InterventionAxis,
  InterventionProgramYear,
  SupportedLanguage,
} from "@/features/intervention-program/types/interventionProgram.types";
import { getAxisActions, getLocalizedText } from "@/features/intervention-program/utils/interventionProgram.utils";

type InterventionTimelineProps = {
  axes: InterventionAxis[];
  actions: InterventionAction[];
  years: InterventionProgramYear[];
  language: SupportedLanguage;
  title: string;
  description: string;
};

export function InterventionTimeline({
  axes,
  actions,
  years,
  language,
  title,
  description,
}: InterventionTimelineProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-950">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[780px]">
            <div className="grid grid-cols-[220px_repeat(5,minmax(90px,1fr))] gap-2">
              <div />
              {years.map((year) => (
                <div
                  key={year}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-800"
                >
                  {year}
                </div>
              ))}

              {axes.map((axis) => {
                const axisActions = getAxisActions(axis.id, actions);

                return (
                  <Fragment key={axis.id}>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {getLocalizedText(axis.name, language)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("interventionProgram.common.actionsCount", { count: axisActions.length })}
                      </p>
                    </div>

                    {years.map((year) => {
                      const activeActions = axisActions.filter((action) => action.years.includes(year));
                      const isActive = activeActions.length > 0;

                      return (
                        <Tooltip key={`${axis.id}-${year}`}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label={`${getLocalizedText(axis.name, language)} - ${year}`}
                              className="flex min-h-[84px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 text-center transition-colors hover:border-slate-300 hover:bg-slate-50"
                            >
                              {isActive ? (
                                <div
                                  className="flex w-full flex-col items-center justify-center rounded-xl px-2 py-3 text-white shadow-sm"
                                  style={{ backgroundColor: axis.color }}
                                >
                                  <span className="text-lg font-semibold">{activeActions.length}</span>
                                  <span className="text-[11px] uppercase tracking-[0.12em] text-white/80">
                                    {t("interventionProgram.common.active")}
                                  </span>
                                </div>
                              ) : (
                                <Badge variant="outline" className="border-dashed text-slate-400">
                                  -
                                </Badge>
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-slate-950">
                                {getLocalizedText(axis.name, language)} - {year}
                              </p>
                              {isActive ? (
                                activeActions.map((action) => (
                                  <p key={action.id} className="text-xs leading-5 text-slate-700">
                                    {action.code} - {getLocalizedText(action.title, language)}
                                  </p>
                                ))
                              ) : (
                                <p className="text-xs text-slate-700">
                                  {t("interventionProgram.common.noDocumentedAction")}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
