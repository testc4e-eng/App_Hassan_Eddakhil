import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type IngestionPageShellProps = {
  title: string;
  description: string;
  statusLabel: string;
  statusVariant?: "construction" | "available";
  children: ReactNode;
};

export function IngestionPageShell({
  title,
  description,
  statusLabel,
  statusVariant = "construction",
  children,
}: IngestionPageShellProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard?section=simulatedData")}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à Gestion de donnée
        </Button>
        <Badge
          variant="outline"
          className={
            statusVariant === "available"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-amber-300 bg-amber-50 text-amber-800"
          }
        >
          {statusLabel}
        </Badge>
      </div>

      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {children}
    </div>
  );
}
