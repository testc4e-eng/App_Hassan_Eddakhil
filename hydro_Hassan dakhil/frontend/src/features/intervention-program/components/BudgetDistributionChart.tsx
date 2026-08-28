import { Pie, PieChart, Cell, Label } from "recharts";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { InterventionAxis, SupportedLanguage } from "@/features/intervention-program/types/interventionProgram.types";
import {
  formatMdh,
  formatPercentage,
  getAxisBudgetShare,
  getLocalizedText,
} from "@/features/intervention-program/utils/interventionProgram.utils";

type BudgetDistributionChartProps = {
  axes: InterventionAxis[];
  totalBudgetMdh: number;
  language: SupportedLanguage;
  title: string;
  description: string;
};

export function BudgetDistributionChart({
  axes,
  totalBudgetMdh,
  language,
  title,
  description,
}: BudgetDistributionChartProps) {
  const { t } = useTranslation();
  const chartData = axes.map((axis) => ({
    id: axis.id,
    name: getLocalizedText(axis.name, language),
    budgetMdh: axis.budgetMdh,
    fill: axis.color,
    share: getAxisBudgetShare(axis, axes.reduce((sum, item) => sum + item.budgetMdh, 0)),
  }));

  const chartConfig = Object.fromEntries(
    chartData.map((item) => [
      item.id,
      {
        label: item.name,
        color: item.fill,
      },
    ])
  );

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-950">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <div className="mx-auto w-full max-w-[360px]">
          <ChartContainer config={chartConfig} className="aspect-square h-[290px]">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, _item) => (
                      <div className="flex min-w-[13rem] items-center justify-between gap-3">
                        <span className="text-muted-foreground">{String(name)}</span>
                        <span className="font-medium text-slate-950">
                          {formatMdh(Number(value), language)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="budgetMdh"
                nameKey="id"
                cx="50%"
                cy="50%"
                innerRadius={78}
                outerRadius={116}
                paddingAngle={2}
                strokeWidth={0}
              >
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                      return null;
                    }

                    const cx = Number(viewBox.cx);
                    const cy = Number(viewBox.cy);

                    return (
                      <g>
                        <text
                          x={cx}
                          y={cy - 14}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="fill-slate-500 text-[11px] font-semibold uppercase tracking-[0.14em]"
                        >
                          {t("interventionProgram.common.total")}
                        </text>
                        <text
                          x={cx}
                          y={cy + 16}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="fill-slate-950 text-3xl font-bold"
                        >
                          {formatMdh(totalBudgetMdh, language, 0)}
                        </text>
                      </g>
                    );
                  }}
                />
                {chartData.map((entry) => (
                  <Cell key={entry.id} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        <div className="grid gap-3">
          {chartData.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: item.fill }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPercentage(item.share, language)}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-slate-950">
                  {formatMdh(item.budgetMdh, language)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
