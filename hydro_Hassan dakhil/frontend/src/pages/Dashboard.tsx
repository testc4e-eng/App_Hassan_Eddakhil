// frontend/src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { type DashboardSection } from "@/components/dashboard/DashboardSidebar";
import { DashboardSidebarV2 } from "@/components/dashboard/DashboardSidebarV2";

import { ClimateModule } from "@/components/dashboard/modules/ClimateModule";
import { HydraulicModule } from "@/components/dashboard/modules/HydraulicModule";
import { ErosionSedimentsModuleV3 } from "@/components/dashboard/modules/ErosionSedimentsModuleV3";
import { SpatialModule } from "@/components/dashboard/modules/SpatialModule";
import { MapsModule } from "@/components/dashboard/modules/MapsModule";
import { ReportsModule } from "@/components/dashboard/modules/ReportsModule";
import { SimulatedDataModuleV2 } from "@/components/dashboard/modules/SimulatedDataModuleV2";
import ScanDeDonneesPage from "@/pages/ScanDeDonneesPage";

import { useHydroData } from "@/contexts/HydroDataContext";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

// Mapper les sections aux composants
const MODULE_COMPONENTS: Record<DashboardSection, React.ComponentType> = {
  climate: ClimateModule,
  hydraulic: HydraulicModule,
  sediment: ErosionSedimentsModuleV3,
  spatial: SpatialModule,
  maps: MapsModule,
  simulatedData: SimulatedDataModuleV2,
  dataScan: ScanDeDonneesPage,
  reports: ReportsModule,
};

export default function Dashboard() {
  const { t } = useTranslation();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<DashboardSection>("climate");

  const {
    loading,
    error,
    runs,
    moduleProperties,
    availabilityByModule,
    stations,
    getStationsForModule,
  } = useHydroData();

  const sectionTitles = useMemo(
    () =>
      ({
        climate: t("dashboard.climate"),
        hydraulic: t("dashboard.hydro"),
        sediment: t("dashboard.erosion"),
        spatial: t("dashboard.spatial"),
        maps: t("dashboard.maps"),
        simulatedData: t("dashboard.simulatedData"),
        dataScan: t("dashboard.scan"),
        reports: t("dashboard.reports"),
      } as Record<DashboardSection, string>),
    [t]
  );

  const ActiveModule = MODULE_COMPONENTS[activeSection];
  const sectionTitle = sectionTitles[activeSection];

  const totalRuns = runs?.length || 0;

  const totalProperties =
    (moduleProperties?.climat?.length || 0) +
    (moduleProperties?.hydro?.length || 0) +
    (moduleProperties?.erosion?.length || 0);

  // Stations (catalog) = stations déduites de availability (par module)
  const stationsCatalogCount = useMemo(() => stations.length, [stations.length]);

  // Cache availability: nombre de lignes (donne une idée si l’API répond)
  const availabilityRowsCount = useMemo(() => {
    const c = availabilityByModule?.climat?.length || 0;
    const h = availabilityByModule?.hydro?.length || 0;
    const e = availabilityByModule?.erosion?.length || 0;
    return c + h + e;
  }, [availabilityByModule]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section");
    const validSections: DashboardSection[] = [
      "climate",
      "hydraulic",
      "sediment",
      "spatial",
      "maps",
      "simulatedData",
      "dataScan",
      "reports",
    ];
    if (section && validSections.includes(section as DashboardSection)) {
      setActiveSection(section as DashboardSection);
    }
  }, [location.search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">{t("dashboard.loadingCatalog")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-destructive mb-4">{t("dashboard.loadError")}</div>
            <p className="text-muted-foreground mb-4">{String(error)}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              {t("dashboard.retry")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Statistiques rapides */}
      <div className="bg-muted/50 border-b px-4 py-1.5">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 text-xs flex-wrap justify-end lg:px-5">
          <div>
            <span className="text-muted-foreground">{t("dashboard.runs")}</span>
            <span className="ml-2 font-medium">{totalRuns}</span>
          </div>

          <div>
            <span className="text-muted-foreground">{t("dashboard.variablesLoaded")}</span>
            <span className="ml-2 font-medium">{totalProperties}</span>
          </div>

          <div>
            <span className="text-muted-foreground">{t("dashboard.stationsCatalog")}</span>
            <span className="ml-2 font-medium">{stationsCatalogCount}</span>
          </div>

          <div>
            <span className="text-muted-foreground">{t("dashboard.availabilityRowsCache")}</span>
            <span className="ml-2 font-medium">{availabilityRowsCount}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        <aside className="sticky top-0 h-screen">
          <DashboardSidebarV2
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px]">
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border px-4 lg:px-5 py-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <h1 className="text-lg lg:text-[1.15rem] font-bold text-foreground">
                  {sectionTitle}
                </h1>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{t("dashboard.projectName")}</span>
                  <span>•</span>
                  <span>{t("dashboard.projectLocation")}</span>
                </div>
              </div>

              <div className="flex items-center mt-1 sm:mt-0">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {t("dashboard.apiOkRuns", { count: totalRuns })}
                </span>
              </div>
            </div>
          </header>

          <section className="p-3 lg:p-4 animate-fade-up">
            <ActiveModule />
          </section>
          </div>
        </main>
      </div>
    </div>
  );
}
