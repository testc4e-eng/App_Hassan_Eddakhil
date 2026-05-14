import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Droplets, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await login(email, password);
      setSuccess("Connexion réussie, redirection en cours...");
      window.setTimeout(() => {
        navigate(user.role === "ADMIN" ? "/admin" : "/dashboard", { replace: true });
      }, 250);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[480px] overflow-hidden rounded-[20px] border border-slate-200/80 bg-white/90 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.28)] backdrop-blur">
      <CardHeader className="space-y-4 px-8 pt-8 pb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-700 text-white shadow-lg shadow-cyan-500/20">
          <Droplets className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-[1.75rem] font-semibold tracking-tight text-slate-900">
            Connexion
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Accédez à votre espace Hydro-Data Intelligence.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form onSubmit={submit} className="space-y-4">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-800">
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@domaine.com"
                autoComplete="email"
                required
                className="h-12 rounded-xl border-slate-200 bg-white pl-10 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-800">
              Mot de passe
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                required
                className="h-12 rounded-xl border-slate-200 bg-white pl-10 pr-12 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <a
              href="#"
              onClick={(event) => event.preventDefault()}
              className="text-sm font-medium text-cyan-700 transition hover:text-cyan-800 hover:underline"
            >
              Mot de passe oublié ?
            </a>
            <span className="text-xs text-slate-500">Plateforme sécurisée</span>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-sky-700 to-cyan-600 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition duration-200 hover:from-sky-800 hover:to-cyan-700"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Button>

          <p className="pt-2 text-center text-xs text-slate-500">
            Plateforme sécurisée — Barrage Hassan Addakhil
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
