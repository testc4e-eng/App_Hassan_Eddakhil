import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardSidebarV2 } from "@/components/dashboard/DashboardSidebarV2";
import type { DashboardSection } from "@/components/dashboard/DashboardSidebar";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function AdminLayout({ title, description, children, actions }: Props) {
  const [activeSection, setActiveSection] = useState<DashboardSection>("reports");
  const navigate = useNavigate();

  const handleSectionChange = (section: DashboardSection) => {
    setActiveSection(section);
    navigate(`/dashboard?section=${encodeURIComponent(section)}`);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Navbar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <DashboardSidebarV2
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col overflow-hidden">
            <header className="z-20 shrink-0 border-b border-border bg-background px-4 py-2.5 lg:px-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-lg font-bold text-foreground lg:text-[1.15rem]">{title}</h1>
                  {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
                </div>
                {actions ? <div className="mt-1 sm:mt-0">{actions}</div> : null}
              </div>
            </header>
            <section className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 lg:p-4">{children}</section>
          </div>
        </main>
      </div>
    </div>
  );
}
