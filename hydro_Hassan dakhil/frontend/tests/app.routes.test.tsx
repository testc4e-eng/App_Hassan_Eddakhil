import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/components/ui/toaster", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock("../src/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../src/contexts/HydroDataContext", () => ({
  HydroDataProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../src/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../src/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../src/components/auth/AdminRoute", () => ({
  AdminRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../src/pages/Home", () => ({
  default: () => <div>HOME_PAGE</div>,
}));

vi.mock("../src/pages/Dashboard", () => ({
  default: () => <div>DASHBOARD_PAGE</div>,
}));

vi.mock("../src/pages/Contact", () => ({
  default: () => <div>CONTACT_PAGE</div>,
}));

vi.mock("../src/pages/NotFound", () => ({
  default: () => <div>NOT_FOUND_PAGE</div>,
}));

vi.mock("../src/pages/Login", () => ({
  default: () => <div>LOGIN_PAGE</div>,
}));

vi.mock("../src/pages/AdminDashboard", () => ({
  default: () => <div>ADMIN_DASHBOARD_PAGE</div>,
}));

vi.mock("../src/pages/AdminUsers", () => ({
  default: () => <div>ADMIN_USERS_PAGE</div>,
}));

vi.mock("../src/pages/admin/DatabaseConfigPage", () => ({
  default: () => <div>DATABASE_CONFIG_PAGE</div>,
}));

vi.mock("../src/pages/ChangePassword", () => ({
  default: () => <div>CHANGE_PASSWORD_PAGE</div>,
}));

import App from "../src/App";

describe("frontend App routes", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("mounts and renders the login route", () => {
    window.history.pushState({}, "", "/login");
    render(<App />);

    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
  });

  it("renders the not found route for unknown paths", () => {
    window.history.pushState({}, "", "/unknown-route");
    render(<App />);

    expect(screen.getByText("NOT_FOUND_PAGE")).toBeInTheDocument();
  });
});
