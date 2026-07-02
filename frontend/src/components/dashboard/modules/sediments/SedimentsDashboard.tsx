import { useEffect, useState } from "react";
import { Waves, Mountain, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnvasementDashboard } from "./EnvasementDashboard";
import { SpecificDegradationDashboard } from "./SpecificDegradationDashboard";
import { ReachSedimentDashboard } from "./ReachSedimentDashboard";

type SedimentsMode = "envasement" | "specific" | "reach";

const MODES: Array<{
  id: SedimentsMode;
  title: string;
  subtitle: string;
  icon: typeof Waves;
}> = [
  {
    id: "envasement",
    title: "Evaluation d'envasement",
    subtitle: "KPI barrage, HSV, évolution et exports",
    icon: Waves,
  },
  {
    id: "specific",
    title: "Dégradation spécifique",
    subtitle: "Dégradation spécifique (t/ha) par sous-bassin et scénarios",
    icon: Mountain,
  },
  {
    id: "reach",
    title: "Transport solide Reach",
    subtitle: "Sediment (t) au niveau des 19 reaches",
    icon: Route,
  },
];

export function SedimentsDashboard() {
  const [mode, setMode] = useState<SedimentsMode>("envasement");

  useEffect(() => {
    if (!(import.meta as any).env?.DEV) return;
    console.debug("[sediments][render]", { selectedMode: mode });
  }, [mode]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-4 px-4 lg:px-5">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {MODES.map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;
          return (
            <Button
              key={item.id}
              type="button"
              variant={active ? "default" : "outline"}
              className={[
                "h-auto justify-start rounded-2xl px-5 py-4 text-left shadow-sm transition-all",
                active
                  ? "bg-slate-950 text-white hover:bg-slate-900"
                  : "bg-white hover:bg-slate-50",
              ].join(" ")}
              onClick={() => setMode(item.id)}
            >
              <Icon className="mr-3 h-5 w-5 shrink-0" />
              <span className="flex flex-col items-start">
                <span className="text-base font-semibold">{item.title}</span>
                <span className={active ? "text-xs text-white/75" : "text-xs text-slate-500"}>
                  {item.subtitle}
                </span>
              </span>
            </Button>
          );
        })}
      </div>

      {mode === "envasement" ? <EnvasementDashboard /> : null}
      {mode === "specific" ? <SpecificDegradationDashboard /> : null}
      {mode === "reach" ? <ReachSedimentDashboard /> : null}
    </div>
  );
}
