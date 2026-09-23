import { NextResponse } from "next/server";
import { getSupabase, toMatch } from "@/lib/supabase";
import { computeTable } from "@/lib/standings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await getSupabase().from("matches").select("*").eq("status", "finished");
    if (error) throw error;
    return NextResponse.json(computeTable((data || []).map(toMatch)));
  } catch (e) {
    console.error("GET /api/leaderboard failed:", e?.message);
    return NextResponse.json({ error: "Database connection failed: " + (e?.message || "unknown") }, { status: 500 });
  }
}
