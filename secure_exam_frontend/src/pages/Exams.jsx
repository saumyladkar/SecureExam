import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { PageHead, Alert, Empty, Badge, fmt, statusTone } from "../components";

const local = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const init = (subject = "") => {
  const s = new Date(Date.now() + 3600e3), e = new Date(Date.now() + 86400e3);
  return { subject, title: "", description: "", duration_minutes: 60, total_questions: 10, total_marks: 10, negative_marking: 0,
    shuffle_questions: true, shuffle_options: true, max_attempts: 1, start_time: local(s), end_time: local(e), questions: [] };
};

function ExamForm({ subjects, questions, onDone, onError }) {
  const [f, setF] = useState(init(subjects[0]?.id)); const [busy, setBusy] = useState(false);
  const pool = useMemo(() => questions.filter((q) => q.subject === f.subject && q.status === "APPROVED"), [questions, f.subject]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const tog = (id) => setF({ ...f, questions: f.questions.includes(id) ? f.questions.filter((x) => x !== id) : [...f.questions, id] });
  const picked = pool.filter((q) => f.questions.includes(q.id));
  const marks = picked.reduce((a, q) => a + Number(q.marks), 0);

  const submit = async (e) => {
    e.preventDefault(); onError(""); setBusy(true);
    try {
      await api.createExam({ ...f, questions: picked.map((q) => q.id),
        start_time: new Date(f.start_time).toISOString(), end_time: new Date(f.end_time).toISOString() });
      onDone();
    } catch (x) { onError(x.message); } finally { setBusy(false); }
  };
  return (
    <form className="card formcard" onSubmit={submit}>
      <h3>New exam</h3>
      <div className="grid2">
        <label>Title<input required value={f.title} onChange={set("title")} /></label>
        <label>Subject<select value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value, questions: [] })}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      </div>
      <label>Description<input value={f.description} onChange={set("description")} /></label>
      <div className="grid4">
        <label>Duration (min)<input type="number" min="1" required value={f.duration_minutes} onChange={set("duration_minutes")} /></label>
        <label>Questions per attempt<input type="number" min="1" required value={f.total_questions} onChange={set("total_questions")} /></label>
        <label>Total marks<input type="number" step="0.25" min="0" required value={f.total_marks} onChange={set("total_marks")} /></label>
        <label>Negative marking<input type="number" step="0.25" min="0" value={f.negative_marking} onChange={set("negative_marking")} /></label>
      </div>
      <div className="grid4">
        <label>Opens<input type="datetime-local" required value={f.start_time} onChange={set("start_time")} /></label>
        <label>Closes<input type="datetime-local" required value={f.end_time} onChange={set("end_time")} /></label>
        <label>Max attempts<input type="number" min="1" required value={f.max_attempts} onChange={set("max_attempts")} /></label>
        <div className="checks"><label className="chk"><input type="checkbox" checked={f.shuffle_questions} onChange={set("shuffle_questions")} /> Shuffle questions</label>
          <label className="chk"><input type="checkbox" checked={f.shuffle_options} onChange={set("shuffle_options")} /> Shuffle options</label></div>
      </div>
      <div>
        <div className="row between"><span className="lbl">Questions from the bank (approved only) — {picked.length} selected, {marks} marks</span>
          <span><button type="button" className="btn ghost sm" onClick={() => setF({ ...f, questions: pool.map((q) => q.id) })}>Select all</button> <button type="button" className="btn ghost sm" onClick={() => setF({ ...f, questions: [] })}>Clear</button></span></div>
        <div className="picker">{pool.length === 0 ? <div className="muted pad">No approved questions for this subject.</div> : pool.map((q) => (
          <label key={q.id} className="pick"><input type="checkbox" checked={f.questions.includes(q.id)} onChange={() => tog(q.id)} /><span>{q.text}</span><Badge>{q.marks}</Badge></label>))}</div>
        {picked.length > 0 && picked.length < Number(f.total_questions) && <p className="small warn">Fewer questions selected than "questions per attempt" — students will get {picked.length}.</p>}
      </div>
      <div className="row end"><button className="btn primary" disabled={busy || picked.length === 0}>{busy ? "Creating…" : "Create exam (draft)"}</button></div>
    </form>
  );
}

export default function Exams() {
  const [exams, setExams] = useState(null); const [subjects, setSubjects] = useState(null); const [questions, setQuestions] = useState([]);
  const [err, setErr] = useState(""); const [ok, setOk] = useState(""); const [open, setOpen] = useState(false);
  const load = () => Promise.all([api.exams(), api.subjects(), api.questions()]).then(([e, s, q]) => { setExams(e); setSubjects(s); setQuestions(q); }).catch((x) => setErr(x.message));
  useEffect(() => { load(); }, []);
  const sname = Object.fromEntries((subjects || []).map((s) => [s.id, s.name]));
  const publish = async (e) => { setErr(""); setOk(""); try { await api.publishExam(e.id); setOk(`"${e.title}" is now visible to students.`); load(); } catch (x) { setErr(x.message); } };
  return (
    <>
      <PageHead title="Exams" sub="Create, schedule and publish exams."><button className="btn primary" onClick={() => setOpen(!open)} disabled={!subjects?.length}>{open ? "Close" : "+ New exam"}</button></PageHead>
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>
      {subjects && !subjects.length && <Alert kind="warn">Add a subject and some approved questions first.</Alert>}
      {open && subjects?.length > 0 && <ExamForm subjects={subjects} questions={questions} onError={setErr} onDone={() => { setOpen(false); load(); }} />}
      {!exams ? <div className="muted">Loading…</div> : exams.length === 0 ? <Empty>No exams yet.</Empty> : (
        <div className="card tablewrap"><table>
          <thead><tr><th>Title</th><th>Subject</th><th>Window</th><th>Duration</th><th>Qs</th><th>Status</th><th /></tr></thead>
          <tbody>{exams.map((e) => (
            <tr key={e.id}><td><b>{e.title}</b></td><td>{sname[e.subject]}</td><td className="small">{fmt(e.start_time)}<br />{fmt(e.end_time)}</td>
              <td>{e.duration_minutes} min</td><td>{e.questions.length}</td><td><Badge tone={statusTone[e.status]}>{e.status.toLowerCase()}</Badge></td>
              <td className="num">{e.status === "DRAFT" && <button className="btn sm primary" onClick={() => publish(e)}>Publish</button>}</td></tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
