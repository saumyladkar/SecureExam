import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Alert } from "../components";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ username: "", password: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await login(f.username.trim(), f.password); nav("/"); }
    catch (x) { setErr(x.status === 401 ? "Incorrect username or password." : x.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="authwrap">
      <form className="card auth" onSubmit={submit}>
        <div className="brand big"><span className="logo">◈</span> Secure Exam</div>
        <h2>Sign in</h2>
        <Alert>{err}</Alert>
        <label>Username<input autoFocus required value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></label>
        <label>Password<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <button className="btn primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="muted center">New student? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
