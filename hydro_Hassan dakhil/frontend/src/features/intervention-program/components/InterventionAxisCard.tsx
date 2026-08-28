import { Activity, Hammer, Leaf, Users, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  InterventionAction,
  InterventionAxis,
  SupportedLanguage,
} from "@/features/intervention-program/types/interventionProgram.types";
import {
  formatMdh,
  getActionCountByAxis,
  getLocalizedText,
} from "@/features/intervention-program/utils/interventionProgram.utils";

const ICONS: Record<InterventionAxis["iconKey"], LucideIcon> = {
  leaf: Leaf,
  hammer: Hammer,
  waves: Waves,
  binoculars: Activity,
  users: Users,
  wallet: Activity,
  target: Activity,
  trees: Leaf,
  shield: Activity,
};

type InterventionAxisCardProps = {
  axis: InterventionAxis;
  actions: InterventionAction[];
  language: SupportedLanguage;
  viewActionsLabel: string;
  onViewActions: (axisId: InterventionAxis["id"]) => void;
};

export function InterventionAxisCard({
  axis,
  actions,
  language,
  viewActionsLabel,
  onViewActions,
}: InterventionAxisCardProps) {
  const { t } = useTranslation();
  const Icon = ICONS[axis.iconKey] ?? Activity;
  const actionCount = getActionCountByAxis(axis.id, actions);

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="secondary" className="rounded-full text-[11px]">
              {getLocalizedText(axis.shortLabel, language)}
            </Badge>
            <h3 className="text-lg font-semibold text-slate-950">
              {getLocalizedText(axis.name, language)}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {getLocalizedText(axis.summary, language)}
            </p>
          </div>
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
            style={{ backgroundColor: axis.color }}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
              {t("interventionProgram.common.budget")}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {formatMdh(axis.budgetMdh, language)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
              {t("interventionProgram.common.actions")}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{actionCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
              {t("interventionProgram.common.keyMetric")}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {getLocalizedText(axis.keyMetric, language)}
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <p className="max-w-sm text-xs text-muted-foreground">
            {getLocalizedText(axis.description, language)}
          </p>
          <Button size="sm" variant="outline" onClick={() => onViewActions(axis.id)}>
            {viewActionsLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
