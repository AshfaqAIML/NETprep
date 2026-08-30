# Integration Contract — Wiring into NETPrep Hub

## 1. Auth Interface §39
Module obtains `currentUser` via:
```ts
import { getServerSession } from 'next-auth'
import { authOptions, getCurrentUserId } from '@/lib/auth'
const session = await getServerSession(authOptions)
const userId = await getCurrentUserId(session) // falls back to 'demo-user' if no session
```
All `books` APIs scope by `userId` (§22). No frontend-only checks.

## 2. Navigation §21
`lib/store.ts` ViewKey:
```ts
| 'book-library' | 'book-reader-pro'
```
`app/page.tsx` ViewRouter:
```tsx
case 'books': return <BookLibraryView />
case 'book-library': return <BookLibraryView />
case 'book-reader-pro': return <BookReaderProView />
```
`components/layout/header.tsx` NAV_ITEMS: `{ key:'book-library', label:'Books', icon:BookMarked, group:'study' }` → `Header` desktop filter includes `book-library`.

Existing routes kept: `/books` now shows subject-first library (spec §2). Alternate `/books/:subjectId/:bookId/read` maps to `book-reader-pro` via `viewParams`.

## 3. API §24
```
GET    /api/books/library      — subjects with books + progress
GET    /api/books              — list (omit fileData)
GET    /api/books/:id          — single book
GET    /api/books/:id/file     — stream PDF (fileData or S3 redirect)
GET    /api/books/progress     — ?bookId
PUT    /api/books/progress     — {bookId, currentPage, totalPages, completionPct}
GET    /api/books/highlights?bookId  POST /api/books/highlights  PATCH/DELETE /api/books/highlights/:id
GET    /api/books/notes        POST /api/books/notes       PATCH/DELETE /api/books/notes/:id
GET    /api/books/bookmarks    POST /api/books/bookmarks   DELETE /api/books/bookmarks/:id
GET    /api/books/history      POST /api/books/history (session tracking)
GET    /api/books/preferences  PUT  /api/books/preferences
```
All follow existing `fetchJson` + `api.*` helpers in `lib/api.ts`.

## 4. DB Migrations §39
`prisma/schema.prisma` adds: `Book` (filePath/fileData/fileFormat/subtitle/edition/pageCount), `BookChapter`, `ReadingProgress` (@unique[userId,bookId]), `Highlight`, `BookNote`, `BookBookmark`, `ReadingHistory`, `ReaderPreference` + NextAuth `Account/Session/VerificationToken`. Run `npx prisma db push`.

## 5. No Breaking Changes
Existing `Book` rows preserved (6 seed + 14 imported). `distribution`/`accessLevel` defaults `free`. Old direct `BooksView` kept but routed via `book-library`.
