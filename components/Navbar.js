"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  const load = async () => {
    try {
      const r = await fetch("/api/auth/me");
      if (r.ok) { const d = await r.json(); setUser(d.user); }
      else setUser(null);
    } catch { setUser(null); }
  };
  useEffect(() => { load(); }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const link = (href, label) => (
    <Link key={href} href={href} className={"link" + (pathname === href ? " active" : "")}>{label}</Link>
  );

  return (
    <nav className="nav">
      <Link href="/" className="logo">SEU LigaPro</Link>
      <div className="links">
        {link("/", "Home")}
        {link("/matches", "Matches")}
        {link("/teams", "Teams")}
        {link("/leaderboard", "Table")}
        {user ? (
          <>
            <span className="muted">Hi, {user.name}</span>
            <button className="btn" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            {link("/login", "Login")}
            <Link href="/register" className="btn">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
