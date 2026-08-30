/**
 * Books Importer — auto-uploads PDFs from BOOKS_SOURCE_PATH to Neon (fileData)
 * Scans recursively, infers subjects, creates/updates Book records with fileData
 * and fileUrl = /api/books/:id/file for website fetch.
 *
 * Usage:
 *   BOOKS_SOURCE_PATH="C:\...\Books" bun scripts/books-importer.ts
 *   or bun run books:import
 */
import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const SOURCE = process.env.BOOKS_SOURCE_PATH || 'C:\\Users\\moham\\Downloads\\Kamraan\\WEB DEV\\NETprep\\Books'
const SUPPORTED = ['.pdf', '.epub']

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

function inferSubjectId(fileName: string, subjects: any[]): string | null {
  const lower = fileName.toLowerCase()
  // Try to match subject name in filename
  for (const s of subjects) {
    if (lower.includes(s.name.toLowerCase().split(' ')[0])) return s.id
  }
  // Fallback to Computer Science for these CS books
  const cs = subjects.find((s) => s.slug === 'computer-science')
  return cs?.id ?? subjects[0]?.id ?? null
}

function extractMeta(fileName: string) {
  const base = path.basename(fileName, path.extname(fileName))
  // Clean up filename like "COMPUTER SYSTEM ARCHITECTURE - M MORRIS MANO - 3rd Ed - PDF Room.pdf"
  const title = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)
  const authorMatch = base.match(/-\s*([A-Z][A-Z\s]+)\s*-/)
  const author = authorMatch ? authorMatch[1].trim().slice(0, 80) : 'Unknown Author'
  return { title, author }
}

async function main() {
  console.log(`Scanning ${SOURCE} ...`)
  if (!fs.existsSync(SOURCE)) {
    console.error(`Source not found: ${SOURCE}`)
    process.exit(1)
  }

  const subjects = await db.subject.findMany({ select: { id: true, slug: true, name: true } })
  console.log(`Subjects: ${subjects.map((s) => s.name).join(', ')}`)

  const files: string[] = []
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (SUPPORTED.includes(path.extname(entry.name).toLowerCase())) files.push(full)
    }
  }
  walk(SOURCE)
  console.log(`Found ${files.length} book files`)

  let created = 0
  let updated = 0
  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase()
    const { title, author } = extractMeta(filePath)
    const slug = slugify(title)
    const stat = fs.statSync(filePath)
    const fileData = fs.readFileSync(filePath)
    const fileSize = stat.size
    const subjectId = inferSubjectId(title, subjects)

    // Check existing by slug
    const existing = await db.book.findUnique({ where: { slug } })
    if (existing) {
      await db.book.update({
        where: { id: existing.id },
        data: {
          filePath, // internal, never exposed
          fileData,
          fileSize,
          fileFormat: ext.replace('.', ''),
          fileUrl: `/api/books/${existing.id}/file`,
          pageCount: existing.pageCount ?? null,
          indexedAt: new Date(),
          distribution: 'free',
          accessLevel: 'free',
          subjectId: existing.subjectId ?? subjectId,
        },
      })
      updated++
      console.log(`Updated: ${title} (${(fileSize / 1e6).toFixed(1)} MB)`)
    } else {
      const book = await db.book.create({
        data: {
          slug,
          title,
          author,
          publisher: null,
          year: null,
          subjectId,
          description: `Imported from ${path.basename(filePath)} — available for professional reading with highlights, notes and bookmarks.`,
          coverUrl: null,
          filePath,
          fileData,
          fileSize,
          fileFormat: ext.replace('.', ''),
          fileUrl: '', // placeholder, will update after create
          pageCount: null,
          distribution: 'free',
          accessLevel: 'free',
          rating: 4.5,
          tags: 'imported',
          bookOrder: 0,
        },
      })
      await db.book.update({
        where: { id: book.id },
        data: { fileUrl: `/api/books/${book.id}/file` },
      })
      created++
      console.log(`Created: ${title} (${(fileSize / 1e6).toFixed(1)} MB)`)
    }
  }

  console.log(`Done. Created ${created}, updated ${updated}. Total ${files.length} files indexed.`)
  console.log(`Books now fetchable at /api/books and /api/books/:id/file (served from Neon fileData)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
