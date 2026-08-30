# Troubleshooting

## Books not loading / `Book not found`
- Check `GET /api/books/library` returns `subjects` with `books` where `fileUrl=/api/books/:id/file`. If `fileUrl` null, run `npm run books:import` with `BOOKS_SOURCE_PATH` set and `DATABASE_URL` pointing to Neon.
- Check `GET /api/books` — must `omit: {fileData:true}` else 15s timeout (large PDFs). Fixed in `29b0425`.

## PDF not opening / iframe 404
- `GET /api/books/:id/file` streams `fileData` from Neon. If `No PDF data available`, importer hasn't run or `fileData` is null. Re-run importer. For S3, ensure `STORAGE_PROVIDER` and `fileUrl` is S3 URL.
- Never expose `C:\...` — `filePath` is internal only.

## `Application error: FileText is not defined`
- Missing `FileText` import in `book-library-view.tsx:15` — fixed `4f9885c`. Hard refresh.

## `This action with HTTP GET is not supported by NextAuth.js`
- Caused by `pages: {signIn:'/api/auth/demo'}` pointing to missing route. Removed in `860defb`. Ensure `AUTH_SECRET`/`NEXTAUTH_SECRET`/`NEXTAUTH_URL` set on Vercel.

## `Server error: There is a problem with server configuration`
- Missing `Account`/`Session` tables for PrismaAdapter. Run `npx prisma db push` after adding `Account/Session/VerificationToken` to schema.

## Subjects showing Commerce/Management/English
- Hidden via `HIDDEN_SLUGS` filter in `home-view.tsx:30` and `subjects-view.tsx:32` — `['commerce','management','english']`. Remove filter to show again.

## Paper I shows 4 cards but want 2
- Library now filters `HIDDEN_SLUGS=['trueman-paper-1','kvs-madaan-paper-1']` — hides legacy reference-only cards, shows only 2 new PDFs. To show all, remove filter in `library/route.ts:40`.

## Importer: `Source not found`
- Set `BOOKS_SOURCE_PATH` env to absolute path (Windows `C:\...` or Linux `/home/...`). Supports recursive `Subject/Book.pdf`.

## Vercel deploy fails `cp: illegal option -- r`
- `package.json` build `cp -r .next/static ...` fails on Windows but works on Vercel Linux. For local Windows, use `xcopy` or WSL.

## Auth: `Invalid email or password` even with correct
- `auth-view.tsx` previously used manual `fetch` with empty `csrfToken` — fixed to `signIn('credentials')` in `a0a5b47`. Ensure `User.passwordHash` is bcrypt.

## Performance: Large PDFs slow
- PDFs stored as `Bytes` in Neon — first load streams full buffer. For 30MB+ PDFs, consider S3 + range requests. Enable `Cache-Control: public, max-age=31536000`.
