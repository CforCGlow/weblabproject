import { NextResponse } from "next/server";
import { getSupabase, toMatch } from "@/lib/supabase";
import { getUserFromCookies } from "@/lib/auth";

export async function PUT(req, { params }) {
  const user = getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Please login to manage fixtures." }, { status: 401 });
  const sb = getSupabase();
  const { data: row, error: findErr } = await sb.from("matches").select("*").eq("id", params.id).maybeSingle();
  if (findErr) return NextResponse.json({ error: "Load failed" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const patch = {};
  if (b.homeTeam !== undefined) patch.home_team = String(b.homeTeam).trim().slice(0, 60);
  if (b.awayTeam !== undefined) patch.away_team = String(b.awayTeam).trim().slice(0, 60);
  if (b.date) patch.date = new Date(b.date).toISOString();
  if (b.venue !== undefined) patch.venue = String(b.venue).trim().slice(0, 100);
  if (b.homeScore !== undefined) patch.home_score = Math.max(0, Math.min(30, Number(b.homeScore) || 0));
  if (b.awayScore !== undefined) patch.away_score = Math.max(0, Math.min(30, Number(b.awayScore) || 0));
  if (b.status && ["scheduled", "live", "finished"].includes(b.status)) patch.status = b.status;
  const { data: updated, error: updErr } = await sb.from("matches").update(patch).eq("id", params.id).select().single();
  if (updErr) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json(toMatch(updated));
}

export async function DELETE(req, { params }) {
  const user = getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Please login to manage fixtures." }, { status: 401 });
  const sb = getSupabase();
  const { data: row, error: findErr } = await sb.from("matches").select("*").eq("id", params.id).maybeSingle();
  if (findErr) return NextResponse.json({ error: "Load failed" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { error: delErr } = await sb.from("matches").delete().eq("id", params.id);
  if (delErr) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
