import { NextResponse } from "next/server";
import { getSupabase, toPlayer } from "@/lib/supabase";
import { getUserFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

const likeSafe = (s) => s.replace(/[%(),]/g, "");

export async function GET(req) {
  try {
    const sb = getSupabase();
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const position = (searchParams.get("position") || "").trim();
    let q = sb.from("players").select("*, teams(name)").order("goals", { ascending: false }).limit(200);
    if (position && ["GK", "DEF", "MID", "FWD"].includes(position)) q = q.eq("position", position);
    if (search) q = q.ilike("name", `%${likeSafe(search)}%`);
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json((data || []).map(toPlayer));
  } catch (e) {
    console.error("GET /api/players failed:", e?.message);
    return NextResponse.json({ error: "Database connection failed: " + (e?.message || "unknown") }, { status: 500 });
  }
}

export async function POST(req) {
  const user = getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Please login to sign players." }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.name || !b.teamId) return NextResponse.json({ error: "name and teamId required" }, { status: 400 });
    const sb = getSupabase();
    const { data: team, error: findErr } = await sb.from("teams").select("*").eq("id", b.teamId).maybeSingle();
    if (findErr) throw findErr;
    if (!team) return NextResponse.json({ error: "Club not found" }, { status: 404 });
    if (team.user_id !== user.id) {
      return NextResponse.json({ error: "You can only add players to your own club." }, { status: 403 });
    }
    const { data, error } = await sb.from("players").insert({
      name: String(b.name).trim().slice(0, 60),
      position: ["GK", "DEF", "MID", "FWD"].includes(b.position) ? b.position : "MID",
      jersey_no: Math.max(1, Math.min(99, Number(b.jerseyNo) || 10)),
      goals: Math.max(0, Number(b.goals) || 0),
      team_id: team.id,
      user_id: user.id,
    }).select().single();
    if (error) throw error;
    return NextResponse.json(toPlayer(data), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Add player failed: " + (e?.message || "unknown") }, { status: 500 });
  }
}
