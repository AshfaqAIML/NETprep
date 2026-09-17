/**
 * APK release configuration — server side.
 *
 * Release metadata is env-driven so the artifact can later be hosted anywhere
 * (local /public/downloads, CDN, GitHub Releases, cloud storage) without code
 * changes. Secrets never live here and nothing here is exposed to the client —
 * the client consumes this via GET /api/releases/latest.
 */
import type { ApkRelease } from "@/types/apk";

export const apkReleaseConfig = {
  get version() {
    return process.env.APK_VERSION ?? "1.0.0";
  },
  get downloadUrl() {
    return process.env.APK_DOWNLOAD_URL ?? "/downloads/netprep.apk";
  },
  get releaseDate() {
    return process.env.APK_RELEASE_DATE ?? "";
  },
  get sizeLabel() {
    return process.env.APK_SIZE_LABEL ?? "";
  },
  get minAndroidVersion() {
    return process.env.APK_MIN_ANDROID_VERSION ?? "8.0";
  },
  get changelog(): string[] {
    const raw = process.env.APK_CHANGELOG ?? "";
    return raw
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
  },
} as const;

export function getApkRelease(): ApkRelease {
  return {
    version: apkReleaseConfig.version,
    downloadUrl: apkReleaseConfig.downloadUrl,
    releaseDate: apkReleaseConfig.releaseDate,
    sizeLabel: apkReleaseConfig.sizeLabel,
    minAndroidVersion: apkReleaseConfig.minAndroidVersion,
    changelog: apkReleaseConfig.changelog,
  };
}

/**
 * Check whether the APK artifact is actually reachable.
 * - Local path (starts with "/"): check the file exists in public/.
 * - Remote URL: HEAD request with a short timeout.
 * Never throws — unavailability is a normal, handled state.
 */
export async function isApkAvailable(): Promise<{
  available: boolean;
  reason?: string;
}> {
  const url = apkReleaseConfig.downloadUrl;

  try {
    if (url.startsWith("/")) {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "public", url);
      if (!fs.existsSync(filePath)) {
        return {
          available: false,
          reason:
            "Release artifact has not been published yet (Android build pending).",
        };
      }
      return { available: true };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      return { available: false, reason: `Release host responded ${res.status}.` };
    }
    return { available: true };
  } catch {
    return { available: false, reason: "Release host is unreachable." };
  }
}
