import { parseISO } from "date-fns";

/** Fixed demo clock. All relative dates are compared to this, never `Date.now()`. */
export const DEMO_NOW_ISO = "2026-10-22T12:00:00";
export const DEMO_NOW = parseISO(DEMO_NOW_ISO);

export const DEMO_LATENCY_MS = 450;

/** Demo accounts the role screen and the top-bar switcher bind to. */
export const DEMO_HOMEOWNER_ID = "usr_ananya";
export const DEMO_DESIGNER_ID = "usr_rohan";
export const DEMO_FAMILY_ID = "usr_meera";
export const DEMO_INDIRANAGAR_ID = "usr_karthik";

export function delay(ms = DEMO_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let sequence = 0;

export function createId(prefix: string): string {
  sequence += 1;
  return `${prefix}_${sequence.toString(36).padStart(4, "0")}`;
}

export function resetIds(): void {
  sequence = 0;
}

/** Stable across refreshes, unlike the in-memory sequence in `createId`. */
export function uniqueId(prefix: string): string {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `${prefix}_${rand}`;
}
