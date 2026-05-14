import { type ComponentType, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Users,
} from "lucide-react";
import type { DashboardSection } from "@/components/dashboard/DashboardSidebar";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

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

export function DashboardSidebarV2({
  activeSection,
  onSectionChange,
}: DashboardSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const sidebarSections: SidebarGroup[] = [
    {
      title: t("sidebar.groupDashboard"),
      items: [
        { id: "climate", label: t("sidebar.climate"), icon: Cloud, color: "text-blue-500" },
        { id: "hydraulic", label: t("sidebar.hydraulic"), icon: Droplets, color: "text-cyan-500" },
        { id: "sediment", label: t("sidebar.erosion"), icon: Mountain, color: "text-amber-600" },
      ],
    },
    {
      title: t("sidebar.groupCarto"),
      items: [{ id: "spatial", label: t("sidebar.spatial"), icon: MapPin, color: "text-green-500" }],
    },
    {
      title: t("sidebar.groupData"),
      items: [
        { id: "simulatedData", label: t("sidebar.simulatedData"), icon: Database, color: "text-indigo-500" },
        { id: "dataScan", label: t("sidebar.scan"), icon: Search, color: "text-violet-500" },
      ],
    },
    {
      title: t("sidebar.groupReporting"),
      items: [
        { id: "reports", label: t("sidebar.reports"), icon: FileText, color: "text-rose-500" },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "h-[calc(100vh-3.5rem)] bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-14" : "w-52"
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

      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        <div className="space-y-2">
          {sidebarSections.map((group) => (
            <section key={group.title} className="space-y-1">
              {!collapsed ? (
                <p className="text-[10px] uppercase tracking-[0.08em] text-sidebar-foreground/55 px-2.5 pt-1 pb-1">
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
                      "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon
                      className={cn("w-4 h-4 flex-shrink-0", !isActive && item.color)}
                    />
                    {!collapsed && (
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}

              {group.title === t("sidebar.groupReporting") && isAdmin ? (
                <button
                  type="button"
                  title={collapsed ? "Gestion utilisateurs" : undefined}
                  onClick={() => navigate("/admin/users")}
                  className={cn(
                    "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-200 text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Users className={cn("w-4 h-4 flex-shrink-0 text-rose-500")} />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">Gestion utilisateurs</span>
                  )}
                </button>
              ) : null}
            </section>
          ))}
        </div>
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border">
            <div className="text-[11px] text-sidebar-foreground/60 text-center">
            {t("sidebar.footerTitle")}
            <br />
            {t("sidebar.footerSubtitle")}
          </div>
        </div>
      )}
    </aside>
  );
}
