"use client";

import * as React from "react";
import { Download, X, Smartphone } from "lucide-react";
import { detectPlatform } from "@/lib/device";
import { useBrowserValue } from "@/hooks/use-client-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const STORE_KEY = "netprep.pwaHint.v1";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

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
 * Mobile-only "Get the App" affordance — the no-Android-Studio install path.
 * Uses the browser PWA install flow (same mechanism as Add to Home Screen):
 * captures `beforeinstallprompt` when the browser offers it, otherwise shows
 * 2-step manual instructions. Never renders on desktop, never renders when
 * already running as an installed app, and persists dismissal. Fully
 * additive: no existing UI is moved or changed.
 */
export function InstallAppHint() {
  const [open, setOpen] = React.useState(false);
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = React.useState(true); // SSR-safe default: hidden

  const platform = useBrowserValue(detectPlatform, "desktop");
  const override = useBrowserValue(readOverride, null);
  const installedDisplay = useBrowserValue(
    () => window.matchMedia("(display-mode: standalone)").matches,
    false
  );
  const storedDone = useBrowserValue(readFlag, true);

  React.useEffect(() => {
    setDismissed(readFlag());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      writeFlag();
      setDismissed(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    writeFlag();
    setDismissed(true);
    setOpen(false);
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        writeFlag();
        setDismissed(true);
      }
      setDeferred(null);
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

  const steps =
    platform === "ios"
      ? [
          "Tap the Share button in Safari.",
          'Choose "Add to Home Screen", then Add.',
        ]
      : [
          "Tap the ⋮ menu in your browser.",
          'Choose "Add to Home screen" (or "Install app").',
        ];

  return (
    <>
      {/* Floating entry point — mobile only, clear of existing chrome. */}
      <button
        type="button"
        onClick={install}
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

      <Dialog open={open} onOpenChange={(next) => !next && setOpen(false)}>
        <DialogContent
          className="overflow-hidden p-0 sm:max-w-md"
          showCloseButton={false}
          aria-describedby="install-hint-desc"
        >
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/15 to-transparent"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close install instructions"
              className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="relative px-6 pb-6 pt-8 text-center sm:px-8">
              <img
                src="/icons/icon-192.png"
                alt="NETPrep Hub app icon"
                width={64}
                height={64}
                className="mx-auto rounded-2xl shadow-md ring-1 ring-black/5"
              />
              <DialogTitle className="mt-3 text-xl font-semibold tracking-tight">
                Get the NETPrep App
              </DialogTitle>
              <DialogDescription
                id="install-hint-desc"
                className="mt-1 text-sm text-muted-foreground"
              >
                Installs in seconds — full notes, PYQs & mocks on your home
                screen, no Play Store needed.
              </DialogDescription>
              <ol className="mx-auto mt-5 max-w-xs space-y-2.5 text-left text-sm">
                {steps.map((s, i) => (
                  <li key={s} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-foreground/90">{s}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 space-y-2.5">
                <Button
                  variant="outline"
                  className="w-full gap-1.5"
                  onClick={dismiss}
                >
                  <Smartphone className="h-4 w-4" aria-hidden="true" />
                  Done — I added it
                </Button>
                <Button variant="ghost" className="w-full" onClick={dismiss}>
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
