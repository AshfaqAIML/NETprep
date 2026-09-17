"use client";

/**
 * First-visit APK prompt state — a tiny external store read via
 * useSyncExternalStore (hydration-safe, lint-clean, cross-component).
 *
 * Rules:
 *  - Only Android visitors are eligible (never iOS/desktop).
 *  - First visit shows the prompt; dismissal is persisted and re-triggers
 *    after NEXT_PUBLIC_APK_PROMPT_RETRIGGER_DAYS days.
 *  - A recorded download permanently silences auto-prompts.
 *  - Master switch: NEXT_PUBLIC_APK_PROMPT_ENABLED=false.
 *  - QA URL param `apkPrompt`: 1 = force show, auto = simulate Android
 *    (respects dismissal), 0 = force hide.
 */
export interface ApkPromptState {
  firstVisitAt: number;
  visits: number;
  dismissedAt?: number;
  downloadedAt?: number;
}

const STORAGE_KEY = "netprep.apkPrompt.v1";
const DAY_MS = 24 * 60 * 60 * 1000;

let state: ApkPromptState | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — degrade gracefully
  }
}

/** One-time per-page init: reads state and counts this visit. */
function init() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  let existing: ApkPromptState | null = null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    existing = raw ? (JSON.parse(raw) as ApkPromptState) : null;
  } catch {
    existing = null;
  }
  state = existing
    ? { ...existing, visits: (existing.visits ?? 0) + 1 }
    : { firstVisitAt: Date.now(), visits: 1 };
  persist();
}

function update(mutate: (prev: ApkPromptState) => ApkPromptState) {
  init();
  state = mutate(state ?? { firstVisitAt: Date.now(), visits: 1 });
  persist();
  emit();
}

export const apkPromptStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): ApkPromptState | null {
    init();
    return state;
  },
  getServerSnapshot(): ApkPromptState | null {
    return null;
  },
  dismiss() {
    update((prev) => ({ ...prev, dismissedAt: Date.now() }));
  },
  markDownloaded() {
    update((prev) => ({ ...prev, downloadedAt: Date.now() }));
  },
  reset() {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    state = null;
    emit();
  },
};

export function readApkPromptOverride():
  | "force"
  | "simulate-android"
  | "hidden"
  | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("apkPrompt");
  if (raw === "1") return "force";
  if (raw === "auto") return "simulate-android";
  if (raw === "0") return "hidden";
  return null;
}

export function apkPromptEnabled(): boolean {
  return process.env.NEXT_PUBLIC_APK_PROMPT_ENABLED !== "false";
}

export function apkPromptRetriggerMs(): number {
  const days = Number(process.env.NEXT_PUBLIC_APK_PROMPT_RETRIGGER_DAYS ?? "14");
  return (Number.isFinite(days) && days >= 0 ? days : 14) * DAY_MS;
}
