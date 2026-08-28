import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/health
 *
 * Provider-neutral health endpoint. Verifies:
 *  - application is reachable
 *  - database connection works (optional, fails gracefully)
 *
 * Returns a clear status object WITHOUT leaking any secrets.
 *
 * Response shape:
 *   {
 *     "status": "ok" | "degraded" | "down",
 *     "timestamp": "ISO-8601",
 *     "service": "netprep-hub",
 *     "version": "1.0.0",
 *     "checks": {
 *       "database": { "status": "ok" | "down", "latencyMs": 12 },
 *       "storage":  { "status": "ok", "provider": "local" },
 *       "email":    { "status": "ok", "provider": "none" },
 *       "ai":       { "status": "ok", "provider": "none" }
 *     }
 *   }
 */
export async function GET() {
  const start = Date.now()
  const checks: Record<string, any> = {}
  let overallStatus: 'ok' | 'degraded' | 'down' = 'ok'

  // --- Database check -------------------------------------------------------
  try {
    const t0 = Date.now()
    // Lightweight query — works on both SQLite and PostgreSQL
    await db.$queryRaw`SELECT 1`
    checks.database = { status: 'ok', latencyMs: Date.now() - t0 }
  } catch (e: any) {
    checks.database = { status: 'down', error: e.message ?? 'unknown' }
    overallStatus = 'degraded'
  }

  // --- Storage check --------------------------------------------------------
  const storageProvider = process.env.STORAGE_PROVIDER ?? 'local'
  checks.storage = {
    status: 'ok',
    provider: storageProvider,
    configured: storageProvider === 'local' || !!process.env.S3_BUCKET,
  }

  // --- Email check ----------------------------------------------------------
  const emailProvider = process.env.EMAIL_PROVIDER ?? 'none'
  checks.email = {
    status: 'ok',
    provider: emailProvider,
    configured: emailProvider === 'none' ? false : true,
  }

  // --- AI check -------------------------------------------------------------
  const aiProvider = process.env.AI_PROVIDER ?? 'none'
  checks.ai = {
    status: 'ok',
    provider: aiProvider,
    configured: aiProvider === 'none' ? false : true,
  }

  // --- Search check ---------------------------------------------------------
  const searchProvider = process.env.SEARCH_PROVIDER ?? 'postgres'
  checks.search = {
    status: 'ok',
    provider: searchProvider,
  }

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    service: 'netprep-hub',
    version: '1.0.0',
    uptime: process.uptime ? Math.round(process.uptime()) : null,
    environment: process.env.NODE_ENV ?? 'development',
    checks,
    // Helpful hints without leaking secrets
    hints: {
      database: 'Configure DATABASE_URL in .env',
      storage: storageProvider === 'local'
        ? 'Using local filesystem storage'
        : 'Using S3-compatible storage — set S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY',
      email: emailProvider === 'none'
        ? 'Email disabled — set EMAIL_PROVIDER=smtp or resend to enable'
        : 'Email configured',
      ai: aiProvider === 'none'
        ? 'AI disabled — set AI_PROVIDER=openai|anthropic|google to enable (optional)'
        : 'AI configured',
    },
  }

  // Return 200 always (degraded status is communicated in the body, not HTTP code)
  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
