import type { SwatSummary } from "@/types/simulatedData";

export function DataManagementKpis({ summary }: { summary: SwatSummary | null }) {
  return (
    <div className="grid gap-3 lg:grid-cols-7">
      <Kpi title="Batches SWAT" value={summary?.batches_swat ?? 0} />
      <Kpi title="Disponibilités" value={summary?.availability_simulated ?? 0} />
      <Kpi title="Entités uniques" value={summary?.entities_unique_simulated ?? 0} />
      <Kpi title="Points simulés" value={summary?.points_simulated ?? 0} />
      <Kpi title="Reaches simulés" value={summary?.points_reach_simulated ?? 0} />
      <Kpi title="Subbasins simulés" value={summary?.points_subbasin_simulated ?? 0} />
      <Kpi title="Variables simulées" value={summary?.variables_simulated_available ?? 0} />
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
