import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    let prefs = await db.readerPreference.findUnique({ where: { userId: 'demo-user' } })
    if (!prefs) {
      prefs = await db.readerPreference.create({ data: { userId: 'demo-user' } })
    }
    return NextResponse.json({ preferences: prefs })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { theme, fontSize, lineHeight, pageMode, zoomLevel, autoSave, fontFamily, sidebarOpen } = body

    const prefs = await db.readerPreference.upsert({
      where: { userId: 'demo-user' },
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
        userId: 'demo-user',
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
