export const BATHY_HAD_NORMAL_LEVEL_M = 1122.2;

export const BATHY_PERIOD_DEFINITIONS = [
  { label: "1990 - 1999", startYear: 1990, endYear: 1999 },
  { label: "1999 - 2004", startYear: 1999, endYear: 2004 },
  { label: "2004 - 2008", startYear: 2004, endYear: 2008 },
  { label: "2008 - 2014", startYear: 2008, endYear: 2014 },
  { label: "2014 - 2022", startYear: 2014, endYear: 2022 },
] as const;

/**
 * Le fichier bathy_HAD.xlsx porte l'annee de mesure 2013 pour la campagne
 * intermediaire. L'application conserve l'etiquette 2014 (referentiel campagne ABH).
 */
export const MEASUREMENT_TO_CAMPAIGN_YEAR: Record<number, number> = {
  2013: 2014,
};

export function resolveCampaignYear(measurementYear: number): number {
  return MEASUREMENT_TO_CAMPAIGN_YEAR[measurementYear] ?? measurementYear;
}

export type BathymetryCampaignLike = {
  campaign_year: number;
  silted_since_previous_mhm3?: number | null;
};

export type BathymetryPeriodVolume = {
  period: string;
  volume_silted_mhm3: number;
  fromYear: number;
  toYear: number;
};

export function buildPeriodVolumesFromBathymetryCampaigns(
  campaigns: BathymetryCampaignLike[]
): BathymetryPeriodVolume[] {
  const byCampaignYear = new Map(
    campaigns.map((row) => [Number(row.campaign_year), row])
  );

  return BATHY_PERIOD_DEFINITIONS.map((period) => {
    const endRow = byCampaignYear.get(period.endYear);
    const volume = Number(endRow?.silted_since_previous_mhm3 ?? 0);
    return {
      period: period.label,
      volume_silted_mhm3: Number.isFinite(volume) ? volume : 0,
      fromYear: period.startYear,
      toYear: period.endYear,
    };
  });
}
