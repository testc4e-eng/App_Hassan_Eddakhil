export const OFFICIAL_CAMPAIGN_YEARS = [1990, 1999, 2004, 2008, 2014, 2022] as const;

export const DISALLOWED_CAMPAIGN_YEARS = [2000, 2005, 2009] as const;

export type OfficialCampaignYear = (typeof OFFICIAL_CAMPAIGN_YEARS)[number];

export type EvolutionPeriodDefinition = {
  label: string;
  startYear: OfficialCampaignYear;
  endYear: OfficialCampaignYear;
};

export const EVOLUTION_PERIODS: EvolutionPeriodDefinition[] = [
  { label: "1990 - 1999", startYear: 1990, endYear: 1999 },
  { label: "1999 - 2004", startYear: 1999, endYear: 2004 },
  { label: "2004 - 2008", startYear: 2004, endYear: 2008 },
  { label: "2008 - 2014", startYear: 2008, endYear: 2014 },
  { label: "2014 - 2022", startYear: 2014, endYear: 2022 },
];

export type HsvPointLike = {
  campaign_year: number;
  volume_mhm3?: number | null;
};

export type EvolutionPointLike = {
  year: number;
  cumulative_silted_mhm3?: number | null;
  annual_silted_mhm3?: number | null;
};

export type PeriodVolumeRow = {
  period: string;
  volume_silted_mhm3: number;
  fromYear: number;
  toYear: number;
};

function toFinite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function isOfficialCampaignYear(year: number): year is OfficialCampaignYear {
  return (OFFICIAL_CAMPAIGN_YEARS as readonly number[]).includes(year);
}

export function isDisallowedCampaignYear(year: number): boolean {
  return (DISALLOWED_CAMPAIGN_YEARS as readonly number[]).includes(year);
}

export function cumulativeAtOrBefore(
  evolution: EvolutionPointLike[],
  year: number
): number {
  const ordered = [...evolution]
    .map((row) => ({
      year: toFinite(row.year),
      cumulative: toFinite(row.cumulative_silted_mhm3),
      annual: toFinite(row.annual_silted_mhm3),
    }))
    .filter((row): row is { year: number; cumulative: number | null; annual: number | null } => row.year !== null)
    .sort((a, b) => a.year - b.year);

  const exact = ordered.find((row) => row.year === year);
  if (exact?.cumulative !== null && exact?.cumulative !== undefined) {
    return exact.cumulative;
  }

  let running = 0;
  for (const row of ordered) {
    if (row.year > year) break;
    if (row.cumulative !== null) {
      running = row.cumulative;
      continue;
    }
    if (row.annual !== null) {
      running += row.annual;
    }
  }

  const previous = [...ordered]
    .filter((row) => row.year <= year)
    .sort((a, b) => b.year - a.year)[0];
  if (previous?.cumulative !== null && previous?.cumulative !== undefined) {
    return previous.cumulative;
  }

  return running;
}

function maxVolumeByCampaign(hsv: HsvPointLike[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const row of hsv) {
    const year = toFinite(row.campaign_year);
    const volume = toFinite(row.volume_mhm3);
    if (year === null || volume === null) continue;
    map.set(year, Math.max(map.get(year) ?? Number.NEGATIVE_INFINITY, volume));
  }
  return map;
}

export function buildPeriodVolumes(
  evolution: EvolutionPointLike[],
  hsv: HsvPointLike[] = []
): PeriodVolumeRow[] {
  const hsvMaxByYear = maxVolumeByCampaign(hsv);

  return EVOLUTION_PERIODS.map((period) => {
    const startHsv = hsvMaxByYear.get(period.startYear);
    const endHsv = hsvMaxByYear.get(period.endYear);
    const volumeFromHsv =
      startHsv !== undefined && endHsv !== undefined
        ? Math.max(startHsv - endHsv, 0)
        : null;
    const volumeFromEvolution = Math.max(
      cumulativeAtOrBefore(evolution, period.endYear) -
        cumulativeAtOrBefore(evolution, period.startYear),
      0
    );

    return {
      period: period.label,
      volume_silted_mhm3: volumeFromHsv ?? volumeFromEvolution,
      fromYear: period.startYear,
      toYear: period.endYear,
    };
  });
}
