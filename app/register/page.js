"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "audience" });
  const [err, setErr] = useState("");
  const router = useRouter();
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (form.password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!r.ok) { setErr(d.error || "Registration failed"); return; }
    router.push("/dashboard"); router.refresh();
  };
  return (
    <div className="card" style={{ maxWidth: 460, margin: "30px auto" }}>
      <h2>Join SEU LigaPro</h2>
      {err && <p className="error">{err}</p>}
      <form onSubmit={submit}>
        <input placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password (min 6)" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <label className="muted">I am joining as</label>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="audience">Supporter — follow fixtures & table</option>
          <option value="manager">Club manager — register & run one club</option>
        </select>
        <button className="primary" type="submit">Create account</button>
      </form>
      <p className="muted">Players get their login from their club manager. Admins are assigned by the tournament.</p>
      <p className="muted">Have an account? <a href="/login" style={{ color: "var(--green)", fontWeight: 700 }}>Login</a></p>
    </div>
  );
}
