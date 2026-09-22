import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserFromCookies } from "@/lib/auth";

export async function DELETE(req, { params }) {
  const user = getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabase();
  const { data: t, error: findErr } = await sb.from("teams").select("*").eq("id", params.id).maybeSingle();
  if (findErr) return NextResponse.json({ error: "Load failed" }, { status: 500 });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (t.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Players are removed automatically by the ON DELETE CASCADE foreign key.
  const { error: delErr } = await sb.from("teams").delete().eq("id", params.id);
  if (delErr) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
