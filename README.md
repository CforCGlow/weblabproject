# SEU LigaPro — Football Management System

League portal for fixtures, clubs, players and standings. Built with Next.js + Supabase (PostgreSQL).

## Features
- Auth: register, login, logout (bcrypt hashing + JWT httpOnly cookie)
- Fixtures: publish, search/filter by club/venue + status, edit/delete own fixtures
- Clubs: any visitor can browse; only logged-in managers can register a club
- Players: only logged-in managers can sign players, and only for their own club
- Standings: auto-calculated from completed fixtures (Win=3, Draw=1)

## Pages
- `/` Home, `/login`, `/register`, `/matches`, `/teams`, `/leaderboard`

## Setup
1. Install: `cmd /c "npm install"`
2. Create the tables (pick one):
   - Supabase Dashboard → SQL Editor → paste and run `supabase/schema.sql`, or
   - `node supabase/apply.mjs` (uses `SUPABASE_DB_URL` from `.env.local`)
3. Configure `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — project URL (Supabase → Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` — service_role key (server-side only, never expose)
   - `JWT_SECRET` — long random string
4. Run: `cmd /c "npm run dev"` → http://localhost:3000
5. Health check: open `/api/debug` — reports Supabase connectivity.

## Schema (PostgreSQL)
- users(id uuid, name, email unique, password_hash, role)
- teams(id uuid, name, coach, city, user_id → users, unique(name, user_id))
- players(id uuid, name, position check, jersey_no 1-99, goals, team_id → teams cascade, user_id → users)
- matches(id uuid, home_team, away_team, date, venue, home_score/away_score 0-30, status check, user_id → users)

## Security
- Passwords hashed with bcrypt (12 rounds)
- JWT in httpOnly cookie; write APIs require login; players require club ownership
- Supabase accessed server-side with the service_role key; input trim/length limits, escaped search patterns
