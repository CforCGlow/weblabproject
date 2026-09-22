import { createClient } from "@supabase/supabase-js";

let client = null;

export function getSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local and restart the server.");
  }
  client = createClient(url, serviceKey, { auth: { persistSession: false } });
  return client;
}

// Map snake_case rows back to the shapes the frontend already expects
// (_id, userId, teamId) so no page code has to change.
export const toMatch = (m) => m && {
  _id: m.id, homeTeam: m.home_team, awayTeam: m.away_team,
  date: m.date, venue: m.venue, homeScore: m.home_score,
  awayScore: m.away_score, status: m.status, userId: m.user_id,
  createdAt: m.created_at, updatedAt: m.updated_at,
};

export const toTeam = (t) => t && {
  _id: t.id, name: t.name, coach: t.coach, department: t.department ?? t.city ?? "",
  userId: t.user_id, createdAt: t.created_at, updatedAt: t.updated_at,
};

export const toPlayer = (p) => p && {
  _id: p.id, name: p.name, position: p.position, jerseyNo: p.jersey_no,
  goals: p.goals, batch: p.batch || "", studentId: p.student_id || "", userId: p.user_id,
  teamId: p.teams ? { name: p.teams.name } : p.team_id,
  createdAt: p.created_at, updatedAt: p.updated_at,
};

export const toUser = (u) => u && {
  _id: u.id, id: u.id, name: u.name, email: u.email, role: u.role,
  passwordHash: u.password_hash,
};
