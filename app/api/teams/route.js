import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Team from "@/models/Team";
import { getUserFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const teams = await Team.find({}).sort({ name: 1 }).limit(200).lean();
    return NextResponse.json(teams);
  } catch (e) {
    console.error("GET /api/teams failed:", e?.message);
    return NextResponse.json({ error: "Database connection failed: " + (e?.message || "unknown") }, { status: 500 });
  }
}

export async function POST(req) {
  const user = getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Please login to register your club." }, { status: 401 });
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: "Club name required" }, { status: 400 });
  await dbConnect();
  try {
    const t = await Team.create({
      name: String(b.name).trim().slice(0, 60),
      coach: String(b.coach || "").trim().slice(0, 60),
      city: String(b.city || "").trim().slice(0, 60),
      userId: user.id,
    });
    return NextResponse.json(t, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Club already registered or create failed" }, { status: 400 });
  }
}
