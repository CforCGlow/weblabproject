import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase, toUser } from "@/lib/supabase";
import { signToken, AUTH_COOKIE } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    const sb = getSupabase();
    const { data: row, error } = await sb.from("users").select("*").eq("email", email.toLowerCase().trim()).maybeSingle();
    if (error) throw error;
    if (!row) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const user = toUser(row);
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const token = signToken({ id: user.id, email: user.email, name: user.name });
    const res = NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    res.cookies.set(AUTH_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
