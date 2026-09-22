"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const router = useRouter();
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (form.password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!r.ok) { setErr(d.error || "Registration failed"); return; }
    router.push("/matches"); router.refresh();
  };
  return (
    <div className="card" style={{ maxWidth: 420, margin: "30px auto" }}>
      <h2>Create account</h2>
      {err && <p className="error">{err}</p>}
      <form onSubmit={submit}>
        <input placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password (min 6)" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="primary" type="submit">Register</button>
      </form>
      <p className="muted">Have an account? <a href="/login" style={{ color: "#22c55e" }}>Login</a></p>
    </div>
  );
}
