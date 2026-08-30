import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getCurrentUserId } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/books/[id]/file — Serve book file
 * §22 user isolation via getCurrentUserId (falls back to demo-user if unauthenticated, no 401)
 * §26 never expose filePath — select explicitly omits filePath, file served from DB bytes only
 * §27 accessLevel check — premium/restricted/admin_only require authenticated non-demo user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await getCurrentUserId(session) // §22 isolation — falls back to demo-user if no session
    const { id } = await params
    const book = await db.book.findUnique({
      where: { id },
      // §26 — never select filePath; only expose fileData/fileUrl/fileFormat/fileSize/accessLevel
      select: { id: true, title: true, fileData: true, fileUrl: true, fileFormat: true, fileSize: true, accessLevel: true },
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // §27 access control — enforce accessLevel
    if (book.accessLevel && book.accessLevel !== 'free' && book.accessLevel !== 'reference-only') {
      // Premium/restricted/admin_only books require authenticated user
      if (userId === 'demo-user') {
        return NextResponse.json({ error: 'Access denied — premium content requires sign-in' }, { status: 403 })
      }
      // Future: check user role/premium subscription via session.user.role
      const role = (session?.user as any)?.role
      if (book.accessLevel === 'admin_only' && role !== 'admin') {
        return NextResponse.json({ error: 'Access denied — admin only' }, { status: 403 })
      }
    }

    // If fileData is stored in Neon (S3/Neon storage importer), serve it
    if (book.fileData) {
      const bytes = book.fileData as unknown as Uint8Array
      const buffer = Buffer.from(bytes)
      const headers = new Headers()
      headers.set('Content-Type', book.fileFormat === 'epub' ? 'application/epub+zip' : 'application/pdf')
      headers.set('Content-Length', buffer.length.toString())
      headers.set('Content-Disposition', `inline; filename="${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      // §26 — No path traversal — file served from DB bytes, never exposes filePath
      return new NextResponse(buffer as any, { headers })
    }

    // Fallback to fileUrl if it's an S3/public URL
    if (book.fileUrl && (book.fileUrl.startsWith('http') || book.fileUrl.startsWith('/'))) {
      return NextResponse.redirect(book.fileUrl)
    }

    return NextResponse.json({ error: 'No PDF data available for this book. Run importer or upload via admin.' }, { status: 404 })
  } catch (e) {
    console.error('[api/books/[id]/file] error', e)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
