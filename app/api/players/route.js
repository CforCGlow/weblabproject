import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Player from "@/models/Player";
import Team from "@/models/Team";
import { getUserFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const position = (searchParams.get("position") || "").trim();
    const query = {};
    if (position && ["GK", "DEF", "MID", "FWD"].includes(position)) query.position = position;
    if (search) query.name = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const players = await Player.find(query).populate("teamId", "name").sort({ goals: -1 }).limit(200).lean();
    return NextResponse.json(players);
  } catch (e) {
    console.error("GET /api/players failed:", e?.message);
    return NextResponse.json({ error: "Database connection failed: " + (e?.message || "unknown") }, { status: 500 });
  }
}

export async function POST(req) {
  const user = getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Please login to sign players." }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.name || !b.teamId) return NextResponse.json({ error: "name and teamId required" }, { status: 400 });
    await dbConnect();
    const team = await Team.findById(b.teamId);
    if (!team) return NextResponse.json({ error: "Club not found" }, { status: 404 });
    if (team.userId.toString() !== user.id) {
      return NextResponse.json({ error: "You can only add players to your own club." }, { status: 403 });
    }
    const p = await Player.create({
      name: String(b.name).trim().slice(0, 60),
      position: ["GK", "DEF", "MID", "FWD"].includes(b.position) ? b.position : "MID",
      jerseyNo: Math.max(1, Math.min(99, Number(b.jerseyNo) || 10)),
      goals: Math.max(0, Number(b.goals) || 0),
      teamId: team._id,
      userId: user.id,
    });
    return NextResponse.json(p, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Add player failed: " + (e?.message || "unknown") }, { status: 500 });
  }
}
