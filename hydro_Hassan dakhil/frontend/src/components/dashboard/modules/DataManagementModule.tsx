import { useLocation } from "react-router-dom";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataManagementHub } from "./data-management/DataManagementHub";
import { DataManagementKpis } from "./data-management/DataManagementKpis";
import { DataManagementOperations } from "./data-management/DataManagementOperations";
import { ObservedIngestionPage } from "./data-management/ObservedIngestionPage";
import { SentinelIngestionPage } from "./data-management/SentinelIngestionPage";
import { SwatIngestionPage } from "./data-management/SwatIngestionPage";
import { useSwatDataManagement } from "./data-management/useSwatDataManagement";

export type DataManagementView = "hub" | "sentinel" | "observed" | "swat";

function resolveDataManagementView(pathname: string): DataManagementView {
  if (pathname.includes("/dashboard/data/ingestion-sentinel")) return "sentinel";
  if (pathname.includes("/dashboard/data/ingestion-observee")) return "observed";
  if (pathname.includes("/dashboard/data/ingestion-swat")) return "swat";
  return "hub";
}

export function DataManagementModule() {
  const location = useLocation();
  const view = resolveDataManagementView(location.pathname);
  const ops = useSwatDataManagement();

  if (view === "sentinel") {
    return <SentinelIngestionPage />;
  }

  if (view === "observed") {
    return <ObservedIngestionPage />;
  }

  if (view === "swat") {
    return <SwatIngestionPage onImportComplete={ops.load} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Gestion de données</h2>
          <p className="text-sm text-muted-foreground">
            Consultation des données importées et accès aux modules d&apos;ingestion.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={ops.load} disabled={ops.loading}>
          <RefreshCcw className="h-4 w-4" />
          Rafraîchir
        </Button>
      </div>

      {ops.error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{ops.error}</div>
      )}

      <DataManagementKpis summary={ops.summary} />
      <DataManagementHub />
      <DataManagementOperations ops={ops} />
    </div>
  );
}
