import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (user) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/dashboard"} replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef6fb_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-[-5rem] h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-[-5rem] top-24 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px] items-center justify-center px-4 py-10 lg:px-5">
          <div className="w-full flex items-center justify-center">
            <LoginForm />
          </div>
        </main>
      </div>
    </div>
  );
}
