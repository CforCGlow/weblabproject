import { NextResponse } from "next/server";
import { getSupabase, toMatch } from "@/lib/supabase";
import { authUser, isAdmin } from "@/lib/guards";

export const dynamic = "force-dynamic";

const likeSafe = (s) => s.replace(/[%(),]/g, "");

export async function GET(req) {
  try {
    const sb = getSupabase();
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    let q = sb.from("matches").select("*").order("date", { ascending: true }).limit(200);
    if (status && ["scheduled", "live", "finished"].includes(status)) q = q.eq("status", status);
    if (search) {
      const esc = likeSafe(search);
      q = q.or(`home_team.ilike.%${esc}%,away_team.ilike.%${esc}%,venue.ilike.%${esc}%`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json((data || []).map(toMatch));
  } catch (e) {
    console.error("GET /api/matches failed:", e?.message);
    return NextResponse.json({ error: "Database connection failed: " + (e?.message || "unknown") }, { status: 500 });
  }
}

// Fixtures + results are managed by the tournament admin only.
export async function POST(req) {
  const user = await authUser();
  if (!user) return NextResponse.json({ error: "Please login." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Only the tournament admin can publish fixtures." }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.homeTeam || !b.awayTeam || !b.date || !b.venue) {
      return NextResponse.json({ error: "homeTeam, awayTeam, date, venue required" }, { status: 400 });
    }
    if (b.homeTeam.trim().toLowerCase() === b.awayTeam.trim().toLowerCase()) {
      return NextResponse.json({ error: "Home and away clubs must differ" }, { status: 400 });
    }
    let matchNo = null;
    if (b.matchNo !== undefined && b.matchNo !== null && String(b.matchNo).trim() !== "") {
      matchNo = Number(b.matchNo);
      if (!Number.isInteger(matchNo) || matchNo < 1) {
        return NextResponse.json({ error: "Match number must be a positive whole number" }, { status: 400 });
      }
    }
    const { data, error } = await getSupabase().from("matches").insert({
      match_no: matchNo,
      home_team: String(b.homeTeam).trim().slice(0, 60),
      away_team: String(b.awayTeam).trim().slice(0, 60),
      date: new Date(b.date).toISOString(),
      venue: String(b.venue).trim().slice(0, 100),
      home_score: Math.max(0, Math.min(30, Number(b.homeScore) || 0)),
      away_score: Math.max(0, Math.min(30, Number(b.awayScore) || 0)),
      status: ["scheduled", "live", "finished"].includes(b.status) ? b.status : "scheduled",
      user_id: user.id,
    }).select().single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "That match number is already used" }, { status: 400 });
      }
      throw error;
    }
    return NextResponse.json(toMatch(data), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
