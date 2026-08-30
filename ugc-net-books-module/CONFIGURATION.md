# Configuration

## BOOKS_SOURCE_PATH
Local folder scanned recursively. Supports `Subject/Book.pdf` and flat `Book.pdf`.
```
BOOKS_SOURCE_PATH=C:\...\Books
# Paper I/ -> Truemans-...pdf, UGC-NET-Paper-1-Book.pdf -> paper-1
# Flat: COMPUTER SYSTEM ARCHITECTURE ...pdf -> computer-science (fallback)
```
Importer infers `subjectId` from folder name (`paper i` → `paper-1`) then filename, dedup by `slug`.

## DATABASE_URL
`postgresql://...` (Neon/Supabase/Vercel Postgres). For local `file:./db/custom.db` set `provider=sqlite` temporarily.

## STORAGE
- Default `Neon fileData` (Bytes) — `GET /api/books/:id/file` streams from DB, no path leak §26.
- S3 alternative: set `STORAGE_PROVIDER=s3` + `S3_*` — importer will `PutObject` and set `fileUrl` to S3 URL (future).

## Book Metadata §17
`title/subtitle/author/publisher/edition/year/language/description/coverUrl/fileUrl/filePath/fileSize/pageCount/chapterCount/tags/accessLevel` — auto-extracted where possible, editable via Admin → Books.

## Reader Preferences §14
`ReaderPreference` per `userId`: `theme` (light/dark/sepia), `fontSize`, `lineHeight`, `pageMode` (single/double/continuous), `zoomLevel`, `autoSave`.

## Access Control §27
`Book.accessLevel`: `free` (default, all can read), `premium`, `restricted`, `admin_only` — enforced in `/api/books/:id/file` (403 if not authorized).

## File Management §19
Importer: scan → detect subjects/books → validate MIME → generate IDs → dedup via `slug` → thumbnail fallback (gradient with title) §18 → searchable index → DB upsert → `indexedAt`.

## Security §26
MIME validation, path traversal protection (no `..`), `filePath` never returned, `userId` isolation via `getCurrentUserId`, rate limiting via `RATE_LIMIT_PER_MINUTE`.
