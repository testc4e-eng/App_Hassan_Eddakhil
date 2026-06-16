import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataScanSummary } from "@/types/dataScan";

type Props = {
  summary: DataScanSummary | null;
};

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-muted-foreground font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold leading-none">{value}</div>
      </CardContent>
    </Card>
  );
}

export function ScanSummaryCards({ summary }: Props) {
  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx} className="h-[92px] animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
      <MetricCard label="Tables" value={summary.tables_count} />
      <MetricCard label="Lignes (estimées)" value={summary.total_estimated_rows} />
      <MetricCard label="Tables géométriques" value={summary.geometry_tables_count} />
      <MetricCard label="Tables vides (estimées)" value={Math.max(0, summary.anomalies_count)} />
      <MetricCard label="Colonnes totales" value={summary.total_columns} />
      <MetricCard label="Anomalies détectées" value={summary.anomalies_count} />
    </div>
  );
}
