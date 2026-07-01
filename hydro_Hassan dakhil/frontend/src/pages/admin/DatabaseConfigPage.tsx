// frontend/src/pages/admin/DatabaseConfigPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Database, Loader2, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { fetchDbConfig, testDbConnection } from "@/api/adminDbConfig";

export default function DatabaseConfigPage() {
  const [config, setConfig] = useState({
    host: "",
    port: 5432,
    database: "",
    user: "",
    password: "",
    ssl: false,
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchDbConfig()
      .then((res) => {
        const data = res.data;
        setConfig((prev) => ({
          ...prev,
          host: data.host,
          port: data.port,
          database: data.database,
          user: data.user,
          ssl: data.ssl,
        }));
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Erreur de chargement");
        setSuccess(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    setSuccess(null);
    try {
      const result = await testDbConnection(config);
      setMessage(result.message);
      setSuccess(result.success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur");
      setSuccess(false);
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminLayout
      title="Configuration base de données"
      description="Visualiser et tester la connexion PostgreSQL. La configuration effective est définie par les variables d'environnement au démarrage du backend."
      actions={
        <Button asChild variant="outline">
          <Link to="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      }
    >
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Paramètres de connexion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="db-host">Hôte</Label>
                  <Input
                    id="db-host"
                    value={config.host}
                    onChange={(e) => setConfig({ ...config, host: e.target.value })}
                    placeholder="localhost"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-port">Port</Label>
                  <Input
                    id="db-port"
                    type="number"
                    value={config.port}
                    onChange={(e) => setConfig({ ...config, port: Number(e.target.value) })}
                    placeholder="5432"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-database">Base de données</Label>
                  <Input
                    id="db-database"
                    value={config.database}
                    onChange={(e) => setConfig({ ...config, database: e.target.value })}
                    placeholder="hydro_hd_1714"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-user">Utilisateur</Label>
                  <Input
                    id="db-user"
                    value={config.user}
                    onChange={(e) => setConfig({ ...config, user: e.target.value })}
                    placeholder="postgres"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="db-password">Mot de passe</Label>
                  <Input
                    id="db-password"
                    type="password"
                    value={config.password}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="db-ssl"
                  checked={config.ssl}
                  onCheckedChange={(checked) => setConfig({ ...config, ssl: checked })}
                />
                <Label htmlFor="db-ssl">SSL activé</Label>
              </div>

              <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                La configuration effective au redémarrage du backend provient des variables
                d'environnement : <code>DB_HOST</code>, <code>DB_PORT</code>, <code>DB_NAME</code>,{" "}
                <code>DB_USER</code>, <code>DB_PASSWORD</code>, <code>DB_SSL</code>.
              </div>

              {message && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    success
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : success === false
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : "bg-muted text-muted-foreground border"
                  }`}
                >
                  {message}
                </div>
              )}

              <Button onClick={handleTest} disabled={testing} className="w-full md:w-auto">
                {testing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="mr-2 h-4 w-4" />
                )}
                Tester la connexion
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
