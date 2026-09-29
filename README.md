# Community Bridge Event Management

Production-focused NGO event registration and attendance management built with Next.js App Router, PostgreSQL, Prisma, and inline React styling.

## Run locally

1. Copy `.env.example` to `.env` and set a PostgreSQL `DATABASE_URL` plus a strong `SESSION_SECRET`.
2. Run `npm install`, then `npm run prisma:generate` and `npm run prisma:migrate -- --name init`.
3. Optionally run `npm run prisma:seed` for local test users and an example event. The seed password is deliberately documented only for local development: `ChangeThisPassword123!`.
4. Run `npm run dev`.

## Security notes

Staff credentials are bcrypt-hashed. The signed, HTTP-only staff session expires after eight hours. QR codes contain only an opaque random token. The check-in endpoint verifies role, event assignment, event ownership, active registration status, and the one-to-one attendance constraint. Deploy behind HTTPS and configure database backups, a production session secret, and application-level rate limiting at the reverse proxy/platform.
