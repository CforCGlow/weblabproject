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
      <p className="muted">Standard rules — Win 3 pts, Draw 1 pt. Sorted by points, then goal difference, then goals scored. Updates automatically from results.</p>
      {msg && <p className="error">{msg}</p>}
      {rows.length === 0 ? <p className="muted">No completed matches yet — the table builds itself once the admin enters results.</p> : (
        <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Club</th><th>MP</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead>
          <tbody>{rows.map((r, i) => (<tr key={r.team} className={i < 4 ? "top4" : ""}><td>{i + 1}</td><td><b>{r.team}</b></td><td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td><b>{r.points}</b></td></tr>))}</tbody>
        </table>
        </div>
      )}
    </div>
  );
}
