import { NextResponse } from "next/server";
import dns from "node:dns/promises";

export const dynamic = "force-dynamic";

export async function GET() {
  const uri = process.env.MONGODB_URI || "";
  const out = {
    hasUri: !!uri,
    host: null,
    srvLookup: null,
    mongoose: null,
    hint: null,
  };
  try {
    const m = uri.match(/@([^/?]+)/);
    out.host = m ? m[1] : null;
    if (out.host && out.host.includes("mongodb.net")) {
      const srvHost = "_mongodb._tcp." + out.host.split(".").slice(1).join(".");
      // Reconstruct full SRV host from original: cluster0.<rest>
      const fullSrv = "_mongodb._tcp.cluster0." + out.host.split("cluster0.")[1]?.split(":")[0];
      try {
        const recs = await dns.resolveSrv(out.host.includes("cluster0.") ? fullSrv : srvHost);
        out.srvLookup = `OK (${recs.length} records)`;
      } catch (e) {
        out.srvLookup = "FAILED: " + (e?.message || e);
        out.hint =
          "DNS SRV lookup failed. Change Windows DNS to 8.8.8.8 / 1.1.1.1, try a phone hotspot, confirm the Atlas hostname, and unpause the cluster. Open this route after each change.";
        return NextResponse.json(out, { status: 500 });
      }
    }
    const dbConnect = (await import("@/lib/db")).default;
    await dbConnect();
    out.mongoose = "CONNECTED";
    return NextResponse.json(out);
  } catch (e) {
    out.mongoose = "FAILED: " + (e?.message || e);
    return NextResponse.json(out, { status: 500 });
  }
}
