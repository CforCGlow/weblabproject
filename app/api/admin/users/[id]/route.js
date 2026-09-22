import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { authUser, isAdmin } from "@/lib/guards";

const ROLES = ["admin", "manager", "player", "audience"];

// Admin: change any account's role (except your own — no self lockout).
export async function PUT(req, { params }) {
  const user = await authUser();
  if (!user) return NextResponse.json({ error: "Please login." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  if (params.id === user.id) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  }
  const { role } = await req.json();
  if (!ROLES.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  const sb = getSupabase();
  const { data: target } = await sb.from("users").select("id").eq("id", params.id).maybeSingle();
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: updated, error } = await sb.from("users").update({ role }).eq("id", params.id)
    .select("id,name,email,role").single();
  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json(updated);
}

// Admin: delete any account except your own.
// Their clubs, players and fixtures go with it (FK cascades).
export async function DELETE(req, { params }) {
  const user = await authUser();
  if (!user) return NextResponse.json({ error: "Please login." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  if (params.id === user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }
  const sb = getSupabase();
  const { data: target } = await sb.from("users").select("id").eq("id", params.id).maybeSingle();
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { error } = await sb.from("users").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
