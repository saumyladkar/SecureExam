import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { Alert } from "../components";

export default function Register() {
  const nav = useNavigate(); const { login } = useAuth();
  const [f, setF] = useState({ first_name: "", last_name: "", username: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await api.register(f); await login(f.username, f.password); nav("/"); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="authwrap">
      <form className="card auth wide" onSubmit={submit}>
        <div className="brand big"><span className="logo">◈</span> Secure Exam</div>
        <h2>Create student account</h2>
        <Alert>{err}</Alert>
        <div className="grid2">
          <label>First name<input required value={f.first_name} onChange={set("first_name")} /></label>
          <label>Last name<input required value={f.last_name} onChange={set("last_name")} /></label>
        </div>
        <div className="grid2">
          <label>Username<input required value={f.username} onChange={set("username")} /></label>
          <label>Phone<input value={f.phone} onChange={set("phone")} /></label>
        </div>
        <label>Email<input type="email" required value={f.email} onChange={set("email")} /></label>
        <label>Password <span className="muted">(min 8 characters)</span><input type="password" minLength={8} required value={f.password} onChange={set("password")} /></label>
        <button className="btn primary" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        <p className="muted center">Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
