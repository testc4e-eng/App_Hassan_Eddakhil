import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
  InterventionAction,
  InterventionSpeciesGroup,
  SupportedLanguage,
} from "@/features/intervention-program/types/interventionProgram.types";
import {
  formatArea,
  formatMdh,
  getLocalizedText,
} from "@/features/intervention-program/utils/interventionProgram.utils";

type ActionDetailsDrawerProps = {
  action: InterventionAction | null;
  speciesGroups: InterventionSpeciesGroup[];
  language: SupportedLanguage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ActionDetailsBody({
  action,
  speciesGroups,
  language,
}: Omit<ActionDetailsDrawerProps, "open" | "onOpenChange">) {
  const { t } = useTranslation();
  if (!action) return null;

  const relatedSpeciesGroups = speciesGroups.filter((group) =>
    (action.speciesGroupIds ?? []).includes(group.id)
  );

  return (
    <div className="space-y-5 px-4 pb-6 sm:px-0">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="rounded-full">
          {action.code}
        </Badge>
        <Badge variant="outline" className="rounded-full">
          {formatMdh(action.budgetMdh, language)}
        </Badge>
        {action.priorityClasses?.map((priority) => (
          <Badge key={priority} variant="outline" className="rounded-full">
            {priority}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200/80">
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                {t("interventionProgram.common.objective")}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-800">
                {getLocalizedText(action.objective, language)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                {t("interventionProgram.common.target")}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-800">
                {getLocalizedText(action.target, language)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                {t("interventionProgram.common.period")}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">{action.years.join(" - ")}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                {t("interventionProgram.common.interventionType")}
              </p>
              <p className="mt-2 text-sm text-slate-800">
                {getLocalizedText(action.interventionType, language)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                {t("interventionProgram.common.targetZone")}
              </p>
              <p className="mt-2 text-sm text-slate-800">
                {getLocalizedText(action.zoneTarget, language)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  {t("interventionProgram.common.budget")}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {formatMdh(action.budgetMdh, language)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  {t("interventionProgram.common.surfaceOrQuantity")}
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  {action.areaHa
                    ? formatArea(action.areaHa, language)
                    : action.areaRangeHa
                      ? `${formatArea(action.areaRangeHa.min, language)} - ${formatArea(
                          action.areaRangeHa.max,
                          language
                        )}`
                      : action.quantityLabel
                        ? getLocalizedText(action.quantityLabel, language)
                        : t("interventionProgram.actions.notSpecified")}
                </p>
              </div>
            </div>
            {action.unitCost ? (
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  {t("interventionProgram.common.unitCost")}
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  {getLocalizedText(action.unitCost, language)}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80">
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
            {t("interventionProgram.common.yearlyBreakdown")}
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {action.years.map((year) => (
              <div key={year} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{year}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {action.phaseByYear[year]
                    ? getLocalizedText(action.phaseByYear[year]!, language)
                    : t("interventionProgram.calendar.continuousAction")}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {relatedSpeciesGroups.length > 0 ? (
        <Card className="border-slate-200/80">
          <CardContent className="space-y-4 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
              {t("interventionProgram.common.relatedSpecies")}
            </p>
            {relatedSpeciesGroups.map((group) => (
              <div key={group.id} className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">
                  {getLocalizedText(group.title, language)}
                </p>
                <div className="grid gap-3 lg:grid-cols-2">
                  {group.species.map((species) => (
                    <div key={`${group.id}-${species.name.fr}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {getLocalizedText(species.name, language)}
                        {species.scientificName ? (
                          <span className="ml-2 font-normal italic text-slate-500">
                            ({species.scientificName})
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {getLocalizedText(species.characteristics, language)}
                      </p>
                      <p className="mt-2 text-xs font-medium text-emerald-700">
                        {getLocalizedText(species.preferredUse, language)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {action.notes?.length ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-amber-800">
              {t("interventionProgram.common.watchouts")}
            </p>
            {action.notes.map((note) => (
              <p key={note.fr} className="text-sm leading-6 text-amber-900">
                {getLocalizedText(note, language)}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function ActionDetailsDrawer({
  action,
  speciesGroups,
  language,
  open,
  onOpenChange,
}: ActionDetailsDrawerProps) {
  const isMobile = useIsMobile();
  const title = action ? `${action.code} - ${getLocalizedText(action.title, language)}` : "";
  const description = action ? getLocalizedText(action.status, language) : "";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <ActionDetailsBody action={action} speciesGroups={speciesGroups} language={language} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ActionDetailsBody action={action} speciesGroups={speciesGroups} language={language} />
      </DialogContent>
    </Dialog>
  );
}
