"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Clubs() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [user, setUser] = useState(null);
  const [tForm, setTForm] = useState({ name: "", coach: "", department: "" });
  const [editingClub, setEditingClub] = useState(null);
  const [pForm, setPForm] = useState({ name: "", email: "", password: "", position: "FWD", jerseyNo: 10, goals: 0, batch: "", studentId: "" });
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [msg, setMsg] = useState("");

  const safe = async (r) => { try { return await r.json(); } catch { return null; } };
  const isManager = user?.role === "manager";
  const myClub = user ? teams.find((t) => String(t.userId) === String(user.id)) : null;
  const mySquad = myClub ? players.filter((p) => p.teamId?.name === myClub.name) : [];

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

  const saveClub = async (e) => {
    e.preventDefault();
    if (!isManager) { setMsg("Only a registered manager can manage a club."); return; }
    const url = editingClub ? `/api/teams/${editingClub}` : "/api/teams";
    const r = await fetch(url, { method: editingClub ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tForm) });
    const d = await safe(r);
    if (!r.ok) { setMsg(d?.error || "Save failed"); return; }
    setTForm({ name: "", coach: "", department: "" }); setEditingClub(null);
    setMsg(editingClub ? "Club updated" : "Club registered"); load();
  };

  const savePlayer = async (e) => {
    e.preventDefault();
    if (!isManager || !myClub) { setMsg("Register your club first."); return; }
    const jerseyTaken = mySquad.some((p) => Number(p.jerseyNo) === Number(pForm.jerseyNo) && p._id !== editingPlayer);
    if (jerseyTaken) { setMsg(`Jersey #${pForm.jerseyNo} is already taken in your squad.`); return; }
    if (editingPlayer) {
      const r = await fetch(`/api/players/${editingPlayer}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: pForm.name, position: pForm.position, jerseyNo: pForm.jerseyNo, goals: pForm.goals, batch: pForm.batch, studentId: pForm.studentId }) });
      const d = await safe(r);
      if (!r.ok) { setMsg(d?.error || "Update failed"); return; }
      setEditingPlayer(null);
    } else {
      if (!pForm.email || !pForm.password) { setMsg("Player email and password are required (player login)."); return; }
      const r = await fetch("/api/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...pForm, teamId: myClub._id }) });
      const d = await safe(r);
      if (!r.ok) { setMsg(d?.error || "Sign failed"); return; }
    }
    setPForm({ name: "", email: "", password: "", position: "FWD", jerseyNo: 10, goals: 0, batch: "", studentId: "" });
    setMsg(editingPlayer ? "Player updated" : "Player signed — login issued"); load();
  };

  const dropPlayer = async (id) => {
    if (!confirm("Release this player? His login will be removed too.")) return;
    const r = await fetch(`/api/players/${id}`, { method: "DELETE" });
    if (!r.ok) { const d = await safe(r); setMsg(d?.error || "Release failed"); return; }
    setMsg("Player released"); load();
  };

  return (
    <>
      <div className="card">
        <h2>Clubs & Squads</h2>
        {msg && <p className="error">{msg}</p>}
        <div className="row">
          <input style={{ maxWidth: 220 }} placeholder="Search player..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={{ maxWidth: 160 }} value={position} onChange={(e) => setPosition(e.target.value)}>
            <option value="">All positions</option><option>GK</option><option>DEF</option><option>MID</option><option>FWD</option>
          </select>
          <button className="secondary" onClick={load}>Filter</button>
        </div>
      </div>

      {isManager && (
        <div className="card gold">
          <h3>{myClub ? "My club" : "Register my club (one per manager)"}</h3>
          {!myClub || editingClub ? (
            <form onSubmit={saveClub}>
              <input placeholder="Club name" required value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} />
              <div className="grid2">
                <input placeholder="Head coach" value={tForm.coach} onChange={(e) => setTForm({ ...tForm, coach: e.target.value })} />
                <input placeholder="Department (e.g. CSE)" value={tForm.department} onChange={(e) => setTForm({ ...tForm, department: e.target.value })} />
              </div>
              <button className="primary" type="submit">{editingClub ? "Update club" : "Register club"}</button>
              {editingClub && <button type="button" className="secondary" style={{ width: "100%", marginTop: 6 }} onClick={() => { setEditingClub(null); setTForm({ name: "", coach: "", department: "" }); }}>Cancel</button>}
            </form>
          ) : (
            <div>
              <b>{myClub.name}</b> <span className="muted">{myClub.department} · Coach {myClub.coach}</span>
              <div className="row" style={{ marginTop: 8 }}>
                <button className="secondary" onClick={() => { setEditingClub(myClub._id); setTForm({ name: myClub.name, coach: myClub.coach || "", department: myClub.department || "" }); }}>Edit club</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid2">
        <div className="card">
          <h3 className="section-title">All clubs ({teams.length})</h3>
          {teams.map((t) => (
            <div key={t._id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <b>{t.name}</b> <span className="muted">{t.department}{t.coach ? ` · Coach ${t.coach}` : ""}</span>
              {user && String(t.userId) === String(user.id) && <span className="chip chip-manager" style={{ marginLeft: 8 }}>mine</span>}
              <div className="muted">Squad: {players.filter((p) => p.teamId?.name === t.name).length} players</div>
            </div>
          ))}
          {!isManager && !user && <p className="muted">Want to run a club? <Link href="/register" style={{ color: "var(--green)", fontWeight: 700 }}>Register as manager</Link>.</p>}
        </div>

        <div className="card">
          <h3 className="section-title">{isManager && myClub ? `My squad — ${myClub.name} (${mySquad.length})` : `Players (${players.length})`}</h3>
          {isManager && myClub && (
            <form onSubmit={savePlayer} style={{ marginBottom: 12 }}>
              <h4>{editingPlayer ? "Edit player" : "Sign player (issues player login)"}</h4>
              <input placeholder="Player name" required value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} />
            <div className="grid2">
              <input placeholder="Batch (e.g. Fall 2023)" required value={pForm.batch} onChange={(e) => setPForm({ ...pForm, batch: e.target.value })} />
              <input placeholder="Student ID" required value={pForm.studentId} onChange={(e) => setPForm({ ...pForm, studentId: e.target.value })} />
            </div>
              {!editingPlayer && (
                <div className="grid2">
                  <input placeholder="Player email (login)" type="email" required value={pForm.email} onChange={(e) => setPForm({ ...pForm, email: e.target.value })} />
                  <input placeholder="Password (min 6)" type="password" required value={pForm.password} onChange={(e) => setPForm({ ...pForm, password: e.target.value })} />
                </div>
              )}
              <div className="grid2">
                <select value={pForm.position} onChange={(e) => setPForm({ ...pForm, position: e.target.value })}><option>GK</option><option>DEF</option><option>MID</option><option>FWD</option></select>
                <input type="number" min="1" max="99" placeholder="Jersey" value={pForm.jerseyNo} onChange={(e) => setPForm({ ...pForm, jerseyNo: e.target.value })} />
              </div>
              {editingPlayer && (
                <input type="number" min="0" placeholder="Goals" value={pForm.goals} onChange={(e) => setPForm({ ...pForm, goals: e.target.value })} />
              )}
              {!editingPlayer && <p className="muted">Goals start at 0 for a new signing.</p>}
              <button className="primary" type="submit">{editingPlayer ? "Update player" : "Sign player"}</button>
              {editingPlayer && <button type="button" className="secondary" style={{ width: "100%", marginTop: 6 }} onClick={() => { setEditingPlayer(null); setPForm({ name: "", email: "", password: "", position: "FWD", jerseyNo: 10, goals: 0, batch: "", studentId: "" }); }}>Cancel</button>}
            </form>
          )}
          <div className="table-wrap">
          <table><thead><tr><th>Player</th><th>Club</th><th>Pos</th><th>Goals</th><th>Batch</th><th>Student ID</th>{isManager && myClub && <th></th>}</tr></thead>
          <tbody>{(isManager && myClub ? mySquad : players).map((p) => (
            <tr key={p._id}><td>{p.name} #{p.jerseyNo}</td><td>{p.teamId?.name || "-"}</td><td>{p.position}</td><td>{p.goals}</td><td>{p.batch || "-"}</td><td>{p.studentId || "-"}</td>
            {isManager && myClub && <td><div className="row">
              <button className="secondary" onClick={() => { setEditingPlayer(p._id); setPForm({ name: p.name, email: "", password: "", position: p.position, jerseyNo: p.jerseyNo, goals: p.goals, batch: p.batch || "", studentId: p.studentId || "" }); }}>Edit</button>
              <button className="danger" onClick={() => dropPlayer(p._id)}>Release</button>
            </div></td>}
            </tr>
          ))}</tbody></table>
          </div>
        </div>
      </div>
    </>
  );
}
