export type SedimentAppreciation = "À adopter" | "À adopter avec précaution";

export type ReliabilityLevel = "élevée" | "moyenne" | "limitée";

/**
 * Source métier : tableau officiel des lois d’estimation du transport solide.
 * Ne pas modifier les coefficients sans validation de l’équipe métier.
 */
export type SedimentEstimationRule = {
  minExclusive?: number;
  maxInclusive?: number;
  coefficient: number;
  exponent: number;
  classLabel: string;
  formulaLabel: string;
  intervalTonnes: number;
  intervalVolume: number;
  r2: number;
  nombrePoints: number;
  pointsInclus: number;
  appreciation: SedimentAppreciation;
};

export type SedimentConfidenceRange = {
  lowerBound: number;
  upperBound: number;
};

export type SedimentEstimationResult = {
  q: number;
  qs: number;
  rule: SedimentEstimationRule;
  confidenceRange: SedimentConfidenceRange;
  reliabilityLevel: ReliabilityLevel;
  reliabilityLabel: string;
};

export type SedimentEstimationValidationError =
  | "empty"
  | "not_numeric"
  | "not_positive";
