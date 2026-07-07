export type MissionReportType = "PDF" | "Word" | "Autre";

export type MissionReport = {
  title: string;
  fileName: string;
  type: MissionReportType;
  url: string;
};

export type ThematicMap = {
  id: string;
  title: string;
  fileName: string;
  imageUrl: string;
  thumbnailUrl: string;
};

const REPORT_MAPS_BASE = "/data/hassan/report-maps";

function reportMapUrls(slug: string) {
  return {
    thumbnailUrl: `${REPORT_MAPS_BASE}/thumbs/${slug}.jpg`,
    imageUrl: `${REPORT_MAPS_BASE}/full/${slug}.jpg`,
  };
}

const REPORTS_BASE = "/data/hassan/reports";

function reportUrl(fileName: string): string {
  return `${REPORTS_BASE}/${encodeURIComponent(fileName)}`;
}

function resolveReportType(fileName: string): MissionReportType {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "PDF";
  if (ext === "doc" || ext === "docx") return "Word";
  return "Autre";
}

export const missionReports: MissionReport[] = [
  {
    title: "Rapport Mission I",
    fileName: "Rapport Mission 1 VF 20262001.pdf",
    type: "PDF",
    url: reportUrl("Rapport Mission 1 VF 20262001.pdf"),
  },
  {
    title: "Rapport Mission II",
    fileName: "Mission II 19052026_VDf_vcremarques.pdf",
    type: "PDF",
    url: reportUrl("Mission II 19052026_VDf_vcremarques.pdf"),
  },
];

export const thematicMaps: ThematicMap[] = [
  {
    id: "altitude",
    title: "Altitude",
    fileName: "altitude.jpg",
    ...reportMapUrls("altitude"),
  },
  {
    id: "carte-sous-bassin",
    title: "Carte sous-bassin",
    fileName: "carte sous bassin.jpg",
    ...reportMapUrls("carte-sous-bassin"),
  },
  {
    id: "debit-moyen-annuel",
    title: "Débit moyen annuel",
    fileName: "debit moyen annuel.jpg",
    ...reportMapUrls("debit-moyen-annuel"),
  },
  {
    id: "facteur-erodabilite-k",
    title: "Facteur d'érodabilité K",
    fileName: "Facteur d'érodabilité k.jpg",
    ...reportMapUrls("facteur-erodabilite-k"),
  },
  {
    id: "luc-s1",
    title: "Occupation du sol S1",
    fileName: "luc S1.jpg",
    ...reportMapUrls("luc-s1"),
  },
  {
    id: "luc-s2",
    title: "Occupation du sol S2",
    fileName: "luc S2.jpg",
    ...reportMapUrls("luc-s2"),
  },
  {
    id: "luc-s3",
    title: "Occupation du sol S3",
    fileName: "luc S3.jpg",
    ...reportMapUrls("luc-s3"),
  },
  {
    id: "luc-s4",
    title: "Occupation du sol S4",
    fileName: "luc S4.jpg",
    ...reportMapUrls("luc-s4"),
  },
  {
    id: "occupation-sol",
    title: "Occupation du sol",
    fileName: "Occupatin de sol.jpg",
    ...reportMapUrls("occupation-sol"),
  },
  {
    id: "pente",
    title: "Pente",
    fileName: "Pente.jpg",
    ...reportMapUrls("pente"),
  },
  {
    id: "type-sol",
    title: "Type de sol",
    fileName: "Type de sol.jpg",
    ...reportMapUrls("type-sol"),
  },
];

export function downloadThematicMap(map: ThematicMap) {
  const anchor = document.createElement("a");
  anchor.href = map.imageUrl;
  anchor.download = map.fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function getMissionReportType(fileName: string): MissionReportType {
  return resolveReportType(fileName);
}
