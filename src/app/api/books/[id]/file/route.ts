import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const book = await db.book.findUnique({
      where: { id },
      select: { id: true, title: true, fileData: true, fileUrl: true, fileFormat: true, fileSize: true, accessLevel: true },
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Access control placeholder (§27) — all current books are free
    if (book.accessLevel && book.accessLevel !== 'free' && book.accessLevel !== 'reference-only') {
      // Future: check user role/premium here via getCurrentUserId
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
      // No path traversal — file served from DB, never exposes filePath
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
