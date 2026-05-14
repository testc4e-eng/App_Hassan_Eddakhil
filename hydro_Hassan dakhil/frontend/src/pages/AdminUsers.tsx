import { useQuery } from "@tanstack/react-query";
import { fetchAdminUsersApi } from "@/api/auth";
import { UsersManagementTable } from "@/components/auth/UsersManagementTable";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminUsers() {
  const { data = [], refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsersApi,
  });

  return (
    <AdminLayout
      title="Gestion des utilisateurs"
      description="Créer, modifier, activer ou supprimer des comptes."
    >
      <UsersManagementTable users={data} onRefresh={refetch} />
    </AdminLayout>
  );
}
