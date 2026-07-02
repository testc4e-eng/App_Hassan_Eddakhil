import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataScanRelation } from "@/types/dataScan";

type Props = {
  relations: DataScanRelation[];
};

export function ScanRelationsPanel({ relations }: Props) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Relations métier</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[260px] overflow-auto space-y-2">
          {relations.length === 0 && (
            <div className="text-sm text-muted-foreground">Aucune relation détectée.</div>
          )}
          {relations.map((r, idx) => (
            <div key={`${r.source_table}-${r.target_table}-${idx}`} className="rounded-md border p-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={r.relation_type === "foreign_key" ? "default" : "outline"}>
                  {r.relation_type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {r.source_schema}.{r.source_table} → {r.target_schema}.{r.target_table}
                </span>
              </div>
              <div className="text-sm">
                {r.source_column} → {r.target_column}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
