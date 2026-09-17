import { NextResponse } from "next/server";
import { getApkRelease, isApkAvailable } from "@/config/apk-release";

/**
 * GET /api/releases/latest
 * Public release metadata for the Android APK. The client never reads APK
 * env vars directly — this endpoint is the single source of truth, so the
 * artifact can be moved to a CDN later without frontend changes.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const release = getApkRelease();
    const { available, reason } = await isApkAvailable();
    return NextResponse.json(
      { release, available, reason },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[api/releases/latest] failed:", error);
    return NextResponse.json(
      { error: "Release information is temporarily unavailable." },
      { status: 500 }
    );
  }
}
