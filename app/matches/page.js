"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const empty = { homeTeam: "", awayTeam: "", date: "", venue: "", homeScore: 0, awayScore: 0, status: "scheduled", matchNo: "" };

export default function Fixtures() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");

  const safeJson = async (r) => { try { return await r.json(); } catch { return null; } };
  const isAdmin = user?.role === "admin";

  const load = async () => {
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (status) q.set("status", status);
      const r = await fetch("/api/matches?" + q.toString());
      const d = await safeJson(r);
      if (!r.ok) { setMsg(d?.error || `Load failed (HTTP ${r.status})`); setMatches([]); return; }
      setMatches(Array.isArray(d) ? d : []);
    } catch { setMsg("Load failed: cannot reach server"); setMatches([]); }
  };

  useEffect(() => {
    load();
    fetch("/api/teams").then(async (r) => {
      const d = await safeJson(r);
      if (Array.isArray(d)) setTeams(d);
    }).catch(() => {});
    fetch("/api/auth/me").then(async (r) => {
      if (r.ok) { const d = await safeJson(r); setUser(d?.user || null); }
      else setUser(null);
    }).catch(() => setUser(null));
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setMsg("");
    if (!isAdmin) return;
    if (form.homeTeam.trim().toLowerCase() === form.awayTeam.trim().toLowerCase()) { setMsg("Home and away clubs must differ"); return; }
    const url = editing ? `/api/matches/${editing}` : "/api/matches";
    const r = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await safeJson(r);
    if (!r.ok) { setMsg(d?.error || "Save failed"); return; }
    setForm(empty); setEditing(null); setMsg(editing ? "Fixture updated" : "Fixture published"); load();
  };

  const del = async (id) => {
    if (!isAdmin || !confirm("Delete this fixture?")) return;
    const r = await fetch(`/api/matches/${id}`, { method: "DELETE" });
    if (!r.ok) { const d = await safeJson(r); setMsg(d?.error || "Delete failed"); return; }
    load();
  };

  const fixtures = matches.filter((m) => m.status !== "finished");
  const results = matches.filter((m) => m.status === "finished").reverse();

  return (
    <>
      <div className="card">
        <h2>Fixtures & Results</h2>
        <div className="row">
          <input style={{ maxWidth: 260 }} placeholder="Search club / venue..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="finished">Results</option>
          </select>
          <button className="secondary" onClick={load}>Search</button>
        </div>
        {msg && <p className="error">{msg}</p>}
      </div>

      {isAdmin && (
        <div className="card gold">
          <h3>{editing ? "Edit fixture / result" : "Admin — publish fixture / enter result"}</h3>
          <form onSubmit={submit}>
            <div className="grid2">
              <select required value={form.homeTeam} onChange={(e) => setForm({ ...form, homeTeam: e.target.value })}>
                <option value="">Home club…</option>
                {teams.map((t) => (<option key={t._id} value={t.name}>{t.name}</option>))}
              </select>
              <select required value={form.awayTeam} onChange={(e) => setForm({ ...form, awayTeam: e.target.value })}>
                <option value="">Away club…</option>
                {teams.map((t) => (<option key={t._id} value={t.name}>{t.name}</option>))}
              </select>
            </div>
            <div className="grid2">
              <input type="datetime-local" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <input placeholder="Venue" required value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            </div>
            <div className="grid2">
              <input type="number" min="0" max="30" placeholder="Home score" value={form.homeScore} onChange={(e) => setForm({ ...form, homeScore: e.target.value })} />
              <input type="number" min="0" max="30" placeholder="Away score" value={form.awayScore} onChange={(e) => setForm({ ...form, awayScore: e.target.value })} />
            </div>
            <div className="grid2">
              <input type="number" min="1" placeholder="Match no. (optional)" value={form.matchNo} onChange={(e) => setForm({ ...form, matchNo: e.target.value })} />
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="scheduled">scheduled</option>
                <option value="live">live</option>
                <option value="finished">finished (result)</option>
              </select>
            </div>
            <button className="primary" type="submit">{editing ? "Update" : "Publish"}</button>
            {editing && <button type="button" className="secondary" style={{ width: "100%", marginTop: 6 }} onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
          </form>
        </div>
      )}

      <div className="grid2">
        <div className="card">
          <h3 className="section-title">Upcoming ({fixtures.length})</h3>
          {fixtures.length === 0 && <p className="muted">Nothing scheduled.</p>}
          {fixtures.map((m) => (
            <div key={m._id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              {m.matchNo != null && <><span className="chip chip-audience">M{m.matchNo}</span> </>}<b>{m.homeTeam}</b> {m.status === "live" ? <span className="score">{m.homeScore} - {m.awayScore}</span> : "vs"} <b>{m.awayTeam}</b>{" "}
              <span className={`badge ${m.status}`}>{m.status}</span>
              <div className="muted">{new Date(m.date).toLocaleString()} · {m.venue}</div>
              {isAdmin && (
                <div className="row" style={{ marginTop: 6 }}>
                  <button className="secondary" onClick={() => {
                    setEditing(m._id);
                    const d = new Date(m.date); const pad = (n) => String(n).padStart(2, "0");
                    setForm({ homeTeam: m.homeTeam, awayTeam: m.awayTeam, venue: m.venue, homeScore: m.homeScore, awayScore: m.awayScore, status: m.status, matchNo: m.matchNo ?? "", date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` });
                    window.scrollTo(0, 0);
                  }}>Edit</button>
                  <button className="danger" onClick={() => del(m._id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="card">
          <h3 className="section-title">Results ({results.length})</h3>
          {results.length === 0 && <p className="muted">No results yet.</p>}
          {results.map((m) => (
            <div key={m._id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              {m.matchNo != null && <><span className="chip chip-audience">M{m.matchNo}</span> </>}<b>{m.homeTeam}</b> <span className="score">{m.homeScore} - {m.awayScore}</span> <b>{m.awayTeam}</b>
              <div className="muted">{new Date(m.date).toLocaleDateString()} · {m.venue}</div>
              {isAdmin && (
                <div className="row" style={{ marginTop: 6 }}>
                  <button className="secondary" onClick={() => {
                    setEditing(m._id);
                    const d = new Date(m.date); const pad = (n) => String(n).padStart(2, "0");
                    setForm({ homeTeam: m.homeTeam, awayTeam: m.awayTeam, venue: m.venue, homeScore: m.homeScore, awayScore: m.awayScore, status: m.status, matchNo: m.matchNo ?? "", date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` });
                    window.scrollTo(0, 0);
                  }}>Correct result</button>
                  <button className="danger" onClick={() => del(m._id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {!user && <p className="muted">Browsing as guest. <Link href="/login" style={{ color: "var(--green)", fontWeight: 700 }}>Login</Link> for manager / player / admin features.</p>}
    </>
  );
}
