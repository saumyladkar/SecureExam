import { useEffect, useState } from "react";
import { api } from "../api";
import { PageHead, Alert, Empty, Badge } from "../components";

export default function Subjects() {
  const [list, setList] = useState(null); const [err, setErr] = useState("");
  const [f, setF] = useState({ name: "", code: "", description: "" });
  const load = () => api.subjects().then(setList).catch((x) => setErr(x.message));
  useEffect(() => { load(); }, []);
  const add = async (e) => {
    e.preventDefault(); setErr("");
    try { await api.createSubject({ ...f, code: f.code.trim().toUpperCase() }); setF({ name: "", code: "", description: "" }); load(); }
    catch (x) { setErr(x.message); }
  };
  const toggle = (s) => api.updateSubject(s.id, { is_active: !s.is_active }).then(load).catch((x) => setErr(x.message));
  const del = (s) => confirm(`Delete subject "${s.name}"?`) && api.deleteSubject(s.id).then(load).catch((x) => setErr(x.status === 500 || x.status === 409 ? "Subject is in use by questions or exams and can't be deleted." : x.message));
  return (
    <>
      <PageHead title="Subjects" sub="Group questions and exams by subject." />
      <Alert>{err}</Alert>
      <form className="card inline" onSubmit={add}>
        <label>Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>Code<input required maxLength={30} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></label>
        <label className="grow">Description<input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
        <button className="btn primary">Add subject</button>
      </form>
      {!list ? <div className="muted">Loading…</div> : list.length === 0 ? <Empty>No subjects yet — add one above.</Empty> : (
        <div className="card tablewrap"><table>
          <thead><tr><th>Name</th><th>Code</th><th>Description</th><th>Status</th><th /></tr></thead>
          <tbody>{list.map((s) => (
            <tr key={s.id}><td><b>{s.name}</b></td><td><code>{s.code}</code></td><td className="muted">{s.description}</td>
              <td><Badge tone={s.is_active ? "green" : "gray"}>{s.is_active ? "active" : "inactive"}</Badge></td>
              <td className="num"><button className="btn ghost sm" onClick={() => toggle(s)}>{s.is_active ? "Deactivate" : "Activate"}</button> <button className="btn ghost sm danger" onClick={() => del(s)}>Delete</button></td></tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
