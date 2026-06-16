import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  createAdminUserApi,
  deleteAdminUserApi,
  resetAdminUserPasswordApi,
  updateAdminUserApi,
  updateAdminUserStatusApi,
} from "@/api/auth";
import type { AdminUserPayload, AuthUser } from "@/types/auth";
import { CreateUserModal } from "./CreateUserModal";
import { EditUserModal } from "./EditUserModal";
import { ResetPasswordModal } from "./ResetPasswordModal";

type Props = {
  users: AuthUser[];
  onRefresh: () => Promise<unknown>;
};

export function UsersManagementTable({ users, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AuthUser | null>(null);
  const [resetUser, setResetUser] = useState<AuthUser | null>(null);
  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        [user.full_name, user.email, user.role, user.status].some((value) =>
          value.toLowerCase().includes(search.toLowerCase())
        )
      ),
    [users, search]
  );

  const createUser = async (payload: AdminUserPayload) => {
    await createAdminUserApi(payload);
    await onRefresh();
  };

  const updateUser = async (payload: AdminUserPayload) => {
    if (!editUser) return;
    await updateAdminUserApi(editUser.id, payload);
    await onRefresh();
  };

  const toggleStatus = async (user: AuthUser) => {
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await updateAdminUserStatusApi(user.id, nextStatus);
    await onRefresh();
  };

  const resetPassword = async (newPassword: string) => {
    if (!resetUser) return;
    await resetAdminUserPasswordApi(resetUser.id, newPassword);
    await onRefresh();
  };

  const removeUser = async (user: AuthUser) => {
    if (!window.confirm(`Supprimer ${user.full_name} ?`)) return;
    await deleteAdminUserApi(user.id);
    await onRefresh();
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-lg">Gestion des utilisateurs</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="h-9 w-56"
            />
            <Button className="h-9" onClick={() => setCreateOpen(true)}>
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[540px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "ACTIVE" ? "secondary" : "destructive"}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.last_login ? new Date(user.last_login).toLocaleString() : "-"}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditUser(user)}>
                          Modifier
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setResetUser(user)}>
                          Mot de passe
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleStatus(user)}>
                          {user.status === "ACTIVE" ? "Désactiver" : "Activer"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => removeUser(user)}>
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateUserModal open={createOpen} onOpenChange={setCreateOpen} onSubmit={createUser} />
      <EditUserModal open={Boolean(editUser)} onOpenChange={(open) => !open && setEditUser(null)} user={editUser} onSubmit={updateUser} />
      <ResetPasswordModal open={Boolean(resetUser)} onOpenChange={(open) => !open && setResetUser(null)} user={resetUser} onSubmit={resetPassword} />
    </>
  );
}
