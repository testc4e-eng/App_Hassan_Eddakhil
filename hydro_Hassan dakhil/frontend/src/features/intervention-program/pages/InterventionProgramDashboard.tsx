import { useMemo, useState } from "react";
import {
  Activity,
  Info,
  Layers3,
  Shield,
  Target,
  TreePine,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  DATA_QUALITY_NOTES,
  DEGRADATION_CLASSES,
  DISTANCE_CLASSES,
  INTERVENTION_ACTIONS,
  INTERVENTION_AXES,
  INTERVENTION_BUDGET_TOTAL_MDH,
  INTERVENTION_MAPS,
  INTERVENTION_PROGRAM_YEARS,
  INTERVENTION_SOURCE_DOCUMENTS,
  INTERVENTION_SPECIES_GROUPS,
  INTERVENTION_YEAR_PLANS,
  PRIORITY_CLASS_INFO,
  PRIORITY_MATRIX_ROWS,
} from "@/features/intervention-program/data/interventionProgram.data";
import { InterventionKpiCard } from "@/features/intervention-program/components/InterventionKpiCard";
import { BudgetDistributionChart } from "@/features/intervention-program/components/BudgetDistributionChart";
import { InterventionTimeline } from "@/features/intervention-program/components/InterventionTimeline";
import { PriorityMapCard } from "@/features/intervention-program/components/PriorityMapCard";
import { InterventionAxisCard } from "@/features/intervention-program/components/InterventionAxisCard";
import { PriorityMatrix } from "@/features/intervention-program/components/PriorityMatrix";
import { ActionDetailsDrawer } from "@/features/intervention-program/components/ActionDetailsDrawer";
import { ProgramSourceDocuments } from "@/features/intervention-program/components/ProgramSourceDocuments";
import type {
  InterventionActionFilters,
  InterventionAxisId,
  InterventionBudgetBand,
  InterventionProgramYear,
  InterventionTabId,
  SupportedLanguage,
} from "@/features/intervention-program/types/interventionProgram.types";
import {
  filterInterventionActions,
  formatArea,
  formatMdh,
  formatNumber,
  formatPercentage,
  getAnnualBudgetTotals,
  getAxisBudgetShare,
  getLocalizedText,
  getUniqueLocalizedValues,
  sortActionsByCode,
} from "@/features/intervention-program/utils/interventionProgram.utils";

function useDashboardLanguage(): SupportedLanguage {
  const { i18n } = useTranslation();
  return i18n.resolvedLanguage?.startsWith("en") ? "en" : "fr";
}

const DEFAULT_FILTERS: InterventionActionFilters = {
  axisId: "all",
  priority: "all",
  year: "all",
  interventionType: "all",
  zone: "all",
  budgetBand: "all",
};

const KPI_ICONS = {
  budget: Wallet,
  axes: Layers3,
  actions: Target,
  reforestation: TreePine,
  exclosure: Shield,
} as const;

function _budgetBandLabel(value: InterventionBudgetBand, language: SupportedLanguage) {
  if (value === "lt-1") return language === "fr" ? "< 1 MDH" : "< 1 MDH";
  if (value === "1-5") return language === "fr" ? "1 à 5 MDH" : "1 to 5 MDH";
  if (value === "gt-5") return language === "fr" ? "> 5 MDH" : "> 5 MDH";
  return language === "fr" ? "Tous les budgets" : "All budgets";
}

export function InterventionProgramDashboard() {
  const { t } = useTranslation();
  const language = useDashboardLanguage();
  const budgetBandLabel = (value: InterventionBudgetBand) => {
    if (value === "lt-1") return t("interventionProgram.filters.budgetBands.lt1");
    if (value === "1-5") return t("interventionProgram.filters.budgetBands.oneToFive");
    if (value === "gt-5") return t("interventionProgram.filters.budgetBands.gt5");
    return t("interventionProgram.filters.budgetBands.all");
  };
  const [activeTab, setActiveTab] = useState<InterventionTabId>("overview");
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [filters, setFilters] = useState<InterventionActionFilters>(DEFAULT_FILTERS);

  const actions = sortActionsByCode(INTERVENTION_ACTIONS);
  const selectedAction = actions.find((action) => action.id === selectedActionId) ?? null;

  const filteredActions = useMemo(
    () => filterInterventionActions(actions, filters, language),
    [actions, filters, language]
  );

  const axisBudgetData = useMemo(
    () =>
      INTERVENTION_AXES.map((axis) => ({
        id: axis.id,
        label: getLocalizedText(axis.shortLabel, language),
        name: getLocalizedText(axis.name, language),
        budgetMdh: axis.budgetMdh,
        fill: axis.color,
        share: getAxisBudgetShare(axis, INTERVENTION_AXES.reduce((sum, item) => sum + item.budgetMdh, 0)),
      })),
    [language]
  );

  const annualBudgetData = useMemo(
    () =>
      getAnnualBudgetTotals(actions, INTERVENTION_PROGRAM_YEARS).map((item) => ({
        year: item.year,
        budgetMdh: Number(item.budgetMdh.toFixed(2)),
      })),
    [actions]
  );

  const detailedAxisChartConfig = Object.fromEntries(
    axisBudgetData.map((item) => [
      item.id,
      {
        label: item.name,
        color: item.fill,
      },
    ])
  );

  const annualChartConfig = {
    budget: {
      label: t("interventionProgram.common.annualBudget"),
      color: "#0f766e",
    },
  };

  const interventionTypeOptions = useMemo(
    () => getUniqueLocalizedValues(actions, "interventionType", language),
    [actions, language]
  );

  const zoneOptions = useMemo(
    () => getUniqueLocalizedValues(actions, "zoneTarget", language),
    [actions, language]
  );

  const budgetTableRows = useMemo(
    () =>
      actions.map((action) => ({
        action,
        axis: INTERVENTION_AXES.find((axis) => axis.id === action.axisId),
      })),
    [actions]
  );

  const priorityZoneMap = INTERVENTION_MAPS.find((item) => item.id === "priority-zones");
  const degradationMap = INTERVENTION_MAPS.find((item) => item.id === "specific-degradation");
  const distanceMap = INTERVENTION_MAPS.find((item) => item.id === "distance-classes");

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-10 lg:px-5">
      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50 px-6 py-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
                {t("interventionProgram.programBadge")}
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("interventionProgram.common.programInfoAria")}
                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:text-slate-800"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  {t("interventionProgram.infoTooltip")}
                </TooltipContent>
              </Tooltip>
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                {t("interventionProgram.title")}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {t("interventionProgram.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href={INTERVENTION_SOURCE_DOCUMENTS[0].url} target="_blank" rel="noreferrer">
                {t("interventionProgram.openSource")}
              </a>
            </Button>
            <Button size="sm" onClick={() => setActiveTab("documents")}>
              {t("interventionProgram.viewSourceDocuments")}
            </Button>
          </div>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as InterventionTabId)}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-slate-100 p-2">
          <TabsTrigger value="overview" className="rounded-xl px-4 py-2">
            {t("interventionProgram.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="classification" className="rounded-xl px-4 py-2">
            {t("interventionProgram.tabs.classification")}
          </TabsTrigger>
          <TabsTrigger value="matrix" className="rounded-xl px-4 py-2">
            {t("interventionProgram.tabs.matrix")}
          </TabsTrigger>
          <TabsTrigger value="actions" className="rounded-xl px-4 py-2">
            {t("interventionProgram.tabs.actions")}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-xl px-4 py-2">
            {t("interventionProgram.tabs.calendar")}
          </TabsTrigger>
          <TabsTrigger value="budgets" className="rounded-xl px-4 py-2">
            {t("interventionProgram.tabs.budgets")}
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-xl px-4 py-2">
            {t("interventionProgram.tabs.documents")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <InterventionKpiCard
              icon={KPI_ICONS.budget}
              title={t("interventionProgram.kpis.totalBudget.title")}
              value={formatMdh(INTERVENTION_BUDGET_TOTAL_MDH, language, 0)}
              subtitle={t("interventionProgram.kpis.totalBudget.subtitle")}
              description={t("interventionProgram.kpis.totalBudget.description")}
              iconClassName="bg-emerald-100 text-emerald-700"
            />
            <InterventionKpiCard
              icon={KPI_ICONS.axes}
              title={t("interventionProgram.kpis.axes.title")}
              value={formatNumber(INTERVENTION_AXES.length, language)}
              subtitle={t("interventionProgram.kpis.axes.subtitle")}
              description={t("interventionProgram.kpis.axes.description")}
              iconClassName="bg-sky-100 text-sky-700"
            />
            <InterventionKpiCard
              icon={KPI_ICONS.actions}
              title={t("interventionProgram.kpis.actions.title")}
              value={formatNumber(actions.length, language)}
              subtitle={t("interventionProgram.kpis.actions.subtitle")}
              description={t("interventionProgram.kpis.actions.description")}
              iconClassName="bg-amber-100 text-amber-700"
            />
            <InterventionKpiCard
              icon={KPI_ICONS.reforestation}
              title={t("interventionProgram.kpis.reforestation.title")}
              value={formatArea(3400, language)}
              subtitle={t("interventionProgram.kpis.reforestation.subtitle")}
              description={t("interventionProgram.kpis.reforestation.description")}
              iconClassName="bg-green-100 text-green-700"
            />
            <InterventionKpiCard
              icon={KPI_ICONS.exclosure}
              title={t("interventionProgram.kpis.exclosure.title")}
              value={formatArea(2000, language)}
              subtitle={t("interventionProgram.kpis.exclosure.subtitle")}
              description={t("interventionProgram.kpis.exclosure.description")}
              iconClassName="bg-violet-100 text-violet-700"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <BudgetDistributionChart
              axes={INTERVENTION_AXES}
              totalBudgetMdh={INTERVENTION_BUDGET_TOTAL_MDH}
              language={language}
              title={t("interventionProgram.sections.budgetDistribution")}
              description={t("interventionProgram.sections.budgetDistributionDescription")}
            />

            <InterventionTimeline
              axes={INTERVENTION_AXES}
              actions={actions}
              years={INTERVENTION_PROGRAM_YEARS}
              language={language}
              title={t("interventionProgram.sections.globalSchedule")}
              description={t("interventionProgram.sections.globalScheduleDescription")}
            />
          </section>

          {priorityZoneMap ? (
            <PriorityMapCard
              map={priorityZoneMap}
              language={language}
              sourceDocument={INTERVENTION_SOURCE_DOCUMENTS[0]}
              secondaryActionLabel={t("interventionProgram.seeClassification")}
              onSecondaryAction={() => setActiveTab("classification")}
            />
          ) : null}

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  {t("interventionProgram.sections.axisSummary")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("interventionProgram.sections.axisSummaryDescription")}
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {INTERVENTION_AXES.map((axis) => (
                <InterventionAxisCard
                  key={axis.id}
                  axis={axis}
                  actions={actions}
                  language={language}
                  viewActionsLabel={t("interventionProgram.viewActions")}
                  onViewActions={(axisId) => {
                    setFilters((current) => ({ ...current, axisId }));
                    setActiveTab("actions");
                  }}
                />
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="classification" className="space-y-6">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">
                {t("interventionProgram.classification.title")}
              </CardTitle>
              <CardDescription>{t("interventionProgram.classification.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section className="space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-slate-950">
                    {t("interventionProgram.classification.degradationTitle")}
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("interventionProgram.classification.degradationDescription")}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {DEGRADATION_CLASSES.map((item) => (
                    <Card key={item.id} className="border-slate-200/80">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {getLocalizedText(item.rangeLabel, language)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {getLocalizedText(item.erosionLevel, language)}
                            </p>
                          </div>
                          <span
                            className="h-4 w-4 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                        <p className="text-sm leading-6 text-slate-700">
                          {getLocalizedText(item.operationalMeaning, language)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {degradationMap ? (
                  <PriorityMapCard
                    map={degradationMap}
                    language={language}
                    sourceDocument={INTERVENTION_SOURCE_DOCUMENTS[0]}
                  />
                ) : null}
              </section>

              <section className="space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-slate-950">
                    {t("interventionProgram.classification.distanceTitle")}
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("interventionProgram.classification.distanceDescription")}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {DISTANCE_CLASSES.map((item) => (
                    <Card key={item.id} className="border-slate-200/80">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {getLocalizedText(item.rangeLabel, language)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {getLocalizedText(item.proximityLevel, language)}
                            </p>
                          </div>
                          <span
                            className="h-4 w-4 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                        <p className="text-sm leading-6 text-slate-700">
                          {getLocalizedText(item.operationalMeaning, language)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {distanceMap ? (
                  <PriorityMapCard
                    map={distanceMap}
                    language={language}
                    sourceDocument={INTERVENTION_SOURCE_DOCUMENTS[0]}
                  />
                ) : null}
              </section>

              <Card className="border-slate-200/80 bg-slate-50">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-slate-900">
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {t("interventionProgram.classification.criterionDegradation")}
                    </Badge>
                    <span className="text-xl text-slate-400">+</span>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {t("interventionProgram.classification.criterionDistance")}
                    </Badge>
                    <span className="text-xl text-slate-400">=</span>
                    <Badge className="rounded-full px-3 py-1">{t("interventionProgram.classification.priorityResult")}</Badge>
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-slate-700">
                    {t("interventionProgram.classification.resultExplanation")}
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-6">
          <PriorityMatrix
            title={t("interventionProgram.matrix.title")}
            description={t("interventionProgram.matrix.description")}
            rows={PRIORITY_MATRIX_ROWS}
            degradationClasses={DEGRADATION_CLASSES}
            distanceClasses={DISTANCE_CLASSES}
            priorityInfo={PRIORITY_CLASS_INFO}
            language={language}
          />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">
                {t("interventionProgram.actions.title")}
              </CardTitle>
              <CardDescription>{t("interventionProgram.actions.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <Select
                  value={filters.axisId}
                  onValueChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      axisId: value as InterventionAxisId | "all",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("interventionProgram.filters.axis")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("interventionProgram.filters.allAxes")}</SelectItem>
                    {INTERVENTION_AXES.map((axis) => (
                      <SelectItem key={axis.id} value={axis.id}>
                        {getLocalizedText(axis.name, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.priority}
                  onValueChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      priority: value as InterventionActionFilters["priority"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("interventionProgram.filters.priority")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("interventionProgram.filters.allPriorities")}</SelectItem>
                    {PRIORITY_CLASS_INFO.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={String(filters.year)}
                  onValueChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      year: value === "all" ? "all" : (Number(value) as InterventionProgramYear),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("interventionProgram.filters.year")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("interventionProgram.filters.allYears")}</SelectItem>
                    {INTERVENTION_PROGRAM_YEARS.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.interventionType}
                  onValueChange={(value) =>
                    setFilters((current) => ({ ...current, interventionType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("interventionProgram.filters.type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("interventionProgram.filters.allTypes")}</SelectItem>
                    {interventionTypeOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.zone}
                  onValueChange={(value) => setFilters((current) => ({ ...current, zone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("interventionProgram.filters.zone")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("interventionProgram.filters.allZones")}</SelectItem>
                    {zoneOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.budgetBand}
                  onValueChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      budgetBand: value as InterventionBudgetBand,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("interventionProgram.filters.budget")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{budgetBandLabel("all")}</SelectItem>
                    <SelectItem value="lt-1">{budgetBandLabel("lt-1")}</SelectItem>
                    <SelectItem value="1-5">{budgetBandLabel("1-5")}</SelectItem>
                    <SelectItem value="gt-5">{budgetBandLabel("gt-5")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {t("interventionProgram.common.filteredActions", {
                    filtered: filteredActions.length,
                    total: actions.length,
                  })}
                </p>
                <Button size="sm" variant="ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  {t("interventionProgram.filters.reset")}
                </Button>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {filteredActions.map((action) => {
                  const axis = INTERVENTION_AXES.find((item) => item.id === action.axisId);

                  return (
                    <Card key={action.id} className="border-slate-200/80 shadow-sm">
                      <CardContent className="flex h-full flex-col gap-4 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="rounded-full">
                                {action.code}
                              </Badge>
                              {axis ? (
                                <Badge variant="outline" className="rounded-full">
                                  {getLocalizedText(axis.shortLabel, language)}
                                </Badge>
                              ) : null}
                              {action.priorityClasses?.map((priority) => (
                                <Badge key={priority} variant="outline" className="rounded-full">
                                  {priority}
                                </Badge>
                              ))}
                            </div>
                            <h3 className="text-base font-semibold text-slate-950">
                              {getLocalizedText(action.title, language)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {getLocalizedText(action.zoneTarget, language)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-950">
                              {formatMdh(action.budgetMdh, language)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {action.years.join(" - ")}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm leading-6 text-slate-700">
                          {getLocalizedText(action.objective, language)}
                        </p>

                        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                              {t("interventionProgram.common.interventionType")}
                            </p>
                            <p className="mt-1 text-sm text-slate-800">
                              {getLocalizedText(action.interventionType, language)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                              {t("interventionProgram.common.surfaceOrQuantity")}
                            </p>
                            <p className="mt-1 text-sm text-slate-800">
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

                        <div className="mt-auto flex justify-end">
                          <Button size="sm" onClick={() => setSelectedActionId(action.id)}>
                            {t("interventionProgram.actions.viewDetails")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <InterventionTimeline
            axes={INTERVENTION_AXES}
            actions={actions}
            years={INTERVENTION_PROGRAM_YEARS}
            language={language}
            title={t("interventionProgram.calendar.timelineTitle")}
            description={t("interventionProgram.calendar.timelineDescription")}
          />

          <div className="grid gap-4 xl:grid-cols-2">
            {INTERVENTION_YEAR_PLANS.map((yearPlan) => (
              <Card key={yearPlan.year} className="border-slate-200/80 shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg text-slate-950">
                        {getLocalizedText(yearPlan.title, language)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {getLocalizedText(yearPlan.theme, language)}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      {formatMdh(yearPlan.budgetMdh, language)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                      {t("interventionProgram.calendar.documentedHighlights")}
                    </p>
                    {yearPlan.knownHighlights.map((highlight) => (
                      <div
                        key={`${yearPlan.year}-${highlight.fr}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                      >
                        {getLocalizedText(highlight, language)}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                      {t("interventionProgram.calendar.actionsPlanned")}
                    </p>
                    {yearPlan.actionIds.map((actionId) => {
                      const action = actions.find((item) => item.id === actionId);
                      if (!action) return null;

                      return (
                        <button
                          key={`${yearPlan.year}-${action.id}`}
                          type="button"
                          onClick={() => setSelectedActionId(action.id)}
                          className="flex w-full items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {action.code} - {getLocalizedText(action.title, language)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {action.phaseByYear[yearPlan.year]
                                ? getLocalizedText(action.phaseByYear[yearPlan.year]!, language)
                                : t("interventionProgram.calendar.continuousAction")}
                            </p>
                          </div>
                          <Badge variant="outline" className="rounded-full">
                            {formatMdh(action.annualBudgetMdh[yearPlan.year] ?? 0, language)}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InterventionKpiCard
              icon={Wallet}
              title={t("interventionProgram.budgets.kpiTotal")}
              value={formatMdh(INTERVENTION_BUDGET_TOTAL_MDH, language, 0)}
              subtitle={t("interventionProgram.budgets.kpiTotalSubtitle")}
              description={t("interventionProgram.budgets.kpiTotalDescription")}
              iconClassName="bg-emerald-100 text-emerald-700"
            />
            <InterventionKpiCard
              icon={Layers3}
              title={t("interventionProgram.budgets.kpiAxis")}
              value={formatNumber(INTERVENTION_AXES.length, language)}
              subtitle={t("interventionProgram.budgets.kpiAxisSubtitle")}
              description={t("interventionProgram.budgets.kpiAxisDescription")}
              iconClassName="bg-cyan-100 text-cyan-700"
            />
            <InterventionKpiCard
              icon={Activity}
              title={t("interventionProgram.budgets.kpiActions")}
              value={formatNumber(actions.length, language)}
              subtitle={t("interventionProgram.budgets.kpiActionsSubtitle")}
              description={t("interventionProgram.budgets.kpiActionsDescription")}
              iconClassName="bg-amber-100 text-amber-700"
            />
            <InterventionKpiCard
              icon={Target}
              title={t("interventionProgram.budgets.kpiAverage")}
              value={formatMdh(INTERVENTION_BUDGET_TOTAL_MDH / actions.length, language)}
              subtitle={t("interventionProgram.budgets.kpiAverageSubtitle")}
              description={t("interventionProgram.budgets.kpiAverageDescription")}
              iconClassName="bg-violet-100 text-violet-700"
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <BudgetDistributionChart
              axes={INTERVENTION_AXES}
              totalBudgetMdh={INTERVENTION_BUDGET_TOTAL_MDH}
              language={language}
              title={t("interventionProgram.budgets.axisDistributionTitle")}
              description={t("interventionProgram.budgets.axisDistributionDescription")}
            />

            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-950">
                  {t("interventionProgram.budgets.annualDistributionTitle")}
                </CardTitle>
                <CardDescription>
                  {t("interventionProgram.budgets.annualDistributionDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={annualChartConfig} className="h-[320px] w-full">
                  <BarChart data={annualBudgetData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          hideIndicator
                          formatter={(value) => (
                            <span className="font-medium text-slate-950">
                              {formatMdh(Number(value), language)}
                            </span>
                          )}
                        />
                      }
                    />
                    <Bar dataKey="budgetMdh" radius={[12, 12, 0, 0]} fill="var(--color-budget)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">
                {t("interventionProgram.budgets.axisBarTitle")}
              </CardTitle>
              <CardDescription>
                {t("interventionProgram.budgets.axisBarDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={detailedAxisChartConfig} className="h-[340px] w-full">
                <BarChart data={axisBudgetData} layout="vertical" margin={{ left: 24, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="label"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={88}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, _item) => (
                          <div className="flex min-w-[14rem] items-center justify-between gap-3">
                            <span className="text-muted-foreground">{String(name)}</span>
                            <span className="font-medium text-slate-950">
                              {formatMdh(Number(value), language)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="budgetMdh" radius={[0, 12, 12, 0]}>
                    {axisBudgetData.map((entry) => (
                      <Cell key={entry.id} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">
                {t("interventionProgram.budgets.detailedTableTitle")}
              </CardTitle>
              <CardDescription>
                {t("interventionProgram.budgets.detailedTableDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("interventionProgram.tableHeaders.action")}</TableHead>
                    <TableHead>{t("interventionProgram.tableHeaders.axis")}</TableHead>
                    <TableHead>{t("interventionProgram.tableHeaders.budget")}</TableHead>
                    <TableHead>{t("interventionProgram.tableHeaders.years")}</TableHead>
                    <TableHead>{t("interventionProgram.tableHeaders.share")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetTableRows.map(({ action, axis }) => (
                    <TableRow key={action.id}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedActionId(action.id);
                            setActiveTab("actions");
                          }}
                          className="text-left text-sm font-semibold text-slate-900 hover:text-primary"
                        >
                          {action.code} - {getLocalizedText(action.title, language)}
                        </button>
                      </TableCell>
                      <TableCell>{axis ? getLocalizedText(axis.name, language) : "-"}</TableCell>
                      <TableCell>{formatMdh(action.budgetMdh, language)}</TableCell>
                      <TableCell>{action.years.join(" - ")}</TableCell>
                      <TableCell>
                        {formatPercentage((action.budgetMdh / INTERVENTION_BUDGET_TOTAL_MDH) * 100, language)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <ProgramSourceDocuments
            documents={INTERVENTION_SOURCE_DOCUMENTS}
            notes={DATA_QUALITY_NOTES}
            language={language}
            title={t("interventionProgram.documents.title")}
            description={t("interventionProgram.documents.description")}
            adminOnlyNotice={t("interventionProgram.documents.adminNotice")}
          />
        </TabsContent>
      </Tabs>

      <ActionDetailsDrawer
        action={selectedAction}
        speciesGroups={INTERVENTION_SPECIES_GROUPS}
        language={language}
        open={Boolean(selectedAction)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedActionId(null);
          }
        }}
      />
    </div>
  );
}
