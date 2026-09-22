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
      <Link href="/" className="logo">SEU <b>LigaPro</b></Link>
      <div className="links">
        {link("/", "Home")}
        {link("/matches", "Fixtures")}
        {link("/teams", "Clubs")}
        {link("/leaderboard", "Table")}
        {user?.role === "admin" && link("/admin", "Admin")}
        {user ? (
          <>
            {link("/dashboard", "My Account")}
            <span className={`chip chip-${user.role}`}>{user.role}</span>
            <span style={{ color: "#cfe0d2" }}>{user.name}</span>
            <button className="btn" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            {link("/login", "Login")}
            <Link href="/register" className="btn">Join</Link>
          </>
        )}
      </div>
    </nav>
  );
}
