import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth, isAdmin } from "./auth";

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const admin = isAdmin(user);
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><span className="logo">◈</span> Secure Exam</div>
        <nav>
          {admin ? (<>
            <NavLink to="/admin/exams">Exams</NavLink>
            <NavLink to="/admin/questions">Questions</NavLink>
            <NavLink to="/admin/subjects">Subjects</NavLink>
            <NavLink to="/admin/papers">PDF import</NavLink>
          </>) : <NavLink to="/" end>My exams</NavLink>}
          <NavLink to="/results">Results</NavLink>
        </nav>
        <div className="who">
          <span className="muted">{user.first_name || user.username} · {user.role.toLowerCase()}</span>
          <button className="btn ghost sm" onClick={() => { logout(); nav("/login"); }}>Sign out</button>
        </div>
      </header>
      <main className="page"><Outlet /></main>
    </div>
  );
}

export function PageHead({ title, sub, children }) {
  return (<div className="pagehead"><div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div><div className="row">{children}</div></div>);
}
export const Alert = ({ kind = "error", children }) => children ? <div className={`alert ${kind}`}>{children}</div> : null;
export const Badge = ({ tone = "gray", children }) => <span className={`badge ${tone}`}>{children}</span>;
export const Empty = ({ children }) => <div className="empty">{children}</div>;
export const fmt = (d) => d ? new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—";
export const statusTone = { DRAFT: "gray", PUBLISHED: "green", COMPLETED: "blue", APPROVED: "green", REJECTED: "red", IN_PROGRESS: "amber", SUBMITTED: "green", EXPIRED: "red" };
export const typeLabel = { MCQ: "Multiple choice", MULTI_SELECT: "Multi-select", TRUE_FALSE: "True / False", SHORT_ANSWER: "Short answer", DESCRIPTIVE: "Descriptive" };
