"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const router = useRouter();
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!r.ok) { setErr(d.error || "Login failed"); return; }
    router.push("/matches"); router.refresh();
  };
  return (
    <div className="card" style={{ maxWidth: 420, margin: "30px auto" }}>
      <h2>Login</h2>
      {err && <p className="error">{err}</p>}
      <form onSubmit={submit}>
        <input placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="primary" type="submit">Login</button>
      </form>
      <p className="muted">No account? <a href="/register" style={{ color: "#22c55e" }}>Register</a></p>
    </div>
  );
}
