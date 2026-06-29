import { IngestionPageShell } from "./IngestionPageShell";
import { IngestionWorkflowPlaceholder } from "./IngestionWorkflowPlaceholder";

export function ObservedIngestionPage() {
  return (
    <IngestionPageShell
      title="Ingestion des données observées"
      description="Module prévu pour importer les données terrain et stations."
      statusLabel="En construction / En attente cadrage client"
    >
      <IngestionWorkflowPlaceholder message="Module en attente de cadrage client. L'import des données observées (stations, CSV/Excel) sera activé après définition du modèle de données et des règles de validation." />
    </IngestionPageShell>
  );
}
