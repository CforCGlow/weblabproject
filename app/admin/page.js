"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const emptyFixture = { homeTeam: "", awayTeam: "", date: "", venue: "", homeScore: 0, awayScore: 0, status: "scheduled", matchNo: "" };

export default function Admin() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [msg, setMsg] = useState("");
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);

  const [fForm, setFForm] = useState(emptyFixture);
  const [editingFixture, setEditingFixture] = useState(null);
  const [cForm, setCForm] = useState({ name: "", coach: "", department: "" });
  const [editingClub, setEditingClub] = useState(null);
  const [pForm, setPForm] = useState({ name: "", email: "", password: "", position: "FWD", jerseyNo: 10, goals: 0, batch: "", studentId: "", teamId: "" });
  const [editingPlayer, setEditingPlayer] = useState(null);

  const safe = async (r) => { try { return await r.json(); } catch { return null; } };
  const say = (t) => setMsg(t);

  const loadAll = async () => {
    const [u, m, t, p] = await Promise.all([
      fetch("/api/admin/users").then(safe).catch(() => null),
      fetch("/api/matches").then(safe).catch(() => null),
      fetch("/api/teams").then(safe).catch(() => null),
      fetch("/api/players").then(safe).catch(() => null),
    ]);
    if (Array.isArray(u)) setUsers(u);
    if (Array.isArray(m)) setMatches(m);
    if (Array.isArray(t)) setTeams(t);
    if (Array.isArray(p)) setPlayers(p);
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me");
        if (!r.ok) { setUser(null); }
        else {
          const d = await safe(r);
          const u = d?.user || null;
          setUser(u);
          if (u?.role === "admin") await loadAll();
        }
      } catch { setUser(null); }
      setChecked(true);
    })();
  }, []);

  if (!checked) return <div className="card"><p className="muted">Loading…</p></div>;
  if (!user) {
    return <div className="card"><h2>Admin</h2><p className="muted">Please <Link href="/login" style={{ color: "var(--green)", fontWeight: 700 }}>login</Link> as an admin.</p></div>;
  }
  if (user.role !== "admin") {
    return <div className="card"><h2>Admin</h2><p className="error">Admins only. Your role: {user.role}.</p></div>;
  }

  const setRole = async (id, role) => {
    const r = await fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    const d = await safe(r);
    if (!r.ok) { say(d?.error || "Role change failed"); return; }
    say(`Role updated to ${role}`); loadAll();
  };

  const dropUser = async (u) => {
    if (!confirm(`Delete ${u.name} (${u.email})? Their clubs, players and fixtures go too.`)) return;
    const r = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    const d = await safe(r);
    if (!r.ok) { say(d?.error || "Delete failed"); return; }
    say("Account deleted"); loadAll();
  };

  const saveFixture = async (e) => {
    e.preventDefault();
    const url = editingFixture ? `/api/matches/${editingFixture}` : "/api/matches";
    const r = await fetch(url, { method: editingFixture ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fForm) });
    const d = await safe(r);
    if (!r.ok) { say(d?.error || "Save failed"); return; }
    setFForm(emptyFixture); setEditingFixture(null); say("Fixture saved"); loadAll();
  };

  const dropFixture = async (id) => {
    if (!confirm("Delete this fixture?")) return;
    const r = await fetch(`/api/matches/${id}`, { method: "DELETE" });
    if (!r.ok) { say("Delete failed"); return; }
    loadAll();
  };

  const saveClub = async (e) => {
    e.preventDefault();
    if (!editingClub) return;
    const r = await fetch(`/api/teams/${editingClub}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cForm) });
    const d = await safe(r);
    if (!r.ok) { say(d?.error || "Update failed"); return; }
    setCForm({ name: "", coach: "", department: "" }); setEditingClub(null); say("Club updated"); loadAll();
  };

  const dropClub = async (id) => {
    if (!confirm("Delete this club? Its whole squad goes too.")) return;
    const r = await fetch(`/api/teams/${id}`, { method: "DELETE" });
    if (!r.ok) { say("Delete failed"); return; }
    loadAll();
  };

  const savePlayer = async (e) => {
    e.preventDefault();
    if (editingPlayer) {
      const r = await fetch(`/api/players/${editingPlayer}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: pForm.name, position: pForm.position, jerseyNo: pForm.jerseyNo, goals: pForm.goals, batch: pForm.batch, studentId: pForm.studentId }) });
      const d = await safe(r);
      if (!r.ok) { say(d?.error || "Update failed"); return; }
      setEditingPlayer(null);
    } else {
      if (!pForm.teamId) { say("Select a club first."); return; }
      const r = await fetch("/api/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pForm) });
      const d = await safe(r);
      if (!r.ok) { say(d?.error || "Sign failed"); return; }
    }
    setPForm({ name: "", email: "", password: "", position: "FWD", jerseyNo: 10, goals: 0, batch: "", studentId: "", teamId: "" });
    say("Player saved"); loadAll();
  };

  const dropPlayer = async (id) => {
    if (!confirm("Release this player? His login goes too.")) return;
    const r = await fetch(`/api/players/${id}`, { method: "DELETE" });
    if (!r.ok) { say("Release failed"); return; }
    loadAll();
  };

  const dt = (v) => { const d = new Date(v); const pad = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  return (
    <>
      <div className="card">
        <h2>Admin Control</h2>
        {msg && <p className="error">{msg}</p>}
        <div className="row">
          <span className="muted">{users.length} users · {teams.length} clubs · {players.length} players · {matches.length} fixtures</span>
          <button className="secondary" onClick={loadAll}>Refresh all</button>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Accounts & roles</h3>
        <div className="table-wrap"><table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}{u.id === user.id && " (you)"}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.role} disabled={u.id === user.id} onChange={(e) => setRole(u.id, e.target.value)} style={{ maxWidth: 140 }}>
                  <option value="admin">admin</option><option value="manager">manager</option>
                  <option value="player">player</option><option value="audience">audience</option>
                </select>
              </td>
              <td>{u.id !== user.id && <button className="danger" onClick={() => dropUser(u)}>Delete</button>}</td>
            </tr>
          ))}</tbody>
        </table></div>
        <p className="muted">To create an admin: register a normal account, then switch its role to admin here (or via SQL). You cannot change or delete your own account.</p>
      </div>

      <div className="card gold">
        <h3>{editingFixture ? "Edit fixture / result" : "Publish fixture / enter result"}</h3>
        <form onSubmit={saveFixture}>
          <div className="grid2">
            <select required value={fForm.homeTeam} onChange={(e) => setFForm({ ...fForm, homeTeam: e.target.value })}>
              <option value="">Home club…</option>
              {teams.map((t) => (<option key={t._id} value={t.name}>{t.name}</option>))}
            </select>
            <select required value={fForm.awayTeam} onChange={(e) => setFForm({ ...fForm, awayTeam: e.target.value })}>
              <option value="">Away club…</option>
              {teams.map((t) => (<option key={t._id} value={t.name}>{t.name}</option>))}
            </select>
          </div>
          <div className="grid2">
            <input type="datetime-local" required value={fForm.date} onChange={(e) => setFForm({ ...fForm, date: e.target.value })} />
            <input placeholder="Venue" required value={fForm.venue} onChange={(e) => setFForm({ ...fForm, venue: e.target.value })} />
          </div>
          <div className="grid2">
            <input type="number" min="0" max="30" value={fForm.homeScore} onChange={(e) => setFForm({ ...fForm, homeScore: e.target.value })} />
            <input type="number" min="0" max="30" value={fForm.awayScore} onChange={(e) => setFForm({ ...fForm, awayScore: e.target.value })} />
          </div>
          <div className="grid2">
            <input type="number" min="1" placeholder="Match no. (optional)" value={fForm.matchNo} onChange={(e) => setFForm({ ...fForm, matchNo: e.target.value })} />
            <select value={fForm.status} onChange={(e) => setFForm({ ...fForm, status: e.target.value })}>
              <option value="scheduled">scheduled</option><option value="live">live</option><option value="finished">finished (result)</option>
            </select>
          </div>
          <button className="primary" type="submit">{editingFixture ? "Update" : "Publish"}</button>
          {editingFixture && <button type="button" className="secondary" style={{ width: "100%", marginTop: 6 }} onClick={() => { setEditingFixture(null); setFForm(emptyFixture); }}>Cancel</button>}
        </form>
        <div className="table-wrap"><table>
          <thead><tr><th>Fixture</th><th>Date · Venue</th><th>Status</th><th></th></tr></thead>
          <tbody>{matches.map((m) => (
            <tr key={m._id}><td>{m.matchNo != null && <><span className="chip chip-audience">M{m.matchNo}</span> </>}<b>{m.homeTeam}</b> {m.status === "scheduled" ? "vs" : `${m.homeScore}-${m.awayScore}`} <b>{m.awayTeam}</b></td>
            <td>{new Date(m.date).toLocaleString()} · {m.venue}</td>
            <td><span className={`badge ${m.status}`}>{m.status}</span></td>
            <td><div className="row">
              <button className="secondary" onClick={() => { setEditingFixture(m._id); setFForm({ homeTeam: m.homeTeam, awayTeam: m.awayTeam, venue: m.venue, homeScore: m.homeScore, awayScore: m.awayScore, status: m.status, matchNo: m.matchNo ?? "", date: dt(m.date) }); window.scrollTo(0, 0); }}>Edit</button>
              <button className="danger" onClick={() => dropFixture(m._id)}>Delete</button>
            </div></td></tr>
          ))}</tbody>
        </table></div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="section-title">Clubs ({teams.length})</h3>
          {editingClub && (
            <form onSubmit={saveClub}>
              <input placeholder="Club name" required value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })} />
              <div className="grid2">
                <input placeholder="Coach" value={cForm.coach} onChange={(e) => setCForm({ ...cForm, coach: e.target.value })} />
                <input placeholder="Department (e.g. CSE)" value={cForm.department} onChange={(e) => setCForm({ ...cForm, department: e.target.value })} />
              </div>
              <button className="primary" type="submit">Update club</button>
              <button type="button" className="secondary" style={{ width: "100%", marginTop: 6 }} onClick={() => { setEditingClub(null); setCForm({ name: "", coach: "", department: "" }); }}>Cancel</button>
            </form>
          )}
          {teams.map((t) => (
            <div key={t._id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <b>{t.name}</b> <span className="muted">{t.department} · {t.coach}</span>
              <div className="row" style={{ marginTop: 6 }}>
                <button className="secondary" onClick={() => { setEditingClub(t._id); setCForm({ name: t.name, coach: t.coach || "", department: t.department || "" }); }}>Edit</button>
                <button className="danger" onClick={() => dropClub(t._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="section-title">Players ({players.length})</h3>
          <form onSubmit={savePlayer} style={{ marginBottom: 12 }}>
            <h4>{editingPlayer ? "Edit player" : "Sign player to any club"}</h4>
            <input placeholder="Player name" required value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} />
            <div className="grid2">
              <input placeholder="Batch (e.g. Fall 2023)" required value={pForm.batch} onChange={(e) => setPForm({ ...pForm, batch: e.target.value })} />
              <input placeholder="Student ID" required value={pForm.studentId} onChange={(e) => setPForm({ ...pForm, studentId: e.target.value })} />
            </div>
            {!editingPlayer && (
              <>
                <select value={pForm.teamId} onChange={(e) => setPForm({ ...pForm, teamId: e.target.value })} required>
                  <option value="">Select club</option>
                  {teams.map((t) => (<option key={t._id} value={t._id}>{t.name}</option>))}
                </select>
                <div className="grid2">
                  <input placeholder="Email (login)" type="email" required value={pForm.email} onChange={(e) => setPForm({ ...pForm, email: e.target.value })} />
                  <input placeholder="Password (min 6)" type="password" required value={pForm.password} onChange={(e) => setPForm({ ...pForm, password: e.target.value })} />
                </div>
              </>
            )}
            <div className="grid2">
              <select value={pForm.position} onChange={(e) => setPForm({ ...pForm, position: e.target.value })}><option>GK</option><option>DEF</option><option>MID</option><option>FWD</option></select>
              <input type="number" min="1" max="99" value={pForm.jerseyNo} onChange={(e) => setPForm({ ...pForm, jerseyNo: e.target.value })} />
            </div>
            {editingPlayer && (
              <input type="number" min="0" placeholder="Goals" value={pForm.goals} onChange={(e) => setPForm({ ...pForm, goals: e.target.value })} />
            )}
            {!editingPlayer && <p className="muted">Goals start at 0 for a new signing.</p>}
            <button className="primary" type="submit">{editingPlayer ? "Update" : "Sign"}</button>
            {editingPlayer && <button type="button" className="secondary" style={{ width: "100%", marginTop: 6 }} onClick={() => { setEditingPlayer(null); setPForm({ name: "", email: "", password: "", position: "FWD", jerseyNo: 10, goals: 0, batch: "", studentId: "", teamId: "" }); }}>Cancel</button>}
          </form>
          <div className="table-wrap"><table>
            <thead><tr><th>Player</th><th>Club</th><th>Student ID</th><th></th></tr></thead>
            <tbody>{players.map((p) => (
              <tr key={p._id}><td>{p.name} #{p.jerseyNo} · {p.position} · {p.goals}g</td><td>{p.teamId?.name || "-"}</td><td>{p.studentId || "-"}</td>
              <td><div className="row">
                <button className="secondary" onClick={() => { setEditingPlayer(p._id); setPForm({ name: p.name, email: "", password: "", position: p.position, jerseyNo: p.jerseyNo, goals: p.goals, batch: p.batch || "", studentId: p.studentId || "", teamId: "" }); }}>Edit</button>
                <button className="danger" onClick={() => dropPlayer(p._id)}>Release</button>
              </div></td></tr>
            ))}</tbody>
          </table></div>
        </div>
      </div>
    </>
  );
}
