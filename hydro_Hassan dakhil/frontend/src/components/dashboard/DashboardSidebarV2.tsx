import { type ComponentType, useEffect, useState } from "react";
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

export const DASHBOARD_SIDEBAR_WIDTH_EXPANDED = 260;
export const DASHBOARD_SIDEBAR_WIDTH_COLLAPSED = 56;
export const DASHBOARD_NAVBAR_HEIGHT = "3.5rem";

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

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  );

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isMobile;
}

export function DashboardSidebarV2({
  activeSection,
  onSectionChange,
}: DashboardSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  const sidebarSections: SidebarGroup[] = [
    {
      title: t("sidebar.groupCarto"),
      items: [
        { id: "spatial", label: t("sidebar.spatial"), icon: MapPin, color: "text-emerald-400" },
      ],
    },
    {
      title: t("sidebar.groupDashboard"),
      items: [
        { id: "climate", label: t("sidebar.climate"), icon: Cloud, color: "text-sky-400" },
        { id: "hydraulic", label: t("sidebar.hydraulic"), icon: Droplets, color: "text-cyan-400" },
        { id: "sediment", label: t("sidebar.erosion"), icon: Mountain, color: "text-amber-400" },
      ],
    },
    {
      title: t("sidebar.groupData"),
      items: [
        { id: "simulatedData", label: t("sidebar.simulatedData"), icon: Database, color: "text-indigo-400" },
        { id: "dataScan", label: t("sidebar.scan"), icon: Search, color: "text-violet-400" },
      ],
    },
    {
      title: t("sidebar.groupReporting"),
      items: [
        { id: "reports", label: t("sidebar.reports"), icon: FileText, color: "text-rose-400" },
      ],
    },
  ];

  const expandedWidth = DASHBOARD_SIDEBAR_WIDTH_EXPANDED;
  const collapsedWidth = DASHBOARD_SIDEBAR_WIDTH_COLLAPSED;
  const layoutWidth = collapsed ? collapsedWidth : isMobile ? collapsedWidth : expandedWidth;

  const handleItemClick = (id: DashboardSection) => {
    onSectionChange(id);
    if (isMobile) {
      setCollapsed(true);
    }
  };

  return (
    <>
      {isMobile && !collapsed ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 top-14 z-30 bg-black/45 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      ) : null}

      <div
        className="shrink-0 transition-[width] duration-300 ease-in-out"
        style={{ width: layoutWidth }}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed left-0 z-50 flex flex-col border-r border-white/[0.08]",
          "bg-gradient-to-b from-[#0f172a] via-[#102033] to-[#0b1628]",
          "shadow-[4px_0_24px_rgba(0,0,0,0.18)]",
          "transition-[width] duration-300 ease-in-out",
          collapsed ? "w-14" : "w-[260px]",
          isMobile && !collapsed && "shadow-2xl"
        )}
        style={{
          top: DASHBOARD_NAVBAR_HEIGHT,
          height: `calc(100vh - ${DASHBOARD_NAVBAR_HEIGHT})`,
        }}
      >
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
          className={cn(
            "absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center",
            "rounded-full border border-white/10 bg-[#1e293b] text-slate-200",
            "shadow-md transition-colors hover:bg-[#334155] hover:text-white"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        <nav className="flex-1 overflow-x-hidden overflow-y-auto px-2.5 py-4">
          <div className="space-y-5">
            {sidebarSections.map((group) => (
              <section key={group.title} className="space-y-1">
                {!collapsed ? (
                  <p className="px-3 pb-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {group.title}
                  </p>
                ) : (
                  <div className="mx-2 my-2 h-px bg-white/[0.08]" />
                )}

                {group.items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={collapsed ? item.label : undefined}
                      onClick={() => handleItemClick(item.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                        isActive
                          ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/25"
                          : "text-slate-200 hover:bg-white/[0.06] hover:text-white"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          isActive ? "text-white" : item.color
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate text-sm font-medium leading-tight">
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })}

                {group.title === t("sidebar.groupReporting") && isAdmin ? (
                  <button
                    type="button"
                    title={collapsed ? "Gestion utilisateurs" : undefined}
                    onClick={() => {
                      navigate("/admin/users");
                      if (isMobile) setCollapsed(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-200 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
                  >
                    <Users className="h-[18px] w-[18px] shrink-0 text-rose-400" />
                    {!collapsed && (
                      <span className="truncate text-sm font-medium leading-tight">
                        Gestion utilisateurs
                      </span>
                    )}
                  </button>
                ) : null}
              </section>
            ))}
          </div>
        </nav>

        {!collapsed && (
          <div className="border-t border-white/[0.08] px-4 py-4">
            <div className="text-center text-[11px] leading-relaxed text-slate-400">
              <p className="font-medium text-slate-300">{t("sidebar.footerTitle")}</p>
              <p className="mt-0.5">{t("sidebar.footerSubtitle")}</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
