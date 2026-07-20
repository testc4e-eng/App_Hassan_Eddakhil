import type {
  ReliabilityLevel,
  SedimentAppreciation,
  SedimentConfidenceRange,
  SedimentEstimationResult,
  SedimentEstimationRule,
  SedimentEstimationValidationError,
} from "./sedimentFlowEstimation.types";

// Source métier : tableau officiel des lois d’estimation du transport solide.
// Ne pas modifier les coefficients sans validation de l’équipe métier.
export const SEDIMENT_ESTIMATION_RULES: readonly SedimentEstimationRule[] = [
  {
    minExclusive: 0,
    maxInclusive: 1,
    coefficient: 137.5,
    exponent: 2.105,
    classLabel: "0 < Q ≤ 1",
    formulaLabel: "Qs = 137,5 × Q^2,105",
    intervalTonnes: 12.17,
    intervalVolume: 10,
    r2: 0.858,
    nombrePoints: 2025,
    pointsInclus: 75.21,
    appreciation: "À adopter",
  },
  {
    minExclusive: 1,
    maxInclusive: 10,
    coefficient: 116.2,
    exponent: 1.716,
    classLabel: "1 < Q ≤ 10",
    formulaLabel: "Qs = 116,2 × Q^1,716",
    intervalTonnes: 147.4,
    intervalVolume: 110,
    r2: 0.962,
    nombrePoints: 4554,
    pointsInclus: 74.7,
    appreciation: "À adopter",
  },
  {
    minExclusive: 10,
    maxInclusive: 20,
    coefficient: 147.4,
    exponent: 1.609,
    classLabel: "10 < Q ≤ 20",
    formulaLabel: "Qs = 147,4 × Q^1,609",
    intervalTonnes: 1613,
    intervalVolume: 1240,
    r2: 0.739,
    nombrePoints: 484,
    pointsInclus: 73.55,
    appreciation: "À adopter",
  },
  {
    minExclusive: 20,
    maxInclusive: 50,
    coefficient: 229.1,
    exponent: 1.463,
    classLabel: "20 < Q ≤ 50",
    formulaLabel: "Qs = 229,1 × Q^1,463",
    intervalTonnes: 10270,
    intervalVolume: 7900,
    r2: 0.595,
    nombrePoints: 259,
    pointsInclus: 71.43,
    appreciation: "À adopter avec précaution",
  },
  {
    minExclusive: 50,
    coefficient: 159.9,
    exponent: 1.544,
    classLabel: "Q > 50",
    formulaLabel: "Qs = 159,9 × Q^1,544",
    intervalTonnes: 103200,
    intervalVolume: 7940,
    r2: 0.835,
    nombrePoints: 127,
    pointsInclus: 75.59,
    appreciation: "À adopter",
  },
] as const;

const frNumberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});

const frFixed2Formatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNumber(
  value: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  if (!Number.isFinite(value)) return "—";
  const minimumFractionDigits = options?.minimumFractionDigits;
  const maximumFractionDigits = options?.maximumFractionDigits;
  if (minimumFractionDigits === 2 && maximumFractionDigits === 2) {
    return frFixed2Formatter.format(value);
  }
  if (minimumFractionDigits !== undefined || maximumFractionDigits !== undefined) {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  }
  return frNumberFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

export function findEstimationRule(q: number): SedimentEstimationRule | null {
  if (!Number.isFinite(q) || q <= 0) return null;

  for (const rule of SEDIMENT_ESTIMATION_RULES) {
    const aboveMin = rule.minExclusive === undefined || q > rule.minExclusive;
    const belowOrEqualMax = rule.maxInclusive === undefined || q <= rule.maxInclusive;
    if (aboveMin && belowOrEqualMax) return rule;
  }

  return null;
}

export function calculateSedimentTransport(q: number, rule: SedimentEstimationRule): number {
  return rule.coefficient * Math.pow(q, rule.exponent);
}

export function calculateConfidenceRange(
  qs: number,
  intervalTonnes: number
): SedimentConfidenceRange {
  return {
    lowerBound: Math.max(0, qs - intervalTonnes),
    upperBound: qs + intervalTonnes,
  };
}

export function getReliabilityLevel(r2: number): ReliabilityLevel {
  if (r2 >= 0.8) return "élevée";
  if (r2 >= 0.7) return "moyenne";
  return "limitée";
}

export function getReliabilityLabel(level: ReliabilityLevel): string {
  if (level === "élevée") return "Fiabilité élevée";
  if (level === "moyenne") return "Fiabilité moyenne";
  return "Fiabilité limitée";
}

export function validateDischargeInput(rawValue: string): {
  error: SedimentEstimationValidationError | null;
  q: number | null;
} {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { error: "empty", q: null };
  }

  const normalized = trimmed.replace(",", ".");
  const q = Number(normalized);
  if (!Number.isFinite(q)) {
    return { error: "not_numeric", q: null };
  }
  if (q <= 0) {
    return { error: "not_positive", q: null };
  }

  return { error: null, q };
}

export function getValidationMessage(error: SedimentEstimationValidationError): string {
  if (error === "empty") return "Veuillez saisir une valeur de débit.";
  if (error === "not_positive") return "Le débit doit être strictement supérieur à 0 m³/s.";
  return "Veuillez saisir une valeur numérique valide.";
}

export function estimateSedimentTransport(q: number): SedimentEstimationResult | null {
  const rule = findEstimationRule(q);
  if (!rule) return null;

  const qs = calculateSedimentTransport(q, rule);
  const confidenceRange = calculateConfidenceRange(qs, rule.intervalTonnes);
  const reliabilityLevel = getReliabilityLevel(rule.r2);

  return {
    q,
    qs,
    rule,
    confidenceRange,
    reliabilityLevel,
    reliabilityLabel: getReliabilityLabel(reliabilityLevel),
  };
}

export function appreciationBadgeClass(appreciation: SedimentAppreciation): string {
  if (appreciation === "À adopter avec précaution") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }
  return "border-emerald-300 bg-emerald-50 text-emerald-800";
}

export function reliabilityToneClass(level: ReliabilityLevel): string {
  if (level === "élevée") return "text-emerald-700";
  if (level === "moyenne") return "text-amber-700";
  return "text-orange-700";
}
