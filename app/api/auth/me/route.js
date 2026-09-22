import { NextResponse } from "next/server";
import { authUser } from "@/lib/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await authUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user });
}
