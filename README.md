# SEU LigaPro — Football Tournament Management System

Public league portal for fixtures, results, standings, clubs and squads. Built with Next.js + Supabase (PostgreSQL).

## Roles & features
- **Supporter (audience):** browse everything without login — fixtures, results, clubs, table. Optional login to keep an account.
- **Club manager:** registers, then registers exactly **one** club and manages it — edit club details, sign players (each player is issued a login), edit/release players. Can only touch his own club.
- **Player:** logs in with the account his manager created and views his own profile (club, position, jersey, goals).
- **Admin:** full control of fixtures and results (publish, correct scores, delete). The standings regenerate automatically. Promote via SQL (below) — admins cannot self-register.

## Pages
- `/` Home (how to join, upcoming fixtures, latest results, top 5, clubs)
- `/matches` Fixtures & Results (public + admin control panel)
- `/teams` Clubs & Squads (public + manager panel)
- `/leaderboard` Full table: MP W D L GF GA GD Pts
- `/dashboard` Role-based My Account
- `/admin` Admin control (accounts & roles, fixtures, clubs, players)
- `/login`, `/register` (role: supporter or manager)

## Setup
1. Install: `cmd /c "npm install"`
2. Create the tables (pick one):
   - Supabase Dashboard → SQL Editor → paste and run `supabase/schema.sql` (fresh) or `supabase/migration-v2.sql` (existing v1 DB), or
   - `node supabase/apply.mjs` (uses `SUPABASE_DB_URL` from `.env.local`)
3. Configure `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — project URL (Supabase → Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` — service_role key (server-side only, never expose)
   - `JWT_SECRET` — long random string
4. Make the first admin: register normally, then run in SQL Editor:
   `update users set role = 'admin' where email = 'you@example.com';`
   After that, use `/admin` → Accounts to promote/demote anyone (you cannot change or delete your own account).
5. Run: `cmd /c "npm run dev"` → http://localhost:3000
6. Health check: open `/api/debug` — reports Supabase connectivity.

## Rules enforced
- Win = 3 pts, Draw = 1 pt; table sorted by Pts → GD → GF.
- One club per manager (DB unique + API check), globally unique club names.
- Players belong to the manager's own club only; player edits by owner-manager or admin.
- Fixture writes by admin only; roles are re-read from the DB on every request.

## Schema (PostgreSQL)
- users(id uuid, name, email unique, password_hash, role check)
- teams(id uuid, name unique, coach, department, user_id unique → users)
- players(id uuid, name, position check, jersey_no 1-99 unique per squad, goals, batch, student_id unique, team_id → teams cascade, user_id → users)
- matches(id uuid, match_no unique, home_team, away_team, date, venue, home_score/away_score 0-30, status check, user_id → users)

## Security
- Passwords hashed with bcrypt (12 rounds); JWT in httpOnly cookie
- Role checks on every write API; ownership checks for clubs/players
- Supabase accessed server-side with the service_role key; input trim/length limits, escaped search patterns
