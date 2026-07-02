import { ClipboardCheck, Construction, Download, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type IngestionWorkflowPlaceholderProps = {
  message: string;
};

export function IngestionWorkflowPlaceholder({ message }: IngestionWorkflowPlaceholderProps) {
  return (
    <div className="space-y-4">
      <Card className="border-dashed border-amber-200 bg-amber-50/30">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <Construction className="h-11 w-11 text-amber-600" />
          <p className="max-w-xl text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>

      <Card className="opacity-90">
        <CardHeader>
          <CardTitle className="text-base">Test d&apos;ingestion</CardTitle>
          <CardDescription>
            Vérification préalable des sources, formats et volumes avant import.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled variant="outline">
            <FlaskConical className="h-4 w-4" />
            Tester l&apos;ingestion
          </Button>
        </CardContent>
      </Card>

      <Card className="opacity-90">
        <CardHeader>
          <CardTitle className="text-base">Audit avant validation</CardTitle>
          <CardDescription>
            Contrôle des lignes, variables, périodes et entités avant validation finale.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button disabled variant="outline">
            <ClipboardCheck className="h-4 w-4" />
            Audit avant validation
          </Button>
          <Button disabled>
            <Download className="h-4 w-4" />
            Lancer ingestion
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
