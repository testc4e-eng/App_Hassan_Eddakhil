// frontend/src/api/client.ts
import { httpGet } from "./http";

export function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * API GET standard pour le projet.
 * Path attendu: "/hydro/stations" ou "hydro/stations"
 */
export function apiGet<T>(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return httpGet<T>(p);
}
