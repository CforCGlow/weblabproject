import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase, toPlayer } from "@/lib/supabase";
import { authUser, isManager, isAdmin } from "@/lib/guards";

export const dynamic = "force-dynamic";

const likeSafe = (s) => s.replace(/[%(),]/g, "");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

export async function GET(req) {
  try {
    const sb = getSupabase();
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const position = (searchParams.get("position") || "").trim();
    const mine = searchParams.get("mine") === "1";
    let q = sb.from("players").select("*, teams(name)").order("goals", { ascending: false }).limit(200);
    if (position && ["GK", "DEF", "MID", "FWD"].includes(position)) q = q.eq("position", position);
    if (search) q = q.ilike("name", `%${likeSafe(search)}%`);
    if (mine) {
      const user = await authUser();
      if (!user) return NextResponse.json({ error: "Please login." }, { status: 401 });
      q = q.eq("user_id", user.id);
    }
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json((data || []).map(toPlayer));
  } catch (e) {
    console.error("GET /api/players failed:", e?.message);
    return NextResponse.json({ error: "Database connection failed: " + (e?.message || "unknown") }, { status: 500 });
  }
}

// Manager signs a player for his own club and issues the player login.
// Body: name, email, password, position, jerseyNo, goals?, teamId?
export async function POST(req) {
  const user = await authUser();
  if (!user) return NextResponse.json({ error: "Please login to sign players." }, { status: 401 });
  if (!isManager(user) && !isAdmin(user)) {
    return NextResponse.json({ error: "Only a club manager can sign players." }, { status: 403 });
  }
  try {
    const b = await req.json();
    if (!b.name) return NextResponse.json({ error: "Player name required" }, { status: 400 });
    if (!isValidEmail(b.email)) return NextResponse.json({ error: "Valid player email required" }, { status: 400 });
    if (!b.password || b.password.length < 6) {
      return NextResponse.json({ error: "Player password must be at least 6 chars" }, { status: 400 });
    }
    const sb = getSupabase();

    // Resolve the manager's own club (teamId must belong to him if given).
    let team = null;
    if (b.teamId) {
      const { data: t } = await sb.from("teams").select("*").eq("id", b.teamId).maybeSingle();
      if (!t) return NextResponse.json({ error: "Club not found" }, { status: 404 });
      if (t.user_id !== user.id && !isAdmin(user)) {
        return NextResponse.json({ error: "You can only add players to your own club." }, { status: 403 });
      }
      team = t;
    } else {
      const { data: t } = await sb.from("teams").select("*").eq("user_id", user.id).maybeSingle();
      if (!t) return NextResponse.json({ error: "Register your club first." }, { status: 400 });
      team = t;
    }

    const cleanEmail = b.email.toLowerCase().trim();
    const batch = String(b.batch || "").trim().slice(0, 20);
    const studentId = String(b.studentId || "").trim().slice(0, 30);
    if (!batch) return NextResponse.json({ error: "Batch is required" }, { status: 400 });
    if (!studentId) return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    const { data: taken } = await sb.from("users").select("id").eq("email", cleanEmail).maybeSingle();
    if (taken) return NextResponse.json({ error: "That email is already registered" }, { status: 409 });

    const { data: login, error: loginErr } = await sb.from("users").insert({
      name: String(b.name).trim().slice(0, 60),
      email: cleanEmail,
      password_hash: await bcrypt.hash(b.password, 12),
      role: "player",
    }).select().single();
    if (loginErr) throw loginErr;

    const { data, error } = await sb.from("players").insert({
      name: String(b.name).trim().slice(0, 60),
      position: ["GK", "DEF", "MID", "FWD"].includes(b.position) ? b.position : "MID",
      jersey_no: Math.max(1, Math.min(99, Number(b.jerseyNo) || 10)),
      goals: 0, // goals accrue after signing; edited later, never set at signing
      batch, student_id: studentId,
      team_id: team.id,
      user_id: login.id,
    }).select().single();
    if (error) {
      if (error.code === "23505") {
        await sb.from("users").delete().eq("id", login.id);
        return NextResponse.json({ error: "That student ID is already registered" }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json(toPlayer(data), { status: 201 });
  } catch (e) {
    const m = e?.message || "unknown";
    const hint = m.includes("schema cache")
      ? " (database is behind the code — run supabase/migration-v4.sql in SQL Editor)"
      : "";
    return NextResponse.json({ error: "Add player failed: " + m + hint }, { status: 500 });
  }
}
