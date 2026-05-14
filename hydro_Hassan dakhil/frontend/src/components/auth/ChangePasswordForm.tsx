import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export function ChangePasswordForm() {
  const { changePassword } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    setLoading(true);
    try {
      await changePassword({ oldPassword, newPassword });
      setMessage("Mot de passe modifié avec succès.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de changer le mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Changer mot de passe</CardTitle>
        <CardDescription>Utilisez un mot de passe d’au moins 8 caractères avec lettres et chiffres.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="oldPassword">Ancien mot de passe</Label>
            <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirmation</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <div className="space-y-1">
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
            </div>
            <Button type="submit" className="h-10" disabled={loading}>
              {loading ? "Enregistrement..." : "Mettre à jour"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
