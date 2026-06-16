import { Link, useNavigate } from "react-router-dom";
import { LogOut, Shield, UserCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { logoutApi } from "@/api/auth";

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Button asChild size="sm" className="h-9 px-3">
        <Link to="/login">Connexion</Link>
      </Button>
    );
  }

  const handleLogout = async () => {
    await logoutApi().catch(() => null);
    await logout();
    navigate("/login");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
          <UserCircle2 className="h-4 w-4" />
          <span className="max-w-[140px] truncate">{user.full_name}</span>
          <Badge variant="secondary" className="ml-1 h-5 px-2 text-[10px] uppercase">
            {user.role}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="z-[100] w-64 p-3">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"}>
              {user.status}
            </Badge>
            {user.role === "ADMIN" ? (
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/change-password">
                <KeyRound className="mr-2 h-4 w-4" />
                Changer mot de passe
              </Link>
            </Button>
            {user.role === "ADMIN" ? (
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link to="/admin">
                  <Shield className="mr-2 h-4 w-4" />
                  Espace admin
                </Link>
              </Button>
            ) : null}
            <Button variant="destructive" size="sm" className="justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
