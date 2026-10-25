# GreenBridge Events — NGO event registration, QR ticketing & attendance

A Next.js (App Router) + TypeScript + PostgreSQL + Prisma platform with two integrated sides:

- **Participant portal** — browse events, register, hold a secure QR ticket, track attendance and volunteer hours.
- **NGO admin portal** — create/publish events, manage partners & SDGs, scan tickets at the door, manage attendance, run reports and export CSV.

PostgreSQL is the source of truth. The scanner only sends a ticket token to the server; the server validates it and writes attendance. Nothing on the dashboards is hardcoded.

The NGO brand (name, logo, colours, contact, socials, ticket prefix) lives in the database and is editable at **Admin → Settings**. "GreenBridge Foundation" is only the seed data.

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 14+ (local, Supabase, Neon or Railway)

## Installation

```bash
npm install
npx prisma generate
```

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | ≥32 random characters, signs session cookies (`openssl rand -base64 48`) |
| `NEXTAUTH_URL` | Public base URL (used in password-reset links) |
| `APP_TIMEZONE` | IANA timezone for check-in timestamps (default `Asia/Kolkata`) |

## PostgreSQL setup, migration and seed

```bash
# create an empty database first, e.g.  createdb greenbridge
npm run db:migrate -- --name init   # dev: applies prisma/migrations
npm run db:seed                     # demo NGO, 8 events, ~400 registrations, attendance
```

For production use `npm run db:deploy` (applies existing migrations without prompting).
The seed **wipes and recreates** all data — never run it against a production database.

## Development server

```bash
npm run dev          # http://localhost:3000
npm run build && npm start   # production build
npm run lint         # type-check
npm run test:flow    # end-to-end test of registration, capacity races and every check-in outcome (uses the real DB, cleans up after itself)
```

## Demo accounts (development only — do not use in production)

All accounts share the password **`Demo@12345`**.

| Role | Email |
| --- | --- |
| Participant | `sonal.sharma@example.com` (registered for the Clean-Up Drive) |
| Check-in staff | `staff@greenbridge.example` (scanner + attendance only) |
| Admin | `admin@greenbridge.example` |
| Super admin | `superadmin@greenbridge.example` (also manages team roles) |

## Participant workflow

1. Open **Events** → an event → **Register for Event** (log in or sign up; you are returned to the form).
2. Submit the registration form. The server validates it, locks the event row, checks capacity/deadline/duplicates, and creates the registration with a unique ticket token and ID such as `GBF-2026-00482`.
3. **You're registered!** → **View My Ticket**. Tickets live under **My Portal → My Tickets**; the ticket screen (`/portal/tickets/[id]`) is built for event day with a large QR and a **Download Ticket** button.
4. Participants can cancel (before check-in), which frees the seat.

## Admin workflow

1. **Events → New event** → *Save Draft* or *Publish Event* (publishing opens registration). Edits are live on the public page immediately.
2. **Events** table: view, edit, duplicate, close/reopen registration, mark completed, cancel, delete (only with zero registrations) — each destructive action asks for confirmation.
3. **Participants**: search, filter by event/attendance, sort, paginate, export CSV.
4. **Attendance** (`/admin/events/[id]/attendance`): registered / attended / %, who checked in and who scanned them; manual check-in with confirmation. The page refreshes itself every 15 s (polling PostgreSQL, not simulated).
5. **Partners**, **Reports** (filters + CSV), **Settings** (branding). Roles: participants can never reach `/admin`; check-in staff only see the scanner and attendance.

## QR scanning workflow

1. Log in as staff/admin → **QR Scanner**, choose the **check-in event**, press **Start Scanner** (allow the camera; HTTPS is required on phones, `localhost` works on the laptop).
2. The camera reads the QR (it contains only a random token like `GBF-TKT-9c72…`, never personal data) and POSTs `{eventId, code, method}` to `/api/checkin`.
3. The server authenticates the user, checks the `checkin` permission, rate-limits, then looks up the token and returns one of:
   - `SUCCESS` → **CHECK-IN SUCCESSFUL** (inserted into `Attendance` with `checkedInBy`; the scanner re-arms itself)
   - `ALREADY_CHECKED_IN` — no second record is created
   - `INVALID` — unknown token
   - `WRONG_EVENT` — ticket belongs to another event; nothing is recorded
   - cancelled ticket / event not active
4. **Camera unavailable?** Use *Enter Ticket ID manually* (registration number). It goes through the exact same `performCheckIn()` validation.

Concurrency is enforced by PostgreSQL: `Attendance.registrationId` is `UNIQUE`, so two scanners racing on one ticket can produce only one record. Registration locks the event row (`SELECT … FOR UPDATE`) so two people can't take the last seat.

## Security notes

- Passwords: bcrypt (cost 12). Sessions: signed, httpOnly, SameSite=Lax JWT cookie; the **role is re-read from the database on every request**.
- Every admin page, server action and route handler calls `authorize(permission)`; `middleware.ts` is only a first filter.
- Zod validation on all input; Prisma parameterised queries; CSV export escapes formula injection.
- DB-backed rate limiting on login, sign-up, password reset and check-in.
- Password reset emails: no mail provider is bundled — the reset link is printed to the server console (`[password-reset] …`). Wire a provider into `forgotPasswordAction` in `app/actions/auth.ts` before going live.
- Images are referenced by URL (no upload storage is bundled). Seed covers are illustrations in `public/covers/`; swap in real photos through the event form and Settings.

## Production deployment

1. Create a Postgres database (Neon / Supabase / Railway) and set `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `APP_TIMEZONE` in Vercel.
2. Build command is `npm run build` (runs `prisma generate`). Apply the schema with `npm run db:deploy` against the production database (e.g. from CI).
3. Do not run the seed in production; create the first super admin by registering, then setting `role = 'SUPER_ADMIN'` on that row (`UPDATE "User" SET role='SUPER_ADMIN' WHERE email='…'`). After that, roles are managed in **Settings → Team roles**.
4. Serve over HTTPS (required for camera access on phones).

## Project structure

```
app/(site)/     public pages, auth, participant portal (with header + mobile bottom nav)
app/(focus)/    minimal-chrome ticket screen for event day
app/admin/      admin portal
app/api/        check-in and CSV export endpoints
app/actions/    server actions (auth, participant, admin)
components/     ui, events, tickets, scanner, dashboard, admin, auth, site
lib/            auth, db, qr, validation, permissions, services (business logic), datetime, csv
prisma/         schema.prisma, migrations, seed.ts
scripts/        e2e-flow.ts (flow test), make-covers.mjs (seed artwork)
```

## Design & credits

- **Look and feel:** warm paper background, a serif display face (Fraunces) for headlines with Figtree for body text, restrained green brand colour (editable in Admin → Settings), real photography, scroll-reveal and count-up motion that respects `prefers-reduced-motion`.
- **Photography:** the files in `public/photos/` are free-to-use images from [Unsplash](https://unsplash.com/license), included as demo content. Replace them from the admin event form or Settings with your own organisation's photos. Events without a photo get a generated contour-line pattern instead of a placeholder icon.
- **Two sign-in pages:** participants use `/login`; NGO staff use `/admin/login`. Each refuses the other's accounts.
- **Exports:** Participants, event Attendance and Reports pages export to **Excel (.xlsx)** or CSV.
- **Add to calendar:** every public event offers an `.ics` download at `/events/<slug>/calendar`.
