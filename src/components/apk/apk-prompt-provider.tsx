"use client";

import { useEffect, useState } from "react";
import type { ApkReleaseStatus } from "@/types/apk";
import { useApkPrompt } from "@/hooks/use-apk-prompt";
import { ApkDownloadPrompt } from "@/components/apk/apk-download-prompt";

/**
 * Mounts once in the root layout. Runs first-visit detection and shows the
 * APK install prompt to eligible Android visitors. Also owns release-status
 * fetching so the modal can degrade gracefully when the artifact is absent.
 *
 * status: undefined = not fetched yet (loading), null = fetch failed.
 *
 * NETPrep adaptation: while no APK artifact is published yet, the prompt stays
 * completely silent (no "unavailable" modal) — except the `apkPrompt=1` QA
 * override, which force-shows it for preview. The moment an artifact becomes
 * reachable at the configured URL, eligible visitors start seeing the prompt
 * with zero code changes.
 */
export function ApkPromptProvider() {
  const { show, override, dismiss, markDownloaded } = useApkPrompt();
  const [status, setStatus] = useState<ApkReleaseStatus | undefined | null>(
    undefined
  );

  const needsFetch = show && status === undefined;

  useEffect(() => {
    if (!needsFetch) return;
    let cancelled = false;

    fetch("/api/releases/latest", { cache: "no-store" })
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error(String(res.status)))
      )
      .then((data: ApkReleaseStatus) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, [needsFetch]);

  const handleDownload = (url: string) => {
    markDownloaded();
    try {
      void fetch("/api/downloads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: status?.release.version,
          surface: "first-visit-prompt",
        }),
        keepalive: true,
      });
    } catch {
      // analytics must never block the download
    }
  };

  const loading = show && status === undefined;
  const available = status?.available ?? false;
  // Silent until an artifact exists (QA override still force-previews).
  const open = show && (override === "force" || loading || available);

  return (
    <ApkDownloadPrompt
      open={open}
      status={status ?? null}
      loading={loading}
      onDismiss={dismiss}
      onDownload={handleDownload}
    />
  );
}
