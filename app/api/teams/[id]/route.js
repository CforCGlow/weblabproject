import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Team from "@/models/Team";
import Player from "@/models/Player";
import { getUserFromCookies } from "@/lib/auth";

export async function DELETE(req, { params }) {
  const user = getUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const t = await Team.findById(params.id);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (t.userId.toString() !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await Player.deleteMany({ teamId: t._id });
  await t.deleteOne();
  return NextResponse.json({ ok: true });
}
