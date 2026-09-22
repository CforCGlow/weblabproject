# SEU LigaPro — Football Management System

League portal for fixtures, clubs, players and standings. Built with Next.js + MongoDB.

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
2. Configure `.env.local`:
   - `MONGODB_URI` — Atlas connection string
   - `JWT_SECRET` — long random string
3. Run: `cmd /c "npm run dev"` → http://localhost:3000
4. Health check: open `/api/debug` — it reports DNS SRV + Mongo connectivity.

## Database connection troubleshooting (querySrv ECONNREFUSED)
This error means your network/DNS blocked the Atlas SRV lookup, not a code bug.
1. Restart the dev server after every `.env.local` change.
2. In Atlas: confirm the cluster is running (not paused), the hostname matches `.env.local`, DB user password is correct.
3. In Atlas → Network Access → add `0.0.0.0/0`.
4. Change Windows DNS to `8.8.8.8` and `1.1.1.1` (or try a phone hotspot — university WiFi often blocks SRV).
5. Open `http://localhost:3000/api/debug` and follow the hint it returns.

## Schema
- users(name, email unique, passwordHash)
- teams(name, coach, city, userId)
- players(name, position, jerseyNo, goals, teamId, userId)
- matches(homeTeam, awayTeam, date, venue, homeScore, awayScore, status, userId)

## Security
- Passwords hashed with bcrypt (12 rounds)
- JWT in httpOnly cookie; write APIs require login; players require club ownership
- Input trim/length limits, regex-escaped search
