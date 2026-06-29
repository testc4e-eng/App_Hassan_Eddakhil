import { ArrowRight, ClipboardList, Database, Satellite } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const INGESTION_MODULES = [
  {
    id: "sentinel",
    path: "/dashboard/data/ingestion-sentinel",
    title: "Ingestion en temps réel Sentinel",
    description: "Intégration des données satellitaires ou temps réel Sentinel.",
    icon: Satellite,
    badge: "En construction / En attente cadrage client",
    badgeClass: "border-amber-300 bg-amber-50 text-amber-800",
    cardClass: "border-dashed border-amber-200/80 bg-amber-50/20",
    available: false,
  },
  {
    id: "observed",
    path: "/dashboard/data/ingestion-observee",
    title: "Ingestion des données observées",
    description: "Import des données observées terrain et stations.",
    icon: ClipboardList,
    badge: "En construction / En attente cadrage client",
    badgeClass: "border-amber-300 bg-amber-50 text-amber-800",
    cardClass: "border-dashed border-amber-200/80 bg-amber-50/20",
    available: false,
  },
  {
    id: "swat",
    path: "/dashboard/data/ingestion-swat",
    title: "Ingestion des données simulées SWAT",
    description: "Import technique des sorties SWAT (MDB Access) vers la base Hydro HD.",
    icon: Database,
    badge: "Disponible",
    badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
    cardClass: "border-primary/25 shadow-sm",
    available: true,
  },
] as const;

export function DataManagementHub() {
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">Modules d&apos;ingestion des données</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez un module pour ouvrir sa page d&apos;ingestion dédiée.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {INGESTION_MODULES.map((module) => (
          <Card key={module.id} className={`flex flex-col ${module.cardClass}`}>
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2">
                <module.icon className={`h-5 w-5 shrink-0 ${module.available ? "text-primary" : "text-amber-700"}`} />
                <CardTitle className="text-base leading-snug">{module.title}</CardTitle>
              </div>
              <Badge variant="outline" className={`w-fit ${module.badgeClass}`}>
                {module.badge}
              </Badge>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Button
                className="w-full"
                variant={module.available ? "default" : "outline"}
                onClick={() => navigate(module.path)}
              >
                Ouvrir le module
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
