/**
 * Android APK release types.
 * Additive only — mirrors the release-distribution contract used for
 * installable app surfaces (release metadata + availability flag).
 */

export interface ApkRelease {
  version: string;
  downloadUrl: string;
  releaseDate: string;
  sizeLabel: string;
  minAndroidVersion?: string;
  changelog?: string[];
}

export interface ApkReleaseStatus {
  release: ApkRelease;
  /** Whether the artifact is actually reachable right now. */
  available: boolean;
  reason?: string;
}
