import { IngestionPageShell } from "./IngestionPageShell";
import { IngestionWorkflowPlaceholder } from "./IngestionWorkflowPlaceholder";

export function SentinelIngestionPage() {
  return (
    <IngestionPageShell
      title="Ingestion en temps réel Sentinel"
      description="Module prévu pour les données Sentinel et temps réel."
      statusLabel="En construction / En attente cadrage client"
    >
      <IngestionWorkflowPlaceholder message="Module en attente de cadrage client. L'intégration des flux Sentinel (satellite, temps réel) sera disponible après validation du périmètre fonctionnel." />
    </IngestionPageShell>
  );
}
