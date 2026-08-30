import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getCurrentUserId } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/books/preferences — Get reader preferences for current user
 * PUT /api/books/preferences — Update reader preferences
 * §22 user isolation — per-user preferences via getCurrentUserId (falls back to demo-user if unauthenticated, no 401)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    let prefs = await db.readerPreference.findUnique({ where: { userId } })
    if (!prefs) {
      prefs = await db.readerPreference.create({ data: { userId } })
    }
    return NextResponse.json({ preferences: prefs })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const body = await req.json()
    const { theme, fontSize, lineHeight, pageMode, zoomLevel, autoSave, fontFamily, sidebarOpen } = body

    const prefs = await db.readerPreference.upsert({
      where: { userId },
      update: {
        ...(theme ? { theme } : {}),
        ...(fontSize ? { fontSize } : {}),
        ...(lineHeight ? { lineHeight } : {}),
        ...(pageMode ? { pageMode } : {}),
        ...(zoomLevel ? { zoomLevel } : {}),
        ...(typeof autoSave === 'boolean' ? { autoSave } : {}),
        ...(fontFamily ? { fontFamily } : {}),
        ...(typeof sidebarOpen === 'boolean' ? { sidebarOpen } : {}),
      },
      create: {
        userId,
        theme: theme ?? 'light',
        fontSize: fontSize ?? 16,
        lineHeight: lineHeight ?? 1.6,
        pageMode: pageMode ?? 'single',
        zoomLevel: zoomLevel ?? 100,
        autoSave: autoSave ?? true,
        fontFamily: fontFamily ?? 'sans',
        sidebarOpen: sidebarOpen ?? true,
      },
    })
    return NextResponse.json({ preferences: prefs })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
