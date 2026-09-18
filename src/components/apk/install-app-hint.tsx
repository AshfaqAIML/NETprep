"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { detectPlatform } from "@/lib/device";
import { useBrowserValue } from "@/hooks/use-client-store";
import { cn } from "@/lib/utils";
import {
  InstallDialog,
  useDeferredInstallPrompt,
} from "@/components/apk/install-dialog";

const STORE_KEY = "netprep.pwaHint.v1";

function readFlag(): boolean {
  try {
    return window.localStorage.getItem(STORE_KEY) === "done";
  } catch {
    return false;
  }
}

function writeFlag() {
  try {
    window.localStorage.setItem(STORE_KEY, "done");
  } catch {
    // ignore
  }
}

function readOverride(): "force" | "hidden" | null {
  const raw = new URLSearchParams(window.location.search).get("installApp");
  if (raw === "1") return "force";
  if (raw === "0") return "hidden";
  return null;
}

/**
 * Mobile-only "Get the App" floating entry point — the no-Android-Studio
 * install path. One tap installs when the browser offers it, otherwise opens
 * the manual-steps sheet. Never renders on desktop, never renders when
 * already running as an installed app, and persists dismissal. Fully
 * additive: no existing UI is moved or changed.
 */
export function InstallAppHint() {
  const [open, setOpen] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(true); // SSR-safe default: hidden

  const platform = useBrowserValue(detectPlatform, "desktop");
  const override = useBrowserValue(readOverride, null);
  const installedDisplay = useBrowserValue(
    () => window.matchMedia("(display-mode: standalone)").matches,
    false
  );
  const storedDone = useBrowserValue(readFlag, true);
  const { install } = useDeferredInstallPrompt();

  React.useEffect(() => {
    setDismissed(readFlag());
    const onInstalled = () => {
      writeFlag();
      setDismissed(true);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  const dismiss = () => {
    writeFlag();
    setDismissed(true);
    setOpen(false);
  };

  const tap = async () => {
    const outcome = await install();
    if (outcome === "accepted") {
      dismiss();
      return;
    }
    if (outcome === "dismissed") {
      setOpen(false);
      return;
    }
    // No programmatic prompt available — show manual steps.
    setOpen(true);
  };

  if (override === "hidden") return null;
  if (installedDisplay) return null; // already running as the installed app
  const mobile = platform === "android" || platform === "ios";
  if (override !== "force" && (!mobile || dismissed || storedDone)) return null;

  return (
    <>
      {/* Floating entry point — mobile only, clear of existing chrome. */}
      <button
        type="button"
        onClick={tap}
        aria-label="Get the NETPrep app"
        className={cn(
          "fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full",
          "bg-emerald-600 text-white shadow-lg ring-1 ring-black/10",
          "transition-transform hover:scale-105 active:scale-95 md:hidden"
        )}
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Download className="h-5 w-5" aria-hidden="true" />
      </button>

      <InstallDialog open={open} onOpenChange={setOpen} onDone={dismiss} />
    </>
  );
}
