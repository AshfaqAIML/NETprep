import { NextResponse } from "next/server";

/**
 * POST /api/downloads/track
 * Privacy-conscious download counter (no PII, no cookies).
 * Counts in-memory and logs, so the UX contract is in place; move to
 * durable storage later without frontend changes.
 */
export const dynamic = "force-dynamic";

const counts = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      version?: string;
      surface?: string;
    };
    const key = `${body.version ?? "unknown"}:${body.surface ?? "unknown"}`;
    const total = (counts.get(key) ?? 0) + 1;
    counts.set(key, total);

    console.info(
      `[apk-download] version=${body.version ?? "?"} surface=${
        body.surface ?? "?"
      } total=${total}`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/downloads/track] failed:", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function GET() {
  const summary: Record<string, number> = {};
  counts.forEach((v, k) => (summary[k] = v));
  return NextResponse.json({ counts: summary });
}
