import { NextResponse } from "next/server";
import { getSupabase, toMatch } from "@/lib/supabase";
import { authUser, isAdmin } from "@/lib/guards";

export async function PUT(req, { params }) {
  const user = await authUser();
  if (!user) return NextResponse.json({ error: "Please login." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Only the tournament admin can edit fixtures." }, { status: 403 });
  const sb = getSupabase();
  const { data: row } = await sb.from("matches").select("id").eq("id", params.id).maybeSingle();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = await req.json();
  const patch = {};
  if (b.matchNo !== undefined) {
    if (b.matchNo === null || String(b.matchNo).trim() === "") patch.match_no = null;
    else {
      const n = Number(b.matchNo);
      if (!Number.isInteger(n) || n < 1) return NextResponse.json({ error: "Match number must be a positive whole number" }, { status: 400 });
      patch.match_no = n;
    }
  }
  if (b.homeTeam !== undefined) patch.home_team = String(b.homeTeam).trim().slice(0, 60);
  if (b.awayTeam !== undefined) patch.away_team = String(b.awayTeam).trim().slice(0, 60);
  if (b.date) patch.date = new Date(b.date).toISOString();
  if (b.venue !== undefined) patch.venue = String(b.venue).trim().slice(0, 100);
  if (b.homeScore !== undefined) patch.home_score = Math.max(0, Math.min(30, Number(b.homeScore) || 0));
  if (b.awayScore !== undefined) patch.away_score = Math.max(0, Math.min(30, Number(b.awayScore) || 0));
  if (b.status && ["scheduled", "live", "finished"].includes(b.status)) patch.status = b.status;
  const { data: updated, error: updErr } = await sb.from("matches").update(patch).eq("id", params.id).select().single();
  if (updErr) {
    if (updErr.code === "23505") return NextResponse.json({ error: "That match number is already used" }, { status: 400 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json(toMatch(updated));
}

export async function DELETE(req, { params }) {
  const user = await authUser();
  if (!user) return NextResponse.json({ error: "Please login." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Only the tournament admin can delete fixtures." }, { status: 403 });
  const sb = getSupabase();
  const { data: row } = await sb.from("matches").select("id").eq("id", params.id).maybeSingle();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { error: delErr } = await sb.from("matches").delete().eq("id", params.id);
  if (delErr) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
