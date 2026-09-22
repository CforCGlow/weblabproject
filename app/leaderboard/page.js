"use client";
import { useEffect, useState } from "react";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    fetch("/api/leaderboard")
      .then(async (r) => { try { return { ok: r.ok, status: r.status, d: await r.json() }; } catch { return { ok: false, status: r.status, d: null }; } })
      .then(({ ok, d }) => { if (!ok) setMsg(d?.error || "Table load failed"); setRows(Array.isArray(d) ? d : []); })
      .catch(() => setMsg("Table load failed: cannot reach server"));
  }, []);
  return (
    <div className="card">
      <h2>League Table</h2>
      <p className="muted">Auto-calculated from finished matches: Win=3, Draw=1.</p>
      {msg && <p className="error">{msg}</p>}
      {rows.length === 0 ? <p className="muted">No finished matches yet. Go to Matches and mark some as finished.</p> : (
        <table>
          <thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead>
          <tbody>{rows.map((r, i) => (<tr key={r.team}><td>{i + 1}</td><td><b>{r.team}</b></td><td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td><b>{r.points}</b></td></tr>))}</tbody>
        </table>
      )}
    </div>
  );
}
