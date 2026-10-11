# NoteNest (JSON file database edition)

**React (JavaScript) + Vite + MUI** frontend, **ASP.NET Core 10 (.NET 10) Web API** backend, and **one JSON file (`json.db`) as the database**.
No SQL Server, no Docker, no Entity Framework, no NuGet packages.

> **Honest status:** the C# was written without a .NET SDK, so it has **not been compiled or run**. The React files were
> syntax-checked only; their tests have not been run. Expect a few small fixes on first build, and paste any error to me.

```
NoteNest/
  backend/NoteNest.Api/     Web API  (Models, Data/JsonDb.cs, Services, Controllers)
  backend/NoteNest.Tests/   xUnit tests
  frontend/                 Vite + React app
```

## Run it (macOS)
You need Node 18+ and the .NET 10 SDK. Nothing else.

**Terminal 1 – backend**
```bash
cd NoteNest/backend/NoteNest.Api
dotnet run --launch-profile http        # http://localhost:5080
```
**Terminal 2 – frontend**
```bash
cd NoteNest/frontend
npm install
npm run dev                             # http://localhost:5173
```
Open http://localhost:5173, create an account, and write a note. Register a second account in a private window to try sharing.

## Where is my data?
- `backend/NoteNest.Api/storage/json.db` – users, notes, tags, categories, shares and attachment metadata, as readable JSON.
  `json.db.bak` is the previous version, kept automatically.
- `backend/NoteNest.Api/media-files/` – the uploaded image and video files (not inside the JSON; that would make it huge).
- **Back up both together.** To reset everything, stop the API and delete the `storage` and `media-files` folders.
- Change locations in `appsettings.json` (`JsonDb:Path`, `MediaStorage:RootPath`).

## How the JSON database works (`Data/JsonDb.cs`)
The whole database is loaded into memory when the API starts. `Read(...)` queries it; `Write(...)` changes it and then saves the file.
A single lock keeps requests from colliding, and saving goes to a temp file first and is then swapped in, so a crash cannot leave a half-written file.
If a change throws an error, memory is reloaded from disk, so a failed request cannot leave partial data.
Search, filters, sorting and paging run in C# (LINQ) inside the lock.

**Limits (be aware):** the file is rewritten on every change, and only one API instance may use it. That is fine for learning and
personal use (thousands of notes), but not for many users or several servers. For that, switch to SQLite or SQL Server.

## Security (unchanged design)
- Passwords: PBKDF2-SHA256, random salt, 210,000 iterations (`Services/PasswordHasher.cs`). Plain passwords are never stored. Five wrong logins lock the account for 5 minutes.
- Login: signed HttpOnly, SameSite=Lax cookie, 8 hours sliding. Nothing in localStorage. Expired session -> 401 -> the React app logs out.
- Every note/attachment/share endpoint asks `NoteAccess.GetRole(...)` (Owner / Editor / Viewer / None). Missing and not-yours both return 404.
- Uploads: extension + declared type + size + real file header bytes are checked; file names are generated; paths cannot escape the media folder; media is streamed only after a permission check.
- `storage/json.db` contains password hashes, so never commit or share it (`storage/` is in `.gitignore`).

## Tests
```bash
cd NoteNest/backend && dotnet new sln -n NoteNest && dotnet sln add NoteNest.Api NoteNest.Tests && dotnet test
cd NoteNest/frontend && npm test
```
Backend tests: JSON persistence/rollback, password hashing + rules, permissions (owner/editor/viewer/stranger), upload validation.
Frontend tests (Vitest + React Testing Library): file and form validation, route protection, login form, note card.

## API (same as before, so the frontend is unchanged)
Auth: `POST /api/auth/register|login|logout`, `GET /api/auth/me`
Notes: `GET/POST /api/notes`, `GET/PUT/DELETE /api/notes/{id}`, `PATCH /api/notes/{id}/pin`, `GET /api/notes/shared-with-me`, `POST /api/notes/{id}/tags`, `DELETE /api/notes/{id}/tags/{tagId}`
Attachments: `POST /api/notes/{id}/attachments` (multipart field `files`), `GET|DELETE /api/notes/{id}/attachments/{attachmentId}`
Categories/tags: `GET/POST /api/categories`, `PUT/DELETE /api/categories/{id}`, `GET /api/tags`
Sharing: `GET/POST /api/notes/{id}/shares`, `DELETE /api/notes/{id}/shares/{shareId}`

## Known limitations
No attachment reordering in the UI yet; plain-text editor only; no email confirmation or password reset; sharing by email reveals whether an email is registered.

## Production notes
Use HTTPS (production config already sets Secure cookies, HSTS, redirection), set `Cors__AllowedOrigins__0` and the two storage paths through environment variables, serve `frontend/dist` from the same origin as `/api`, and back up `data/` and `media-files/` together.
