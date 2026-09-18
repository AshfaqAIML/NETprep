"use client";

import * as React from "react";
import { Download } from "lucide-react";
import type { ApkReleaseStatus } from "@/types/apk";
import { apkPromptStore } from "@/lib/apk-prompt-store";
import { Button } from "@/components/ui/button";
import { InstallDialog } from "@/components/apk/install-dialog";

type ButtonProps = React.ComponentProps<typeof Button>;

/**
 * Self-contained "Get the App" button — drop it anywhere.
 * When a published APK artifact exists, it downloads it directly (and records
 * the download so auto-prompts stay silent). Otherwise it opens the PWA
 * install sheet (one-tap install when the browser offers it, manual
 * Add-to-Home-Screen steps if not).
 */
export function GetAppButton({
  variant = "outline",
  size,
  className,
}: Pick<ButtonProps, "variant" | "size" | "className">) {
  const [status, setStatus] = React.useState<ApkReleaseStatus | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/releases/latest", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: ApkReleaseStatus) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const track = (url: string, version?: string) => {
    apkPromptStore.markDownloaded();
    try {
      void fetch("/api/downloads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, surface: "get-app-button" }),
        keepalive: true,
      });
    } catch {
      // analytics must never block the download
    }
  };

  const available = status?.available ?? false;
  const release = status?.release;

  if (available && release) {
    const label = release.sizeLabel
      ? `Download App · ${release.sizeLabel}`
      : `Download App · v${release.version}`;
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <a href={release.downloadUrl} download onClick={() => track(release.downloadUrl, release.version)}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {label}
        </a>
      </Button>
    );
  }

  const dismissHint = () => {
    try {
      window.localStorage.setItem("netprep.pwaHint.v1", "done");
    } catch {
      // ignore
    }
    setSheetOpen(false);
  };

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setSheetOpen(true)}>
        <Download className="h-4 w-4" aria-hidden="true" />
        Get the App
      </Button>
      <InstallDialog open={sheetOpen} onOpenChange={setSheetOpen} onDone={dismissHint} />
    </>
  );
}
