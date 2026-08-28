import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  DegradationClassDefinition,
  DistanceClassDefinition,
  PriorityClassInfo,
  PriorityMatrixRow,
  SupportedLanguage,
} from "@/features/intervention-program/types/interventionProgram.types";
import { getLocalizedText } from "@/features/intervention-program/utils/interventionProgram.utils";

type PriorityMatrixProps = {
  title: string;
  description: string;
  rows: PriorityMatrixRow[];
  degradationClasses: DegradationClassDefinition[];
  distanceClasses: DistanceClassDefinition[];
  priorityInfo: PriorityClassInfo[];
  language: SupportedLanguage;
};

export function PriorityMatrix({
  title,
  description,
  rows,
  degradationClasses,
  distanceClasses,
  priorityInfo,
  language,
}: PriorityMatrixProps) {
  const { t } = useTranslation();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selectedCell = useMemo(() => {
    if (!selectedKey) return null;

    const [degradationId, distanceId] = selectedKey.split("|");
    const row = rows.find((item) => item.degradationClassId === degradationId);
    const degradation = degradationClasses.find((item) => item.id === degradationId);
    const distance = distanceClasses.find((item) => item.id === distanceId);
    const priority = priorityInfo.find(
      (item) => item.id === row?.priorities[distanceId as DistanceClassDefinition["id"]]
    );

    if (!row || !degradation || !distance || !priority) return null;

    return { degradation, distance, priority };
  }, [degradationClasses, distanceClasses, priorityInfo, rows, selectedKey]);

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-950">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-separate border-spacing-2">
            <thead>
              <tr>
                <th className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800">
                  {t("interventionProgram.common.specificDegradation")}
                </th>
                {distanceClasses.map((distance) => (
                  <th
                    key={distance.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-800"
                  >
                    {getLocalizedText(distance.rangeLabel, language)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const degradation = degradationClasses.find((item) => item.id === row.degradationClassId);
                if (!degradation) return null;

                return (
                  <tr key={row.degradationClassId}>
                    <td className="rounded-2xl border border-slate-200 bg-white px-4 py-4 align-top">
                      <p className="text-sm font-semibold text-slate-900">
                        {getLocalizedText(degradation.rangeLabel, language)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {getLocalizedText(degradation.erosionLevel, language)}
                      </p>
                    </td>

                    {distanceClasses.map((distance) => {
                      const priority = priorityInfo.find((item) => item.id === row.priorities[distance.id]);
                      if (!priority) return null;

                      const cellKey = `${row.degradationClassId}|${distance.id}`;

                      return (
                        <td key={distance.id} className="p-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setSelectedKey(cellKey)}
                                className="flex h-full min-h-[92px] w-full items-center justify-center rounded-2xl px-3 py-4 text-center text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.01]"
                                style={{ backgroundColor: priority.color }}
                                aria-label={`${getLocalizedText(degradation.rangeLabel, language)} - ${getLocalizedText(distance.rangeLabel, language)} - ${priority.id}`}
                              >
                                {priority.id}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-950">
                                  {priority.id} - {getLocalizedText(priority.level, language)}
                                </p>
                                <p className="text-xs text-slate-700">
                                  {getLocalizedText(degradation.rangeLabel, language)} / {getLocalizedText(distance.rangeLabel, language)}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2">
          {priorityInfo.map((priority) => (
            <Badge
              key={priority.id}
              className="rounded-full border-0 px-3 py-1 text-white"
              style={{ backgroundColor: priority.color }}
            >
              {priority.id} - {getLocalizedText(priority.level, language)}
            </Badge>
          ))}
        </div>

        {selectedCell ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">
              {selectedCell.priority.id} - {getLocalizedText(selectedCell.priority.level, language)}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-medium">{t("interventionProgram.common.degradation")}:</span>{" "}
              {getLocalizedText(selectedCell.degradation.rangeLabel, language)}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-medium">{t("interventionProgram.common.distance")}:</span>{" "}
              {getLocalizedText(selectedCell.distance.rangeLabel, language)}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-medium">{t("interventionProgram.common.interpretation")}:</span>{" "}
              {getLocalizedText(selectedCell.priority.interpretation, language)}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
