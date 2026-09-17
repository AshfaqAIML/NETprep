"use client";

import { useMemo, useSyncExternalStore } from "react";
import { detectPlatform, type Platform } from "@/lib/device";
import { useBrowserValue } from "@/hooks/use-client-store";
import {
  apkPromptEnabled,
  apkPromptRetriggerMs,
  apkPromptStore,
  readApkPromptOverride,
  type ApkPromptState,
} from "@/lib/apk-prompt-store";

/**
 * React binding for the first-visit APK prompt.
 * `show` becomes true only after hydration, so SSR output is always stable.
 */
export function useApkPrompt() {
  const state: ApkPromptState | null = useSyncExternalStore(
    apkPromptStore.subscribe,
    apkPromptStore.getSnapshot,
    apkPromptStore.getServerSnapshot
  );

  const platform: Platform = useBrowserValue(detectPlatform, "desktop");
  const override = useBrowserValue(readApkPromptOverride, null);

  const show = useMemo(() => {
    if (!state) return false; // server render / pre-hydration
    if (override === "hidden") return false;
    if (override === "force") return true;

    const isAndroidVisitor =
      override === "simulate-android" || platform === "android";
    if (!isAndroidVisitor || !apkPromptEnabled()) return false;

    if (state.downloadedAt) return false;
    if (state.dismissedAt && Date.now() - state.dismissedAt < apkPromptRetriggerMs())
      return false;
    return true;
  }, [state, override, platform]);

  return {
    show,
    platform,
    override,
    state,
    dismiss: apkPromptStore.dismiss,
    markDownloaded: apkPromptStore.markDownloaded,
    resetForQa: apkPromptStore.reset,
  };
}
