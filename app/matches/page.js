"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const empty = { homeTeam: "", awayTeam: "", date: "", venue: "", homeScore: 0, awayScore: 0, status: "scheduled" };

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");

  const safeJson = async (r) => {
    try { return await r.json(); }
    catch { return null; }
  };

  const load = async () => {
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (status) q.set("status", status);
      const r = await fetch("/api/matches?" + q.toString());
      const d = await safeJson(r);
      if (!r.ok) { setMsg(d?.error || `Load failed (HTTP ${r.status})`); setMatches([]); return; }
      setMatches(Array.isArray(d) ? d : []);
    } catch {
      setMsg("Load failed: cannot reach server");
      setMatches([]);
    }
  };

  useEffect(() => {
    load();
    fetch("/api/auth/me").then(async (r) => {
      if (r.ok) { const d = await safeJson(r); setUser(d?.user || null); }
      else setUser(null);
    }).catch(() => setUser(null));
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setMsg("");
    if (!user) { setMsg("Please login to publish a fixture."); return; }
    if (form.homeTeam.trim().toLowerCase() === form.awayTeam.trim().toLowerCase()) { setMsg("Home and away clubs must differ"); return; }
    const url = editing ? `/api/matches/${editing}` : "/api/matches";
    const method = editing ? "PUT" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await safeJson(r);
    if (!r.ok) { setMsg(d?.error || "Save failed"); return; }
    setForm(empty); setEditing(null); setMsg(editing ? "Fixture updated" : "Fixture published"); load();
  };

  const del = async (id) => {
    if (!user) { setMsg("Please login to manage fixtures."); return; }
    if (!confirm("Delete this fixture?")) return;
    const r = await fetch(`/api/matches/${id}`, { method: "DELETE" });
    if (!r.ok) { const d = await safeJson(r); setMsg(d?.error || "Delete failed"); return; }
    load();
  };

  return (
    <>
      <div className="card">
        <h2>Fixtures</h2>
        <div className="row">
          <input style={{ maxWidth: 260 }} placeholder="Search club / venue..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="finished">Finished</option>
          </select>
          <button className="secondary" onClick={load}>Search</button>
        </div>
        {msg && <p className="error">{msg}</p>}
      </div>

      <div className="grid2">
        <div className="card">
          <h3>{editing ? "Edit fixture" : "Publish fixture"}</h3>
          {!user ? (
            <p className="muted">You must <Link href="/login" style={{ color: "#22c55e" }}>login</Link> or <Link href="/register" style={{ color: "#22c55e" }}>register</Link> before publishing a fixture.</p>
          ) : (
          <form onSubmit={submit}>
            <input placeholder="Home club" required value={form.homeTeam} onChange={(e) => setForm({ ...form, homeTeam: e.target.value })} />
            <input placeholder="Away club" required value={form.awayTeam} onChange={(e) => setForm({ ...form, awayTeam: e.target.value })} />
            <input type="datetime-local" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input placeholder="Venue" required value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            <div className="row">
              <input type="number" min="0" max="30" placeholder="Home score" value={form.homeScore} onChange={(e) => setForm({ ...form, homeScore: e.target.value })} />
              <input type="number" min="0" max="30" placeholder="Away score" value={form.awayScore} onChange={(e) => setForm({ ...form, awayScore: e.target.value })} />
            </div>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="scheduled">scheduled</option>
              <option value="live">live</option>
              <option value="finished">finished</option>
            </select>
            <button className="primary" type="submit">{editing ? "Update" : "Publish"}</button>
            {editing && <button type="button" className="secondary" style={{ width: "100%", marginTop: 6 }} onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
          </form>
          )}
        </div>
        <div className="card">
          <h3>All fixtures ({matches.length})</h3>
          {matches.map((m) => (
            <div key={m._id} style={{ padding: "10px 0", borderBottom: "1px solid #22344f" }}>
              <b>{m.homeTeam} {m.status === "scheduled" ? "vs" : `${m.homeScore} - ${m.awayScore}`} {m.awayTeam}</b>{" "}
              <span className={`badge ${m.status}`}>{m.status}</span>
              <div className="muted">{new Date(m.date).toLocaleString()} · {m.venue}</div>
              {user && (
              <div className="row" style={{ marginTop: 6 }}>
                <button className="secondary" onClick={() => {
                  setEditing(m._id);
                  const d = new Date(m.date); const pad = (n) => String(n).padStart(2, "0");
                  setForm({ homeTeam: m.homeTeam, awayTeam: m.awayTeam, venue: m.venue, homeScore: m.homeScore, awayScore: m.awayScore, status: m.status, date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` });
                }}>Edit</button>
                <button className="danger" onClick={() => del(m._id)}>Delete</button>
              </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
