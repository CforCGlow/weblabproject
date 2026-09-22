import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sb = getSupabase();
    const { error } = await sb.from("users").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true, database: "supabase", connected: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, database: "supabase", connected: false, error: e?.message || "unknown" },
      { status: 500 }
    );
  }
}
