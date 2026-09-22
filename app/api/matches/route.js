import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Match from "@/models/Match";
import { getUserFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const query = {};
    if (status && ["scheduled", "live", "finished"].includes(status)) query.status = status;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ homeTeam: rx }, { awayTeam: rx }, { venue: rx }];
    }
    const matches = await Match.find(query).sort({ date: 1 }).limit(200).lean();
    return NextResponse.json(matches);
  } catch (e) {
    console.error("GET /api/matches failed:", e?.message);
    return NextResponse.json({ error: "Database connection failed: " + (e?.message || "unknown") }, { status: 500 });
  }
}

export async function POST(req) {
  const user = getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Please login to publish a fixture." }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.homeTeam || !b.awayTeam || !b.date || !b.venue) {
      return NextResponse.json({ error: "homeTeam, awayTeam, date, venue required" }, { status: 400 });
    }
    if (b.homeTeam.trim().toLowerCase() === b.awayTeam.trim().toLowerCase()) {
      return NextResponse.json({ error: "Home and away teams must differ" }, { status: 400 });
    }
    await dbConnect();
    const m = await Match.create({
      homeTeam: String(b.homeTeam).trim().slice(0, 60),
      awayTeam: String(b.awayTeam).trim().slice(0, 60),
      date: new Date(b.date),
      venue: String(b.venue).trim().slice(0, 100),
      homeScore: Math.max(0, Math.min(30, Number(b.homeScore) || 0)),
      awayScore: Math.max(0, Math.min(30, Number(b.awayScore) || 0)),
      status: ["scheduled", "live", "finished"].includes(b.status) ? b.status : "scheduled",
      userId: user.id,
    });
    return NextResponse.json(m, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
