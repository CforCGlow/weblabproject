import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { authUser, isAdmin } from "@/lib/guards";

export const dynamic = "force-dynamic";

// Admin: list all accounts (password hashes never leave the server).
export async function GET() {
  const user = await authUser();
  if (!user) return NextResponse.json({ error: "Please login." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const { data, error } = await getSupabase()
    .from("users").select("id,name,email,role,created_at").order("created_at");
  if (error) return NextResponse.json({ error: "Load failed" }, { status: 500 });
  return NextResponse.json(data || []);
}
