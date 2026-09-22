import { NextResponse } from "next/server";
import { getSupabase, toTeam } from "@/lib/supabase";
import { getUserFromCookies } from "@/lib/auth";

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

export async function POST(req) {
  const user = getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Please login to register your club." }, { status: 401 });
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: "Club name required" }, { status: 400 });
  const { data, error } = await getSupabase().from("teams").insert({
    name: String(b.name).trim().slice(0, 60),
    coach: String(b.coach || "").trim().slice(0, 60),
    city: String(b.city || "").trim().slice(0, 60),
    user_id: user.id,
  }).select().single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Club already registered or create failed" }, { status: 400 });
    }
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
  return NextResponse.json(toTeam(data), { status: 201 });
}
