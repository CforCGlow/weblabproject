import { NextResponse } from "next/server";
import { getSupabase, toTeam } from "@/lib/supabase";
import { authUser, isAdmin } from "@/lib/guards";

// Manager edits own club (admin may edit any).
export async function PUT(req, { params }) {
  const user = await authUser();
  if (!user) return NextResponse.json({ error: "Please login." }, { status: 401 });
  const sb = getSupabase();
  const { data: t } = await sb.from("teams").select("*").eq("id", params.id).maybeSingle();
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (t.user_id !== user.id && !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const patch = {};
  if (b.name !== undefined) patch.name = String(b.name).trim().slice(0, 60);
  if (b.coach !== undefined) patch.coach = String(b.coach).trim().slice(0, 60);
  if (b.city !== undefined) patch.city = String(b.city).trim().slice(0, 60);
  const { data: updated, error } = await sb.from("teams").update(patch).eq("id", params.id).select().single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Club name already taken" }, { status: 400 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json(toTeam(updated));
}

export async function DELETE(req, { params }) {
  const user = await authUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabase();
  const { data: t, error: findErr } = await sb.from("teams").select("*").eq("id", params.id).maybeSingle();
  if (findErr) return NextResponse.json({ error: "Load failed" }, { status: 500 });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (t.user_id !== user.id && !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Players are removed automatically by the ON DELETE CASCADE foreign key.
  const { error: delErr } = await sb.from("teams").delete().eq("id", params.id);
  if (delErr) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
