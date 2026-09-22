import { getSupabase } from "@/lib/supabase";
import { getUserFromCookies } from "@/lib/auth";

// Fresh user (id, name, email, role) from the database.
// Role is looked up live so promotions apply without re-login.
export async function authUser() {
  const t = getUserFromCookies();
  if (!t) return null;
  try {
    const { data, error } = await getSupabase()
      .from("users").select("id,name,email,role").eq("id", t.id).maybeSingle();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export function isAdmin(u) { return !!u && u.role === "admin"; }
export function isManager(u) { return !!u && u.role === "manager"; }
