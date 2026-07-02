import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataScanAnomaly } from "@/types/dataScan";

type Props = {
  anomalies: DataScanAnomaly[];
};

function badgeVariant(severity: DataScanAnomaly["severity"]) {
  if (severity === "critical") return "destructive" as const;
  if (severity === "warning") return "secondary" as const;
  return "outline" as const;
}

export function ScanAnomaliesPanel({ anomalies }: Props) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Anomalies détectées</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
          {anomalies.length === 0 && (
            <div className="text-sm text-muted-foreground">Aucune anomalie détectée.</div>
          )}
          {anomalies.map((a) => (
            <div key={a.id} className="rounded-md border p-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Badge variant={badgeVariant(a.severity)}>{a.severity}</Badge>
                <span className="text-xs text-muted-foreground">
                  {[a.schema_name, a.table_name, a.column_name].filter(Boolean).join(".") || "database"}
                </span>
              </div>
              <div className="text-sm font-medium">{a.code}</div>
              <div className="text-sm text-muted-foreground">{a.message}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
