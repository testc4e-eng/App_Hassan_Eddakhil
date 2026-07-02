import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataScanTableDetail } from "@/types/dataScan";

type Props = {
  detail: DataScanTableDetail | null;
  loading: boolean;
};

export function ScanTableDetail({ detail, loading }: Props) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Détail de table</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!detail && !loading && (
          <div className="text-sm text-muted-foreground">
            Sélectionnez une table pour voir les colonnes, index, stats et échantillon.
          </div>
        )}
        {loading && <div className="text-sm text-muted-foreground">Chargement du détail...</div>}
        {detail && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{detail.schema_name}</Badge>
              <Badge>{detail.table_name}</Badge>
              <Badge variant="secondary">{detail.table_type}</Badge>
              {detail.dashboard_useful && <Badge variant="outline">Utile dashboard</Badge>}
            </div>
            <div className="text-sm text-muted-foreground">{detail.description}</div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="rounded-md border p-2">Lignes (est): {detail.estimated_rows}</div>
              <div className="rounded-md border p-2">Lignes (exact): {detail.exact_rows}</div>
              <div className="rounded-md border p-2">Colonnes: {detail.columns.length}</div>
              <div className="rounded-md border p-2">Anomalies: {detail.anomalies.length}</div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Colonnes</h4>
              <div className="overflow-auto border rounded-md max-h-[220px]">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="text-left">
                      <th className="px-2 py-1">Nom</th>
                      <th className="px-2 py-1">Type</th>
                      <th className="px-2 py-1">Nullable</th>
                      <th className="px-2 py-1">PK</th>
                      <th className="px-2 py-1">FK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.columns.map((c) => (
                      <tr key={c.column_name}>
                        <td className="px-2 py-1">{c.column_name}</td>
                        <td className="px-2 py-1">
                          {c.data_type} ({c.udt_name})
                        </td>
                        <td className="px-2 py-1">{c.is_nullable ? "Oui" : "Non"}</td>
                        <td className="px-2 py-1">{c.is_primary_key ? "Oui" : "-"}</td>
                        <td className="px-2 py-1">{c.fk_target ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div>
                <h4 className="text-sm font-semibold mb-2">Géométrie / SRID</h4>
                <div className="space-y-1 text-sm">
                  {detail.geometry.length === 0 && <div className="text-muted-foreground">Aucune.</div>}
                  {detail.geometry.map((g) => (
                    <div key={g.column_name} className="rounded-md border p-2">
                      {g.column_name} - {g.geometry_type} - SRID {g.srid} - invalides:{" "}
                      {g.invalid_count}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Plages de dates</h4>
                <div className="space-y-1 text-sm">
                  {detail.date_stats.length === 0 && <div className="text-muted-foreground">Aucune.</div>}
                  {detail.date_stats.map((d) => (
                    <div key={d.column_name} className="rounded-md border p-2">
                      {d.column_name}: {d.min_value ?? "-"} → {d.max_value ?? "-"} (null: {d.null_count})
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Statistiques numériques</h4>
              <div className="overflow-auto border rounded-md max-h-[160px]">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="text-left">
                      <th className="px-2 py-1">Colonne</th>
                      <th className="px-2 py-1">Min</th>
                      <th className="px-2 py-1">Max</th>
                      <th className="px-2 py-1">Moy</th>
                      <th className="px-2 py-1">Null</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.numeric_stats.map((n) => (
                      <tr key={n.column_name}>
                        <td className="px-2 py-1">{n.column_name}</td>
                        <td className="px-2 py-1">{n.min_value ?? "-"}</td>
                        <td className="px-2 py-1">{n.max_value ?? "-"}</td>
                        <td className="px-2 py-1">{n.avg_value ?? "-"}</td>
                        <td className="px-2 py-1">{n.null_count}</td>
                      </tr>
                    ))}
                    {detail.numeric_stats.length === 0 && (
                      <tr>
                        <td className="px-2 py-2 text-muted-foreground" colSpan={5}>
                          Aucune colonne numérique.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Échantillon (10 lignes max)</h4>
              <pre className="text-xs bg-muted/40 border rounded-md p-3 overflow-auto max-h-[220px]">
                {JSON.stringify(detail.sample_rows, null, 2)}
              </pre>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
