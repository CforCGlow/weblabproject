"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [myClub, setMyClub] = useState(null);
  const [counts, setCounts] = useState({ clubs: 0, players: 0, fixtures: 0 });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me");
        if (!r.ok) { setUser(null); return; }
        const d = await r.json();
        const u = d.user;
        setUser(u);
        if (u.role === "player") {
          const pr = await fetch("/api/players?mine=1").then((x) => x.json()).catch(() => []);
          setMyPlayer(Array.isArray(pr) && pr.length ? pr[0] : null);
        }
        if (u.role === "manager") {
          const t = await fetch("/api/teams").then((x) => x.json()).catch(() => []);
          const mine = Array.isArray(t) ? t.find((x) => String(x.userId) === String(u.id)) : null;
          setMyClub(mine || null);
        }
        if (u.role === "admin") {
          const [t, p, m] = await Promise.all([
            fetch("/api/teams").then((x) => x.json()).catch(() => []),
            fetch("/api/players").then((x) => x.json()).catch(() => []),
            fetch("/api/matches").then((x) => x.json()).catch(() => []),
          ]);
          setCounts({
            clubs: Array.isArray(t) ? t.length : 0,
            players: Array.isArray(p) ? p.length : 0,
            fixtures: Array.isArray(m) ? m.length : 0,
          });
        }
      } catch { setUser(null); }
    })();
  }, []);

  if (user === null) {
    return (
      <div className="card">
        <h2>My Account</h2>
        <p className="muted">You are browsing as a guest. Guests can view fixtures, results, clubs and the table — no login needed.</p>
        <p><Link href="/login" style={{ color: "var(--green)", fontWeight: 700 }}>Login</Link> · <Link href="/register" style={{ color: "var(--green)", fontWeight: 700 }}>Join</Link></p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>My Account <span className={`chip chip-${user.role}`}>{user.role}</span></h2>
      <p><b>{user.name}</b> <span className="muted">{user.email}</span></p>

      {user.role === "admin" && (
        <>
          <p className="muted">Tournament control: publish fixtures, enter results, correct scores. The standings update automatically.</p>
          <div className="grid3">
            <div className="step"><b>{counts.fixtures}</b><p className="muted">Fixtures</p></div>
            <div className="step"><b>{counts.clubs}</b><p className="muted">Clubs</p></div>
            <div className="step"><b>{counts.players}</b><p className="muted">Players</p></div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <Link href="/matches" className="btn-gold" style={{ padding: "8px 14px", borderRadius: 8, fontWeight: 700 }}>Manage fixtures</Link>
            <Link href="/leaderboard" className="link" style={{ padding: 8 }}>View table →</Link>
          </div>
        </>
      )}

      {user.role === "manager" && (
        <>
          {myClub ? (
            <>
              <p>My club: <b>{myClub.name}</b> <span className="muted">{myClub.city} · Coach {myClub.coach}</span></p>
              <div className="row"><Link href="/teams" className="btn-gold" style={{ padding: "8px 14px", borderRadius: 8, fontWeight: 700 }}>Manage my squad</Link></div>
            </>
          ) : (
            <>
              <p className="muted">You have not registered your club yet (one per manager).</p>
              <div className="row"><Link href="/teams" className="btn-gold" style={{ padding: "8px 14px", borderRadius: 8, fontWeight: 700 }}>Register my club</Link></div>
            </>
          )}
        </>
      )}

      {user.role === "player" && (
        <>
          {myPlayer ? (
            <table><tbody>
              <tr><td><b>Player</b></td><td>{myPlayer.name} #{myPlayer.jerseyNo}</td></tr>
              <tr><td><b>Club</b></td><td>{myPlayer.teamId?.name || "-"}</td></tr>
              <tr><td><b>Position</b></td><td>{myPlayer.position}</td></tr>
              <tr><td><b>Goals</b></td><td>{myPlayer.goals}</td></tr>
            </tbody></table>
          ) : (
            <p className="muted">No player profile linked to this login yet — ask your club manager to sign you.</p>
          )}
          <p><Link href="/leaderboard" style={{ color: "var(--green)", fontWeight: 700 }}>View table →</Link></p>
        </>
      )}

      {user.role === "audience" && (
        <>
          <p className="muted">Follow the tournament — no account needed beyond this. Managers run clubs, the admin runs fixtures.</p>
          <div className="row">
            <Link href="/matches" className="link">Fixtures →</Link>
            <Link href="/leaderboard" className="link">Table →</Link>
            <Link href="/teams" className="link">Clubs →</Link>
          </div>
        </>
      )}
    </div>
  );
}
