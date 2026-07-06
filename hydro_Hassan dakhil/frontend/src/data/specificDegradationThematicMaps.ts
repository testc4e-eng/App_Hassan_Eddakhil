export type SpecificDegradationThematicMap = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  scenario: string;
  fileName: string;
  downloadUrl?: string;
};

export const SPECIFIC_DEGRADATION_MAPS_BASE = "/data/hassan/degradation-maps/specific";

export const specificDegradationThematicMaps: SpecificDegradationThematicMap[] = [
  {
    id: "degradation-specifique-etat-actuel",
    title: "Dégradation spécifique — État actuel",
    description: "Carte de dégradation spécifique du bassin versant pour le scénario état actuel.",
    imageUrl: `${SPECIFIC_DEGRADATION_MAPS_BASE}/degradation-specifique-etat-actuel.jpg`,
    scenario: "État actuel",
    fileName: "degradation-specifique-etat-actuel.jpg",
  },
  {
    id: "degradation-specifique-reboi-s1",
    title: "Dégradation spécifique — Reboisement S1",
    description: "Carte de dégradation spécifique pour le scénario de reboisement S1.",
    imageUrl: `${SPECIFIC_DEGRADATION_MAPS_BASE}/degradation-specifique-reboi-s1.jpg`,
    scenario: "Reboisement S1",
    fileName: "degradation-specifique-reboi-s1.jpg",
  },
  {
    id: "degradation-specifique-reboi-s2",
    title: "Dégradation spécifique — Reboisement S2",
    description: "Carte de dégradation spécifique pour le scénario de reboisement S2.",
    imageUrl: `${SPECIFIC_DEGRADATION_MAPS_BASE}/degradation-specifique-reboi-s2.jpg`,
    scenario: "Reboisement S2",
    fileName: "degradation-specifique-reboi-s2.jpg",
  },
  {
    id: "degradation-specifique-reboi-s3",
    title: "Dégradation spécifique — Reboisement S3",
    description: "Carte de dégradation spécifique pour le scénario de reboisement S3.",
    imageUrl: `${SPECIFIC_DEGRADATION_MAPS_BASE}/degradation-specifique-reboi-s3.jpg`,
    scenario: "Reboisement S3",
    fileName: "degradation-specifique-reboi-s3.jpg",
  },
  {
    id: "production-totale-sediments-1995-2023",
    title: "Production totale de sédiments (1995-2023)",
    description: "Carte de la production totale de sédiments sur la période 1995-2023.",
    imageUrl: `${SPECIFIC_DEGRADATION_MAPS_BASE}/production-totale-sediments-1995-2023.jpg`,
    scenario: "Production totale",
    fileName: "production-totale-sediments-1995-2023.jpg",
  },
  {
    id: "vulnerabilite",
    title: "Vulnérabilité du bassin versant",
    description: "Carte de vulnérabilité du bassin versant au phénomène d'érosion.",
    imageUrl: `${SPECIFIC_DEGRADATION_MAPS_BASE}/vulnerabilite.jpg`,
    scenario: "Vulnérabilité",
    fileName: "vulnerabilite.jpg",
  },
];
