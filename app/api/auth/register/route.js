import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase, toUser } from "@/lib/supabase";
import { signToken, AUTH_COOKIE } from "@/lib/auth";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }
    if (!isValidEmail(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 chars" }, { status: 400 });

    const sb = getSupabase();
    const cleanEmail = email.toLowerCase().trim();
    const { data: existing, error: findErr } = await sb.from("users").select("id").eq("email", cleanEmail).maybeSingle();
    if (findErr) throw findErr;
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const { data: row, error: insErr } = await sb.from("users")
      .insert({ name: name.trim(), email: cleanEmail, password_hash: passwordHash })
      .select().single();
    if (insErr) throw insErr;
    const user = toUser(row);

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    const res = NextResponse.json({ id: user.id, name: user.name, email: user.email });
    res.cookies.set(AUTH_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
