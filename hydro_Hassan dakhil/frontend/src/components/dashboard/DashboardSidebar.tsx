//src/components/dashboard/DashboardSideBar.tsx
import { type ComponentType, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Cloud,
  Database,
  Search,
  Droplets,
  Mountain,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type DashboardSection =
  | "climate"
  | "hydraulic"
  | "sediment"
  | "spatial"
  | "maps"
  | "simulatedData"
  | "dataScan"
  | "reports";

interface DashboardSidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

type SidebarItem = {
  id: DashboardSection;
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
};

type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

const SIDEBAR_SECTIONS: SidebarGroup[] = [
  {
    title: "Dashboard",
    items: [
      {
        id: "climate",
        label: "Suivi Climat",
        icon: Cloud,
        color: "text-blue-500",
      },
      {
        id: "hydraulic",
        label: "Suivi Hydrologique",
        icon: Droplets,
        color: "text-cyan-500",
      },
      {
        id: "sediment",
        label: "Érosion / Sédiments",
        icon: Mountain,
        color: "text-amber-600",
      },
    ],
  },
  {
    title: "Cartographie",
    items: [
      {
        id: "spatial",
        label: "Analyse Spatiale",
        icon: MapPin,
        color: "text-green-500",
      },
    ],
  },
  {
    title: "Data",
    items: [
      {
        id: "simulatedData",
        label: "Données simulées",
        icon: Database,
        color: "text-indigo-500",
      },
      {
        id: "dataScan",
        label: "Scan de donnees",
        icon: Search,
        color: "text-violet-500",
      },
    ],
  },
  {
    title: "Reporting",
    items: [
      {
        id: "reports",
        label: "Rapport & Export",
        icon: FileText,
        color: "text-rose-500",
      },
    ],
  },
];

export function DashboardSidebar({
  activeSection,
  onSectionChange,
}: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-sidebar border border-sidebar-border rounded-full flex items-center justify-center hover:bg-sidebar-accent transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-sidebar-foreground" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-sidebar-foreground" />
        )}
      </button>

      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <div className="space-y-3">
          {SIDEBAR_SECTIONS.map((group) => (
            <section key={group.title} className="space-y-1">
              {!collapsed ? (
                <p className="text-[11px] uppercase tracking-[0.08em] text-sidebar-foreground/55 px-3 pt-1 pb-1">
                  {group.title}
                </p>
              ) : (
                <div className="h-px bg-sidebar-border mx-2 my-2" />
              )}

              {group.items.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={collapsed ? item.label : undefined}
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon
                      className={cn("w-5 h-5 flex-shrink-0", !isActive && item.color)}
                    />
                    {!collapsed && (
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </section>
          ))}
        </div>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60 text-center">
            Dashboard Hydrologique
            <br />
            Barrage Hassan Addakhil
          </div>
        </div>
      )}
    </aside>
  );
}
