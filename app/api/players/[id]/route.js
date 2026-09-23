import { NextResponse } from "next/server";
import { getSupabase, toPlayer } from "@/lib/supabase";
import { authUser, isAdmin } from "@/lib/guards";

// Manager edits/owns players of his own club (admin may edit any).
async function ownPlayer(sb, id, user) {
  const { data: p } = await sb.from("players").select("*, teams(user_id)").eq("id", id).maybeSingle();
  if (!p) return { error: "Not found", status: 404 };
  const ownerId = p.teams?.user_id || p.user_id;
  if (ownerId !== user.id && p.user_id !== user.id && !isAdmin(user)) {
    return { error: "Forbidden", status: 403 };
  }
  return { player: p };
}

export async function PUT(req, { params }) {
  const user = await authUser();
  if (!user) return NextResponse.json({ error: "Please login." }, { status: 401 });
  const sb = getSupabase();
  const { player, error, status } = await ownPlayer(sb, params.id, user);
  if (error) return NextResponse.json({ error }, { status });
  const b = await req.json();
  const patch = {};
  if (b.name !== undefined) patch.name = String(b.name).trim().slice(0, 60);
  if (b.position && ["GK", "DEF", "MID", "FWD"].includes(b.position)) patch.position = b.position;
  if (b.jerseyNo !== undefined) patch.jersey_no = Math.max(1, Math.min(99, Number(b.jerseyNo) || 10));
  if (b.goals !== undefined) patch.goals = Math.max(0, Number(b.goals) || 0);
  if (b.batch !== undefined) patch.batch = String(b.batch).trim().slice(0, 20);
  if (b.studentId !== undefined) patch.student_id = String(b.studentId).trim().slice(0, 30) || null;
  const { data: updated, error: updErr } = await sb.from("players").update(patch).eq("id", player.id).select("*, teams(name)").single();
  if (updErr) {
    if (updErr.code === "23505") {
      const clash = /jersey/i.test(updErr.message || "")
        ? "That jersey number is already taken in this squad"
        : "That student ID is already registered";
      return NextResponse.json({ error: clash }, { status: 409 });
    }
    const hint = (updErr.message || "").includes("schema cache")
      ? " (database is behind the code — run supabase/migration-v4.sql in SQL Editor)"
      : "";
    return NextResponse.json({ error: "Update failed: " + updErr.message + hint }, { status: 500 });
  }
  return NextResponse.json(toPlayer(updated));
}

export async function DELETE(req, { params }) {
  const user = await authUser();
  if (!user) return NextResponse.json({ error: "Please login." }, { status: 401 });
  const sb = getSupabase();
  const { player, error, status } = await ownPlayer(sb, params.id, user);
  if (error) return NextResponse.json({ error }, { status });
  await sb.from("players").delete().eq("id", player.id);
  // Remove the issued player login as well.
  await sb.from("users").delete().eq("id", player.user_id).eq("role", "player");
  return NextResponse.json({ ok: true });
}
