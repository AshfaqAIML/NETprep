"use client";

import { BookOpenText, Download, FileQuestion, Sparkles, X, ShieldCheck } from "lucide-react";
import type { ApkReleaseStatus } from "@/types/apk";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const BENEFITS = [
  "Paper I & II book-length notes",
  "Condensed short revision notes",
  "PYQs, mock tests & MCQ practice",
  "Cheat sheets & study planner",
];

/**
 * Elegant first-visit install prompt for Android visitors.
 * Never traps the user: Continue on Web simply closes it, and the
 * X dismisses with persistence handled by the caller.
 */
export function ApkDownloadPrompt({
  open,
  status,
  loading,
  onDismiss,
  onDownload,
  className,
}: {
  open: boolean;
  status: ApkReleaseStatus | null;
  loading?: boolean;
  onDismiss: () => void;
  onDownload: (url: string) => void;
  className?: string;
}) {
  const available = status?.available ?? false;
  const release = status?.release;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent
        className={cn("overflow-hidden p-0 sm:max-w-md", className)}
        showCloseButton={false}
        aria-describedby="apk-prompt-desc"
      >
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/15 to-transparent"
          />

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss and continue on web"
            className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="relative px-6 pb-6 pt-8 text-center sm:px-8">
            {/* App identity */}
            <img
              src="/icons/icon-192.png"
              alt="NETPrep Hub app icon"
              width={72}
              height={72}
              className="mx-auto rounded-2xl shadow-md ring-1 ring-black/5"
            />
            <DialogTitle className="mt-3 text-2xl font-semibold tracking-tight">
              NETPrep Hub
            </DialogTitle>
            <DialogDescription
              id="apk-prompt-desc"
              className="mt-1 text-sm text-muted-foreground"
            >
              Study. Practice. Qualify.
            </DialogDescription>

            {/* Benefits */}
            <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left text-sm">
              {BENEFITS.map((benefit, i) => (
                <li key={benefit} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary">
                    {i === 0 ? (
                      <BookOpenText className="h-3 w-3 text-secondary-foreground" aria-hidden="true" />
                    ) : i === 1 ? (
                      <Sparkles className="h-3 w-3 text-secondary-foreground" aria-hidden="true" />
                    ) : i === 2 ? (
                      <FileQuestion className="h-3 w-3 text-secondary-foreground" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="h-3 w-3 text-secondary-foreground" aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-foreground/90">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Release meta */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              {loading ? (
                <>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </>
              ) : (
                <>
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    v{release?.version ?? "—"}
                  </span>
                  {release?.sizeLabel ? (
                    <span className="rounded-full bg-muted px-2 py-0.5">
                      {release.sizeLabel}
                    </span>
                  ) : null}
                </>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2.5">
              {available && release ? (
                <Button
                  asChild
                  size="lg"
                  className="w-full text-base"
                  onClick={() => onDownload(release.downloadUrl)}
                >
                  <a href={release.downloadUrl} download>
                    <Download className="h-5 w-5" aria-hidden="true" />
                    Download APK
                  </a>
                </Button>
              ) : (
                <Button size="lg" className="w-full text-base" disabled>
                  <Download className="h-5 w-5" aria-hidden="true" />
                  {loading ? "Checking release…" : "APK unavailable"}
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full"
                onClick={onDismiss}
              >
                Continue on web
              </Button>
            </div>

            {!loading && !available && status?.reason ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {status.reason} You can keep using the web app in the meantime.
              </p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
