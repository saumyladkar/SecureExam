import { useEffect, useMemo, useState } from "react";
import { api, buildAnswer, OBJECTIVE } from "../api";
import { PageHead, Alert, Empty, Badge, statusTone, typeLabel } from "../components";

const LABELS = "ABCDEFGH".split("");
const blank = (subject = "") => ({ subject, text: "", question_type: "MCQ", marks: "1", explanation: "", options: ["", "", "", ""], correct: [] });

function Form({ subjects, onDone, onError }) {
  const [f, setF] = useState(blank(subjects[0]?.id));
  const [busy, setBusy] = useState(false);
  const t = f.question_type, objective = OBJECTIVE.includes(t);
  const opts = t === "TRUE_FALSE" ? ["True", "False"] : f.options;
  const setType = (type) => setF({ ...f, question_type: type, correct: [], options: type === "TRUE_FALSE" ? ["True", "False"] : f.options.length >= 2 ? f.options : ["", "", "", ""] });
  const toggle = (l) => setF({ ...f, correct: t === "MULTI_SELECT" ? (f.correct.includes(l) ? f.correct.filter((x) => x !== l) : [...f.correct, l]) : [l] });

  const submit = async (e) => {
    e.preventDefault(); onError("");
    if (objective && f.correct.length === 0) return onError("Mark the correct answer.");
    const filled = opts.map((text, i) => ({ label: LABELS[i], text: text.trim(), order: i + 1 })).filter((o) => o.text);
    if (objective && filled.length < 2) return onError("Provide at least two options.");
    if (objective && f.correct.some((l) => !filled.find((o) => o.label === l))) return onError("A correct answer points to an empty option.");
    setBusy(true);
    try {
      // 1) create  2) approve (answer keys require an approved question)  3) store encrypted key
      const q = await api.createQuestion({ subject: f.subject, text: f.text, question_type: t, marks: f.marks, explanation: f.explanation, options: objective ? filled : [] });
      await api.approveQuestion(q.id);
      if (objective) await api.setAnswerKey(q.id, buildAnswer(t, f.correct));
      setF(blank(f.subject)); onDone();
    } catch (x) { onError(x.message); onDone(); } finally { setBusy(false); }
  };

  return (
    <form className="card formcard" onSubmit={submit}>
      <h3>New question</h3>
      <div className="grid3">
        <label>Subject<select required value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label>Type<select value={t} onChange={(e) => setType(e.target.value)}>{Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Marks<input type="number" step="0.25" min="0" required value={f.marks} onChange={(e) => setF({ ...f, marks: e.target.value })} /></label>
      </div>
      <label>Question<textarea required rows={3} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></label>
      {objective && (
        <div className="optlist">
          <span className="lbl">Options — tick the correct {t === "MULTI_SELECT" ? "answers" : "answer"}</span>
          {opts.map((o, i) => (
            <div className="optrow" key={i}>
              <input type={t === "MULTI_SELECT" ? "checkbox" : "radio"} name="correct" checked={f.correct.includes(LABELS[i])} onChange={() => toggle(LABELS[i])} />
              <b>{LABELS[i]}</b>
              <input value={o} disabled={t === "TRUE_FALSE"} placeholder={`Option ${LABELS[i]}`} onChange={(e) => setF({ ...f, options: f.options.map((x, j) => (j === i ? e.target.value : x)) })} />
              {t !== "TRUE_FALSE" && opts.length > 2 && <button type="button" className="btn ghost sm" onClick={() => setF({ ...f, options: f.options.filter((_, j) => j !== i), correct: [] })}>✕</button>}
            </div>
          ))}
          {t !== "TRUE_FALSE" && opts.length < LABELS.length && <button type="button" className="btn ghost sm" onClick={() => setF({ ...f, options: [...f.options, ""] })}>+ Add option</button>}
        </div>
      )}
      <label>Explanation <span className="muted">(optional, admin only)</span><input value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} /></label>
      <div className="row end"><button className="btn primary" disabled={busy || !f.subject}>{busy ? "Saving…" : "Create, approve & set key"}</button></div>
    </form>
  );
}

export default function Questions() {
  const [subjects, setSubjects] = useState(null); const [qs, setQs] = useState(null);
  const [err, setErr] = useState(""); const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState(""); const [keyFor, setKeyFor] = useState(null);
  const load = () => Promise.all([api.subjects(), api.questions()]).then(([s, q]) => { setSubjects(s); setQs(q); }).catch((x) => setErr(x.message));
  useEffect(() => { load(); }, []);
  const sname = useMemo(() => Object.fromEntries((subjects || []).map((s) => [s.id, s.name])), [subjects]);
  const shown = (qs || []).filter((q) => !filter || q.subject === filter);

  const approve = (q) => api.approveQuestion(q.id).then(load).catch((x) => setErr(x.message));
  const del = (q) => confirm("Delete this question?") && api.deleteQuestion(q.id).then(load).catch((x) => setErr("Can't delete: the question is used in an exam or has an answer key."));

  return (
    <>
      <PageHead title="Question bank" sub="Answer keys are encrypted server-side and can never be read back.">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">All subjects</option>{(subjects || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <button className="btn primary" onClick={() => setOpen(!open)} disabled={!subjects?.length}>{open ? "Close" : "+ New question"}</button>
      </PageHead>
      <Alert>{err}</Alert>
      {subjects && subjects.length === 0 && <Alert kind="warn">Create a subject first.</Alert>}
      {open && subjects?.length > 0 && <Form subjects={subjects} onDone={load} onError={setErr} />}
      {!qs ? <div className="muted">Loading…</div> : shown.length === 0 ? <Empty>No questions yet.</Empty> : (
        <div className="stack">
          {shown.map((q) => (
            <div className="card qrow" key={q.id}>
              <div className="row between"><div className="row"><Badge tone="blue">{sname[q.subject]}</Badge><Badge>{typeLabel[q.question_type]}</Badge><Badge tone={statusTone[q.status]}>{q.status.toLowerCase()}</Badge></div><span className="muted small">{q.marks} marks</span></div>
              <p className="qt">{q.text}</p>
              {q.options.length > 0 && <ul className="olist">{q.options.map((o) => <li key={o.id}><b>{o.label}.</b> {o.text}</li>)}</ul>}
              <div className="row end">
                {OBJECTIVE.includes(q.question_type) && q.status === "APPROVED" && <button className="btn sm" onClick={() => setKeyFor(keyFor === q.id ? null : q.id)}>Set / replace answer key</button>}
                {q.status !== "APPROVED" && <button className="btn sm primary" onClick={() => approve(q)}>Approve</button>}
                <button className="btn ghost sm danger" onClick={() => del(q)}>Delete</button>
              </div>
              {keyFor === q.id && <KeyEditor q={q} onClose={() => setKeyFor(null)} onError={setErr} />}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function KeyEditor({ q, onClose, onError }) {
  const [sel, setSel] = useState([]); const [msg, setMsg] = useState("");
  const multi = q.question_type === "MULTI_SELECT";
  const tog = (l) => setSel(multi ? (sel.includes(l) ? sel.filter((x) => x !== l) : [...sel, l]) : [l]);
  const save = async () => {
    onError("");
    try { await api.setAnswerKey(q.id, buildAnswer(q.question_type, sel)); setMsg("Encrypted key saved."); setTimeout(onClose, 900); }
    catch (x) { onError(x.message); }
  };
  return (
    <div className="keyedit">
      <span className="small muted">Choose the correct {multi ? "answers" : "answer"}. The current key is hidden by design.</span>
      <div className="row">{q.options.map((o) => <label key={o.id} className="chk"><input type={multi ? "checkbox" : "radio"} name={`k${q.id}`} checked={sel.includes(o.label)} onChange={() => tog(o.label)} /> {o.label}</label>)}
        <button className="btn sm primary" disabled={!sel.length} onClick={save}>Save key</button>{msg && <span className="small good">{msg}</span>}</div>
    </div>
  );
}
