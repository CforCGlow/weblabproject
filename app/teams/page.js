"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [user, setUser] = useState(null);
  const [tForm, setTForm] = useState({ name: "", coach: "", city: "" });
  const [pForm, setPForm] = useState({ name: "", position: "FWD", jerseyNo: 10, goals: 0, teamId: "" });
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [msg, setMsg] = useState("");

  const safe = async (r) => { try { return await r.json(); } catch { return null; } };

  const load = async () => {
    try {
      const tr = await fetch("/api/teams");
      const t = await safe(tr);
      if (!tr.ok) setMsg(t?.error || `Clubs load failed (${tr.status})`);
      setTeams(Array.isArray(t) ? t : []);
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (position) q.set("position", position);
      const pr = await fetch("/api/players?" + q.toString());
      const p = await safe(pr);
      if (!pr.ok) setMsg(p?.error || `Players load failed (${pr.status})`);
      setPlayers(Array.isArray(p) ? p : []);
    } catch { setMsg("Load failed: cannot reach server"); }
  };

  useEffect(() => {
    load();
    fetch("/api/auth/me").then(async (r) => {
      if (r.ok) { const d = await safe(r); setUser(d?.user || null); }
      else setUser(null);
    }).catch(() => setUser(null));
  }, []);

  const myTeams = user ? teams.filter((t) => String(t.userId) === String(user.id)) : [];

  const addTeam = async (e) => {
    e.preventDefault();
    if (!user) { setMsg("Please login to register your club."); return; }
    const r = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tForm) });
    const d = await safe(r);
    if (!r.ok) { setMsg(d?.error || "Add club failed"); return; }
    setTForm({ name: "", coach: "", city: "" }); setMsg("Club registered"); load();
  };

  const addPlayer = async (e) => {
    e.preventDefault();
    if (!user) { setMsg("Please login to manage your squad."); return; }
    if (!pForm.teamId) { setMsg("Select one of your clubs first."); return; }
    const r = await fetch("/api/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pForm) });
    const d = await safe(r);
    if (!r.ok) { setMsg(d?.error || "Add player failed"); return; }
    setPForm({ name: "", position: "FWD", jerseyNo: 10, goals: 0, teamId: "" }); setMsg("Player signed"); load();
  };

  return (
    <>
      <div className="card">
        <h2>Clubs & Players</h2>
        {msg && <p className="error">{msg}</p>}
        <div className="row">
          <input style={{ maxWidth: 220 }} placeholder="Search player..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={{ maxWidth: 160 }} value={position} onChange={(e) => setPosition(e.target.value)}>
            <option value="">All positions</option><option>GK</option><option>DEF</option><option>MID</option><option>FWD</option>
          </select>
          <button className="secondary" onClick={load}>Filter</button>
        </div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Register club</h3>
          {!user ? (
            <p className="muted">You must <Link href="/login" style={{ color: "#22c55e" }}>login</Link> or <Link href="/register" style={{ color: "#22c55e" }}>register</Link> before registering a club.</p>
          ) : (
          <form onSubmit={addTeam}>
            <input placeholder="Club name" required value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} />
            <input placeholder="Head coach" value={tForm.coach} onChange={(e) => setTForm({ ...tForm, coach: e.target.value })} />
            <input placeholder="City" value={tForm.city} onChange={(e) => setTForm({ ...tForm, city: e.target.value })} />
            <button className="primary" type="submit">Register Club</button>
          </form>
          )}
          <h3 style={{ marginTop: 16 }}>All clubs ({teams.length})</h3>
          {teams.map((t) => (
            <div key={t._id} style={{ padding: "6px 0", borderBottom: "1px solid #22344f" }}>
              <b>{t.name}</b> <span className="muted">{t.city} · {t.coach}</span>
              {user && String(t.userId) === String(user.id) && <span className="badge finished" style={{ marginLeft: 8 }}>yours</span>}
            </div>
          ))}
          {user && <p className="muted">Your clubs: {myTeams.length}</p>}
        </div>
        <div className="card">
          <h3>Sign player</h3>
          {!user ? (
            <p className="muted">You must <Link href="/login" style={{ color: "#22c55e" }}>login</Link> to sign players.</p>
          ) : myTeams.length === 0 ? (
            <p className="muted">Register your club first — you can only sign players for your own club.</p>
          ) : (
          <form onSubmit={addPlayer}>
            <input placeholder="Player name" required value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} />
            <select value={pForm.teamId} onChange={(e) => setPForm({ ...pForm, teamId: e.target.value })} required>
              <option value="">Select your club</option>
              {myTeams.map((t) => (<option key={t._id} value={t._id}>{t.name}</option>))}
            </select>
            <div className="row">
              <select value={pForm.position} onChange={(e) => setPForm({ ...pForm, position: e.target.value })}><option>GK</option><option>DEF</option><option>MID</option><option>FWD</option></select>
              <input type="number" min="1" max="99" value={pForm.jerseyNo} onChange={(e) => setPForm({ ...pForm, jerseyNo: e.target.value })} />
              <input type="number" min="0" placeholder="Goals" value={pForm.goals} onChange={(e) => setPForm({ ...pForm, goals: e.target.value })} />
            </div>
            <button className="primary" type="submit">Sign Player</button>
          </form>
          )}
          <h3 style={{ marginTop: 16 }}>Players ({players.length})</h3>
          <table><thead><tr><th>Name</th><th>Club</th><th>Pos</th><th>Goals</th></tr></thead>
          <tbody>{players.map((p) => (<tr key={p._id}><td>{p.name} #{p.jerseyNo}</td><td>{p.teamId?.name || "-"}</td><td>{p.position}</td><td>{p.goals}</td></tr>))}</tbody></table>
        </div>
      </div>
    </>
  );
}
