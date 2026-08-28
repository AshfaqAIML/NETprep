import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStorageProvider } from '@/lib/services/storage'

/**
 * POST /api/admin/books/upload
 * Uploads a PDF file for a book and stores it via the storage adapter.
 *
 * Body: multipart/form-data with:
 *   - file: PDF file
 *   - bookId: ID of the book to attach the file to
 *
 * Returns: { url, key, size, type }
 */
export async function POST(req: NextRequest) {
  try {
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({ error: 'No file provided — expected multipart/form-data' }, { status: 400 })
    }
    const file = formData.get('file') as File
    const bookId = formData.get('bookId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!bookId) {
      return NextResponse.json({ error: 'bookId is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/octet-stream']
    const fileName = file.name.toLowerCase()
    if (!allowedTypes.includes(file.type) && !fileName.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 })
    }

    // Read file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate storage key
    const ext = fileName.split('.').pop() || 'pdf'
    const key = `books/${bookId}/full-text.${ext}`

    // Upload via storage adapter
    const storage = getStorageProvider()
    const stored = await storage.upload({
      name: file.name,
      size: file.size,
      type: file.type || 'application/pdf',
      data: buffer,
    }, key)

    // Update book record with file URL
    await db.book.update({
      where: { id: bookId },
      data: {
        fileUrl: stored.url,
        fileSize: stored.size,
        downloadEnabled: true, // Enable download when file is uploaded
      },
    })

    return NextResponse.json({
      url: stored.url,
      key: stored.key,
      size: stored.size,
      type: stored.type,
      provider: stored.provider,
    })
  } catch (e: any) {
    console.error('[api/admin/books/upload] error', e)
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 })
  }
}
