import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DataScanTableFilters, DataScanTableRow } from "@/types/dataScan";

type Props = {
  rows: DataScanTableRow[];
  selectedKey: string | null;
  filters: DataScanTableFilters;
  schemas: string[];
  loading: boolean;
  onFiltersChange: (next: DataScanTableFilters) => void;
  onSelectTable: (schemaName: string, tableName: string) => void;
  onRefresh: () => void;
};

function statusVariant(status: DataScanTableRow["quality_status"]) {
  if (status === "critical") return "destructive" as const;
  if (status === "warning") return "secondary" as const;
  return "default" as const;
}

export function ScanTablesList({
  rows,
  selectedKey,
  filters,
  schemas,
  loading,
  onFiltersChange,
  onSelectTable,
  onRefresh,
}: Props) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Tables analysées</CardTitle>
          <Button size="sm" variant="outline" onClick={onRefresh}>
            Relancer le scan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-2">
          <Select
            value={filters.schema ?? "__ALL__"}
            onValueChange={(v) =>
              onFiltersChange({ ...filters, schema: v === "__ALL__" ? undefined : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Schéma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__ALL__">Tous schémas</SelectItem>
              {schemas.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.tableType ?? "__ALL__"}
            onValueChange={(v) =>
              onFiltersChange({
                ...filters,
                tableType: v === "__ALL__" ? undefined : (v as "BASE TABLE" | "VIEW"),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__ALL__">Tous types</SelectItem>
              <SelectItem value="BASE TABLE">BASE TABLE</SelectItem>
              <SelectItem value="VIEW">VIEW</SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 rounded-md border px-3">
            <Checkbox
              checked={Boolean(filters.geometryOnly)}
              onCheckedChange={(v) => onFiltersChange({ ...filters, geometryOnly: Boolean(v) })}
            />
            <span className="text-sm">Géométrie</span>
          </label>
          <label className="flex items-center gap-2 rounded-md border px-3">
            <Checkbox
              checked={Boolean(filters.emptyOnly)}
              onCheckedChange={(v) => onFiltersChange({ ...filters, emptyOnly: Boolean(v) })}
            />
            <span className="text-sm">Tables vides</span>
          </label>
          <label className="flex items-center gap-2 rounded-md border px-3">
            <Checkbox
              checked={Boolean(filters.anomalousOnly)}
              onCheckedChange={(v) => onFiltersChange({ ...filters, anomalousOnly: Boolean(v) })}
            />
            <span className="text-sm">Avec anomalies</span>
          </label>
          <Input value={`${rows.length} table(s)`} readOnly />
        </div>

        <div className="overflow-auto border rounded-md max-h-[440px]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="text-left">
                <th className="px-3 py-2">Schéma</th>
                <th className="px-3 py-2">Table</th>
                <th className="px-3 py-2">Lignes</th>
                <th className="px-3 py-2">Colonnes</th>
                <th className="px-3 py-2">Geo</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">PK/FK</th>
                <th className="px-3 py-2">Qualité</th>
                <th className="px-3 py-2">Dashboard</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                rows.map((r) => {
                  const key = `${r.schema_name}.${r.table_name}`;
                  const selected = key === selectedKey;
                  return (
                    <tr key={key} className={selected ? "bg-primary/5" : "hover:bg-muted/20"}>
                      <td className="px-3 py-2">{r.schema_name}</td>
                      <td className="px-3 py-2 font-medium">{r.table_name}</td>
                      <td className="px-3 py-2">{r.estimated_rows}</td>
                      <td className="px-3 py-2">{r.columns_count}</td>
                      <td className="px-3 py-2">{r.has_geometry ? "Oui" : "Non"}</td>
                      <td className="px-3 py-2">{r.has_date ? "Oui" : "Non"}</td>
                      <td className="px-3 py-2">
                        {r.pk_count}/{r.fk_count}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={statusVariant(r.quality_status)}>
                          {r.quality_status} ({r.quality_score})
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        {r.dashboard_useful ? (
                          <Badge variant="outline">Utile</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          size="sm"
                          variant={selected ? "default" : "outline"}
                          onClick={() => onSelectTable(r.schema_name, r.table_name)}
                        >
                          Voir détail
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              {loading && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={10}>
                    Analyse des tables en cours...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={10}>
                    Aucun résultat avec ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
