export const dynamic = "force-dynamic";

async function getData() {
  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const [m, t] = await Promise.all([
      fetch(`${base}/api/matches`, { cache: "no-store" }).then(async (r) => { try { return await r.json(); } catch { return []; } }).catch(() => []),
      fetch(`${base}/api/leaderboard`, { cache: "no-store" }).then(async (r) => { try { return await r.json(); } catch { return []; } }).catch(() => []),
    ]);
    return { matches: Array.isArray(m) ? m : [], table: Array.isArray(t) ? t : [] };
  } catch { return { matches: [], table: [] }; }
}

export default async function Home() {
  const { matches, table } = await getData();
  const upcoming = matches.filter((m) => m.status !== "finished").slice(0, 3);
  return (
    <>
      <div className="card">
        <h1>SEU LigaPro — Football Management System</h1>
        <p className="muted">Official league portal to manage fixtures, clubs, players and standings.</p>
        <div className="row">
          <a href="/matches" className="btn" style={{ background: "#22c55e", padding: "8px 14px", borderRadius: 8, fontWeight: 700 }}>Manage Matches</a>
          <a href="/leaderboard" className="link" style={{ padding: 8 }}>View standings →</a>
        </div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Upcoming Matches</h3>
          {upcoming.length === 0 ? <p className="muted">No fixtures scheduled yet.</p> : upcoming.map((m) => (
            <div key={m._id} style={{ padding: "8px 0", borderBottom: "1px solid #22344f" }}>
              <b>{m.homeTeam}</b> vs <b>{m.awayTeam}</b> <span className={`badge ${m.status}`}>{m.status}</span>
              <div className="muted">{new Date(m.date).toLocaleString()} · {m.venue}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Top 5 — Standings</h3>
          {table.length === 0 ? <p className="muted">Standings will appear once matches are completed.</p> : (
            <table><thead><tr><th>#</th><th>Club</th><th>P</th><th>Pts</th></tr></thead>
            <tbody>{table.slice(0, 5).map((r, i) => (<tr key={r.team}><td>{i + 1}</td><td>{r.team}</td><td>{r.played}</td><td>{r.points}</td></tr>))}</tbody></table>
          )}
        </div>
      </div>
      <div className="card">
        <h3>Clubs & Players</h3>
        <p className="muted">Register your club, build your squad, and publish fixtures. Each manager controls only his own club and squad.</p>
        <a href="/register" className="link" style={{ color: "#22c55e" }}>Get started — create an account →</a>
      </div>
    </>
  );
}
