import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: { count?: number }) =>
      typeof params?.count === "number" ? `${key}:${params.count}` : key,
  }),
}));

vi.mock("@/contexts/HydroDataContext", () => ({
  useHydroData: vi.fn(),
}));

vi.mock("@/components/layout/Navbar", () => ({
  Navbar: () => <div data-testid="navbar">navbar</div>,
}));

vi.mock("@/components/dashboard/DashboardSidebarV2", () => ({
  DashboardSidebarV2: ({ activeSection }: { activeSection: string }) => (
    <div data-testid="sidebar">{activeSection}</div>
  ),
}));

vi.mock("@/components/dashboard/modules/ClimateModule", () => ({
  ClimateModule: () => <div>climate-module</div>,
}));
vi.mock("@/components/dashboard/modules/HydraulicModule", () => ({
  HydraulicModule: () => <div>hydraulic-module</div>,
}));
vi.mock("@/components/dashboard/modules/sediments/SedimentsDashboard", () => ({
  SedimentsDashboard: () => <div>sediments-module</div>,
}));
vi.mock("@/components/dashboard/modules/SpatialModule", () => ({
  SpatialModule: () => <div>spatial-module</div>,
}));
vi.mock("@/components/dashboard/modules/MapsModule", () => ({
  MapsModule: () => <div>maps-module</div>,
}));
vi.mock("@/components/dashboard/modules/ReportsModule", () => ({
  ReportsModule: () => <div>reports-module</div>,
}));
vi.mock("@/components/dashboard/modules/DataManagementModule", () => ({
  DataManagementModule: () => <div>data-management-module</div>,
}));
vi.mock("@/pages/ScanDeDonneesPage", () => ({
  default: () => <div>scan-page</div>,
}));
vi.mock("@/features/intervention-program/pages/InterventionProgramDashboard", () => ({
  InterventionProgramDashboard: () => <div>intervention-program-module</div>,
}));

import { useHydroData } from "@/contexts/HydroDataContext";
import Dashboard from "../../src/pages/Dashboard";

describe("frontend Dashboard smoke", () => {
  beforeEach(() => {
    vi.mocked(useHydroData).mockReturnValue({
      loading: false,
      error: null,
      runs: [{ run_id: 1 }],
    } as never);
  });

  it("renders the spatial dashboard by default without crashing", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByText("spatial-module")).toBeInTheDocument();
    expect(screen.getByText("dashboard.apiOkRuns:1")).toBeInTheDocument();
  });

  it("renders the data management module for ingestion routes", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/data/ingestion-swat"]}>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText("data-management-module")).toBeInTheDocument();
  });
});
