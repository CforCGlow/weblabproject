export const dynamic = "force-dynamic";

async function getData() {
  const safe = async (p) => { try { const r = await p; try { return await r.json(); } catch { return []; } } catch { return []; } };
  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const [m, t, c] = await Promise.all([
      safe(fetch(`${base}/api/matches`, { cache: "no-store" })),
      safe(fetch(`${base}/api/leaderboard`, { cache: "no-store" })),
      safe(fetch(`${base}/api/teams`, { cache: "no-store" })),
    ]);
    return {
      matches: Array.isArray(m) ? m : [],
      table: Array.isArray(t) ? t : [],
      clubs: Array.isArray(c) ? c : [],
    };
  } catch { return { matches: [], table: [], clubs: [] }; }
}

export default async function Home() {
  const { matches, table, clubs } = await getData();
  const upcoming = matches.filter((m) => m.status !== "finished").slice(0, 5);
  const results = matches.filter((m) => m.status === "finished").slice(-3).reverse();
  return (
    <>
      <div className="hero">
        <h1>SEU <span>LigaPro</span> Tournament</h1>
        <p>The official home of the league — fixtures, results, standings, clubs and squads. Managers register their club, the admin runs the fixtures, everyone follows the action.</p>
        <div className="row">
          <a href="/register" className="btn-gold">Register your club</a>
          <a href="/matches" className="btn-line">View fixtures</a>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="section-title">Upcoming fixtures</h3>
          {upcoming.length === 0 ? <p className="muted">No fixtures scheduled yet.</p> : upcoming.map((m) => (
            <div key={m._id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              {m.matchNo != null && <><span className="chip chip-audience">M{m.matchNo}</span> </>}<b>{m.homeTeam}</b> vs <b>{m.awayTeam}</b> <span className={`badge ${m.status}`}>{m.status}</span>
              <div className="muted">{new Date(m.date).toLocaleString()} · {m.venue}</div>
            </div>
          ))}
          <p><a href="/matches" style={{ color: "var(--green)", fontWeight: 700 }}>All fixtures →</a></p>
        </div>
        <div className="card">
          <h3 className="section-title">Latest results</h3>
          {results.length === 0 ? <p className="muted">No results yet.</p> : results.map((m) => (
            <div key={m._id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              {m.matchNo != null && <><span className="chip chip-audience">M{m.matchNo}</span> </>}<b>{m.homeTeam}</b> <span className="score">{m.homeScore} - {m.awayScore}</span> <b>{m.awayTeam}</b>
              <div className="muted">{new Date(m.date).toLocaleDateString()} · {m.venue}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="section-title">Top 5 — Standings</h3>
          {table.length === 0 ? <p className="muted">Standings appear once matches are completed.</p> : (
            <table><thead><tr><th>#</th><th>Club</th><th>P</th><th>Pts</th></tr></thead>
            <tbody>{table.slice(0, 5).map((r, i) => (<tr key={r.team}><td>{i + 1}</td><td>{r.team}</td><td>{r.played}</td><td>{r.points}</td></tr>))}</tbody></table>
          )}
          <p><a href="/leaderboard" style={{ color: "var(--green)", fontWeight: 700 }}>Full table →</a></p>
        </div>
        <div className="card">
          <h3 className="section-title">Clubs ({clubs.length})</h3>
          {clubs.length === 0 ? <p className="muted">No clubs registered yet. Yours could be first.</p> :
            clubs.slice(0, 6).map((t) => (
              <div key={t._id} style={{ padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                <b>{t.name}</b> <span className="muted">{t.department}{t.coach ? ` · Coach ${t.coach}` : ""}</span>
              </div>
            ))}
          <p><a href="/teams" style={{ color: "var(--green)", fontWeight: 700 }}>All clubs →</a></p>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">How to join</h3>
        <div className="steps">
          <div className="step"><span className="n">1</span><br /><b>Register as manager</b><p className="muted">Create a manager account. Each manager runs exactly one club.</p></div>
          <div className="step"><span className="n">2</span><br /><b>Register your club</b><p className="muted">Name your club, add your coach and department on the Clubs page.</p></div>
          <div className="step"><span className="n">3</span><br /><b>Sign your squad</b><p className="muted">Add players — each player gets a login to view his own profile.</p></div>
        </div>
      </div>
    </>
  );
}
