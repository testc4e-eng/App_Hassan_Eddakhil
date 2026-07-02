import { toPng } from "html-to-image";

type ChartFileNameArgs = {
  prefix: string;
  station?: string | null;
  scenario?: string | null;
  variable?: string | null;
  aggregation?: string | null;
  mode?: string | null;
};

function sanitizePart(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildChartImageFileName(args: ChartFileNameArgs): string {
  const parts = [
    sanitizePart(args.prefix) || "chart",
    sanitizePart(args.station),
    sanitizePart(args.scenario),
    sanitizePart(args.variable),
    sanitizePart(args.aggregation),
    sanitizePart(args.mode),
  ].filter(Boolean);

  return `${parts.join("_") || "chart"}.png`;
}

export async function downloadChartAsImage(
  ref: React.RefObject<HTMLElement | null>,
  fileName: string
): Promise<void> {
  const node = ref.current;
  if (!node) return;

  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    backgroundColor: "#ffffff",
  });

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName || "chart.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
