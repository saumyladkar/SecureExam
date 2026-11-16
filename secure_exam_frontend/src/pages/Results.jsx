import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth, isAdmin } from "../auth";
import { PageHead, Alert, Empty, Badge, fmt, statusTone } from "../components";

export default function Results() {
  const { user } = useAuth(); const admin = isAdmin(user);
  const [rows, setRows] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api.results().then(setRows).catch((x) => setErr(x.message)); }, []);
  return (
    <>
      <PageHead title="Results" sub={admin ? "All student attempts." : "Your exam attempts and scores."} />
      <Alert>{err}</Alert>
      {!rows ? <div className="muted">Loading…</div> : rows.length === 0 ? <Empty>No attempts yet.</Empty> : (
        <div className="card tablewrap"><table>
          <thead><tr><th>Exam</th>{admin && <th>Student</th>}<th>Status</th><th>Submitted</th><th className="num">Score</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.attempt_id}><td>{r.exam}</td>{admin && <td>{r.student}</td>}
              <td><Badge tone={statusTone[r.status]}>{r.status.replace("_", " ").toLowerCase()}</Badge></td>
              <td>{fmt(r.submitted_at)}</td><td className="num"><b>{r.status === "SUBMITTED" ? r.score : "—"}</b></td></tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
