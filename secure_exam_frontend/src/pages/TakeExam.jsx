import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, buildAnswer, readLabels } from "../api";
import { Alert, typeLabel } from "../components";

const pad = (n) => String(n).padStart(2, "0");
const clock = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
// The attempt endpoint doesn't return saved answers, so we mirror them locally to restore a refreshed session.
const cacheKey = (id) => `se_answers_${id}`;
const attemptKey = (examId) => `se_attempt_${examId}`;

export default function TakeExam() {
  const { examId } = useParams();
  const nav = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});       // question_id -> answer object
  const [idx, setIdx] = useState(0);
  const [flags, setFlags] = useState({});
  const [left, setLeft] = useState(null);
  const [err, setErr] = useState(""); const [fatal, setFatal] = useState("");
  const [saveState, setSaveState] = useState("saved");
  const [confirm, setConfirm] = useState(false); const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [leaves, setLeaves] = useState(0);
  const timers = useRef({}); const submitted = useRef(false);

  // Resume an in-progress attempt if one is remembered, otherwise start a new one.
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        let id = localStorage.getItem(attemptKey(examId)), data = null;
        if (id) { try { data = await api.attempt(id); } catch { localStorage.removeItem(attemptKey(examId)); } }
        if (!data) {
          const s = await api.startExam(examId); id = s.attempt_id;
          localStorage.setItem(attemptKey(examId), id);
          data = await api.attempt(id);
        }
        if (dead) return;
        try { setAnswers(JSON.parse(localStorage.getItem(cacheKey(id)) || "{}")); } catch {}
        setAttempt(data);
      } catch (x) { if (!dead) setFatal(x.message); }
    })();
    return () => { dead = true; };
  }, [examId]);

  const finish = useCallback(async () => {
    if (submitted.current || !attempt) return;
    submitted.current = true; setSubmitting(true); setConfirm(false);
    Object.values(timers.current).forEach(clearTimeout);
    try {
      // flush any pending descriptive text before grading
      await Promise.allSettled(Object.entries(answers).filter(([q]) => timers.current[q]).map(([q, a]) => api.saveAnswer(attempt.attempt_id, q, a)));
      const r = await api.submit(attempt.attempt_id);
      localStorage.removeItem(attemptKey(examId)); localStorage.removeItem(cacheKey(attempt.attempt_id));
      setResult(r);
    } catch (x) { submitted.current = false; setErr(x.message); }
    finally { setSubmitting(false); }
  }, [attempt, answers, examId]);

  // Countdown from server-provided expiry; auto-submit at zero.
  useEffect(() => {
    if (!attempt) return;
    const end = new Date(attempt.expires_at).getTime();
    const tick = () => { const s = Math.max(0, Math.round((end - Date.now()) / 1000)); setLeft(s); if (s === 0) finish(); };
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [attempt, finish]);

  // Light client-side integrity signals (not a substitute for real proctoring / Safe Exam Browser).
  useEffect(() => {
    const onHide = () => { if (document.hidden) setLeaves((n) => n + 1); };
    const block = (e) => e.preventDefault();
    document.addEventListener("visibilitychange", onHide);
    document.addEventListener("contextmenu", block); document.addEventListener("copy", block); document.addEventListener("paste", block);
    const warn = (e) => { if (!submitted.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => {
      document.removeEventListener("visibilitychange", onHide); document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block); document.removeEventListener("paste", block);
      window.removeEventListener("beforeunload", warn);
    };
  }, []);

  const q = attempt?.questions[idx];
  const save = (qid, ans, delay = 0) => {
    setAnswers((prev) => {
      const next = { ...prev, [qid]: ans };
      try { localStorage.setItem(cacheKey(attempt.attempt_id), JSON.stringify(next)); } catch {}
      return next;
    });
    setSaveState("saving"); clearTimeout(timers.current[qid]);
    timers.current[qid] = setTimeout(async () => {
      delete timers.current[qid];
      try { await api.saveAnswer(attempt.attempt_id, qid, ans); setSaveState("saved"); setErr(""); }
      catch (x) { setSaveState("error"); setErr(x.message); }
    }, delay);
  };

  const choose = (label) => {
    const cur = readLabels(q.type, answers[q.question_id]);
    let next;
    if (q.type === "MULTI_SELECT") next = cur.includes(label) ? cur.filter((l) => l !== label) : [...cur, label];
    else next = [label];
    if (next.length === 0) return save(q.question_id, {}, 0);   // cleared selection
    save(q.question_id, buildAnswer(q.type, next));
  };

  if (fatal) return <div className="authwrap"><div className="card auth"><h2>Can't start exam</h2><Alert>{fatal}</Alert><button className="btn" onClick={() => nav("/")}>Back to exams</button></div></div>;
  if (result) return (
    <div className="authwrap"><div className="card auth center">
      <div className="bigcheck">✓</div><h2>Exam submitted</h2>
      <p className="muted">Objective questions were graded automatically.</p>
      <div className="score">{result.score}</div><p className="muted small">Your score (descriptive answers are reviewed separately)</p>
      <button className="btn primary" onClick={() => nav("/results")}>View results</button>
    </div></div>
  );
  if (!attempt) return <div className="center muted" style={{ padding: 80 }}>Preparing your exam…</div>;

  const isAnswered = (qq) => { const a = answers[qq.question_id]; return a && Object.keys(a).length > 0 && (a.text === undefined || a.text.trim() !== ""); };
  const answered = attempt.questions.filter(isAnswered).length;
  const sel = readLabels(q.type, answers[q.question_id]);
  const text = q.type === "SHORT_ANSWER" || q.type === "DESCRIPTIVE";
  const low = left !== null && left <= 300;

  return (
    <div className="exam-shell">
      <header className="exam-top">
        <div className="brand"><span className="logo">◈</span> Secure Exam</div>
        <div className="muted small">{answered}/{attempt.questions.length} answered · {saveState === "saving" ? "Saving…" : saveState === "error" ? "Not saved — retrying on next change" : "All changes saved"}</div>
        <div className={`timer ${low ? "low" : ""}`}>{left === null ? "--:--:--" : clock(left)}</div>
      </header>
      {leaves > 0 && <div className="alert warn" style={{ margin: "12px 24px 0" }}>You left this tab {leaves} time{leaves > 1 ? "s" : ""}. Stay on the exam page.</div>}
      <div className="exam-body">
        <section className="card qcard">
          <div className="row between">
            <span className="muted small">Question {idx + 1} of {attempt.questions.length} · {typeLabel[q.type]} · {q.marks} mark{Number(q.marks) === 1 ? "" : "s"}</span>
            <button className={`btn sm ${flags[q.question_id] ? "amber" : "ghost"}`} onClick={() => setFlags({ ...flags, [q.question_id]: !flags[q.question_id] })}>⚑ {flags[q.question_id] ? "Flagged" : "Flag for review"}</button>
          </div>
          <h2 className="qtext">{q.text}</h2>
          {text ? (
            <textarea rows={q.type === "SHORT_ANSWER" ? 3 : 10} placeholder="Type your answer…" value={answers[q.question_id]?.text ?? ""}
              onChange={(e) => save(q.question_id, { text: e.target.value }, 700)} />
          ) : (
            <div className="options">
              {q.type === "MULTI_SELECT" && <p className="muted small">Select all that apply.</p>}
              {q.options.map((o, i) => {
                const on = sel.includes(o.label);
                return (
                  <button key={o.id} type="button" className={`opt ${on ? "on" : ""}`} onClick={() => choose(o.label)}>
                    <span className={`mark ${q.type === "MULTI_SELECT" ? "sq" : ""}`}>{on ? "✓" : String.fromCharCode(65 + i)}</span>{o.text}
                  </button>
                );
              })}
              {sel.length > 0 && q.type !== "MULTI_SELECT" && <button className="btn ghost sm" onClick={() => save(q.question_id, {}, 0)}>Clear answer</button>}
            </div>
          )}
          <Alert>{err}</Alert>
          <div className="row between navrow">
            <button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Previous</button>
            {idx < attempt.questions.length - 1
              ? <button className="btn primary" onClick={() => setIdx(idx + 1)}>Next →</button>
              : <button className="btn primary" onClick={() => setConfirm(true)}>Review & submit</button>}
          </div>
        </section>
        <aside className="card palette">
          <h4>Questions</h4>
          <div className="pgrid">
            {attempt.questions.map((qq, i) => (
              <button key={qq.question_id} onClick={() => setIdx(i)}
                className={`pn ${i === idx ? "cur" : ""} ${isAnswered(qq) ? "done" : ""} ${flags[qq.question_id] ? "flag" : ""}`}>{i + 1}</button>
            ))}
          </div>
          <div className="legend small muted"><span><i className="d done" />Answered</span><span><i className="d flag" />Flagged</span><span><i className="d" />Not answered</span></div>
          <button className="btn primary block" onClick={() => setConfirm(true)}>Submit exam</button>
        </aside>
      </div>
      {confirm && (
        <div className="modal"><div className="card dialog">
          <h3>Submit your exam?</h3>
          <p>You have answered <b>{answered}</b> of <b>{attempt.questions.length}</b> questions.{answered < attempt.questions.length && <> <span className="warn">{attempt.questions.length - answered} unanswered.</span></>}</p>
          <p className="muted small">You can't change answers after submitting.</p>
          <div className="row end"><button className="btn" onClick={() => setConfirm(false)}>Keep working</button><button className="btn primary" disabled={submitting} onClick={finish}>{submitting ? "Submitting…" : "Submit now"}</button></div>
        </div></div>
      )}
      {submitting && !confirm && <div className="modal"><div className="card dialog center">Submitting your answers…</div></div>}
    </div>
  );
}
