import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Match from "@/models/Match";
import { getUserFromCookies } from "@/lib/auth";

export async function PUT(req, { params }) {
  const user = getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Please login to manage fixtures." }, { status: 401 });
  await dbConnect();
  const m = await Match.findById(params.id);
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (m.userId.toString() !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (b.homeTeam !== undefined) m.homeTeam = String(b.homeTeam).trim().slice(0, 60);
  if (b.awayTeam !== undefined) m.awayTeam = String(b.awayTeam).trim().slice(0, 60);
  if (b.date) m.date = new Date(b.date);
  if (b.venue !== undefined) m.venue = String(b.venue).trim().slice(0, 100);
  if (b.homeScore !== undefined) m.homeScore = Math.max(0, Math.min(30, Number(b.homeScore) || 0));
  if (b.awayScore !== undefined) m.awayScore = Math.max(0, Math.min(30, Number(b.awayScore) || 0));
  if (b.status && ["scheduled", "live", "finished"].includes(b.status)) m.status = b.status;
  await m.save();
  return NextResponse.json(m);
}

export async function DELETE(req, { params }) {
  const user = getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Please login to manage fixtures." }, { status: 401 });
  await dbConnect();
  const m = await Match.findById(params.id);
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (m.userId.toString() !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await m.deleteOne();
  return NextResponse.json({ ok: true });
}
