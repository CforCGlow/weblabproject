import { NextResponse } from "next/server";
import { getSupabase, toTeam } from "@/lib/supabase";
import { authUser, isManager, isAdmin } from "@/lib/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await getSupabase().from("teams").select("*").order("name").limit(200);
    if (error) throw error;
    return NextResponse.json((data || []).map(toTeam));
  } catch (e) {
    console.error("GET /api/teams failed:", e?.message);
    return NextResponse.json({ error: "Database connection failed: " + (e?.message || "unknown") }, { status: 500 });
  }
}

// One club per manager. Managers only (admins manage fixtures, not clubs).
export async function POST(req) {
  const user = await authUser();
  if (!user) return NextResponse.json({ error: "Please login to register your club." }, { status: 401 });
  if (!isManager(user) && !isAdmin(user)) {
    return NextResponse.json({ error: "Only a registered manager can register a club." }, { status: 403 });
  }
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: "Club name required" }, { status: 400 });
  const sb = getSupabase();
  if (isManager(user)) {
    const { data: mine } = await sb.from("teams").select("id").eq("user_id", user.id).maybeSingle();
    if (mine) return NextResponse.json({ error: "You can only register one club." }, { status: 400 });
  }
  const row = {
    name: String(b.name).trim().slice(0, 60),
    coach: String(b.coach || "").trim().slice(0, 60),
    department: String(b.department ?? b.city ?? "").trim().slice(0, 60),
    user_id: user.id,
  };
  let { data, error } = await sb.from("teams").insert(row).select().single();
  if (error && error.code === "42703") {
    // Pre-v3 database still has `city` instead of `department` — retry legacy.
    const legacy = { name: row.name, coach: row.coach, city: row.department, user_id: row.user_id };
    ({ data, error } = await sb.from("teams").insert(legacy).select().single());
  }
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Club name already taken or you already own a club" }, { status: 400 });
    }
    console.error("POST /api/teams failed:", error.message);
    return NextResponse.json({ error: "Create failed: " + error.message }, { status: 500 });
  }
  return NextResponse.json(toTeam(data), { status: 201 });
}
