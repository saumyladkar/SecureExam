import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { PageHead, Alert, Empty, Badge, fmt } from "../components";

export default function StudentExams() {
  const [exams, setExams] = useState(null); const [subjects, setSubjects] = useState({}); const [err, setErr] = useState("");
  const nav = useNavigate();
  useEffect(() => {
    Promise.all([api.exams(), api.subjects()])
      .then(([e, s]) => { setExams(e); setSubjects(Object.fromEntries(s.map((x) => [x.id, x.name]))); })
      .catch((x) => setErr(x.message));
  }, []);

  const window_ = (e) => {
    const now = Date.now(), s = new Date(e.start_time), en = new Date(e.end_time);
    return now < s ? "upcoming" : now > en ? "closed" : "open";
  };
  return (
    <>
      <PageHead title="My exams" sub="Published exams you can take." />
      <Alert>{err}</Alert>
      {!exams ? <div className="muted">Loading…</div> : exams.length === 0 ? <Empty>No exams are published yet.</Empty> : (
        <div className="cards">
          {exams.map((e) => {
            const w = window_(e);
            return (
              <div className="card exam" key={e.id}>
                <div className="row between"><Badge tone="blue">{subjects[e.subject] || "Subject"}</Badge>
                  <Badge tone={w === "open" ? "green" : w === "upcoming" ? "amber" : "gray"}>{w === "open" ? "Open now" : w === "upcoming" ? "Upcoming" : "Closed"}</Badge></div>
                <h3>{e.title}</h3>
                {e.description && <p className="muted">{e.description}</p>}
                <dl className="facts">
                  <div><dt>Duration</dt><dd>{e.duration_minutes} min</dd></div>
                  <div><dt>Questions</dt><dd>{e.total_questions}</dd></div>
                  <div><dt>Marks</dt><dd>{e.total_marks}</dd></div>
                  <div><dt>Attempts</dt><dd>{e.max_attempts}</dd></div>
                </dl>
                <p className="muted small">{fmt(e.start_time)} → {fmt(e.end_time)}</p>
                {Number(e.negative_marking) > 0 && <p className="small warn">Negative marking: −{e.negative_marking} per wrong answer</p>}
                <button className="btn primary" disabled={w !== "open"} onClick={() => nav(`/attempt/${e.id}`)}>
                  {w === "open" ? "Start / resume exam" : w === "upcoming" ? "Not open yet" : "Closed"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
