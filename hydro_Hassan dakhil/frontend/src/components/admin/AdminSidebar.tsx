import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, LayoutDashboard, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const ITEMS: AdminItem[] = [
  { href: "/admin", label: "Dashboard admin", icon: LayoutDashboard },
  { href: "/admin/users", label: "Gestion utilisateurs", icon: Users },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "relative h-[calc(100vh-4rem)] border-r border-sidebar-border bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <button
        onClick={() => setCollapsed((value) => !value)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar hover:bg-sidebar-accent"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 text-sidebar-foreground" />
        )}
      </button>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-3">
          <section className="space-y-1">
            {!collapsed ? (
              <p className="px-3 pb-1 pt-1 text-[11px] uppercase tracking-[0.08em] text-sidebar-foreground/55">
                Administration
              </p>
            ) : (
              <div className="mx-2 my-2 h-px bg-sidebar-border" />
            )}

            {ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", !isActive && "text-rose-500")} />
                  {!collapsed ? <span className="truncate text-sm font-medium">{item.label}</span> : null}
                </Link>
              );
            })}
          </section>
        </div>
      </nav>

      {!collapsed ? (
        <div className="border-t border-sidebar-border p-4">
          <div className="text-center text-xs text-sidebar-foreground/60">
            Hydro-Data Intelligence
            <br />
            Barrage Hassan Addakhil
          </div>
        </div>
      ) : null}
    </aside>
  );
}
