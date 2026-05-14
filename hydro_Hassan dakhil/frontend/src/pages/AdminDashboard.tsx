import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users, UserCheck, UserX, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchAdminUsersApi } from "@/api/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminDashboard() {
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsersApi,
  });

  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter((user) => user.status === "ACTIVE").length;
    const inactive = data.filter((user) => user.status === "INACTIVE").length;
    const admins = data.filter((user) => user.role === "ADMIN").length;
    return { total, active, inactive, admins };
  }, [data]);

  return (
    <AdminLayout
      title="Administration"
      description="Supervision des comptes et accès aux outils d’administration."
      actions={
        <Button variant="outline" onClick={() => void refetch()}>
          Rafraîchir les stats
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comptes admin</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Dernières connexions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : (
              data
                .filter((user) => user.last_login)
                .slice(0, 5)
                .map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : "-"}
                    </span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Accès rapides</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild className="justify-between">
              <Link to="/admin/users">
                Gestion des utilisateurs <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to="/dashboard">
                Dashboard métier <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
