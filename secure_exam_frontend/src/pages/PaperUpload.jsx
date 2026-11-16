import { useState } from "react";
import { api } from "../api";
import { PageHead, Alert } from "../components";

export default function PaperUpload() {
  const [file, setFile] = useState(null); const [res, setRes] = useState(null);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState(false);
  const go = async (e) => {
    e.preventDefault(); setErr(""); setRes(null); setBusy(true);
    try { setRes(await api.uploadPaper(file)); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHead title="PDF import" sub="Upload a question-paper PDF (max 20 MB) and extract its text to copy questions into the bank." />
      <Alert>{err}</Alert>
      <form className="card inline" onSubmit={go}>
        <label className="grow">PDF file<input type="file" accept="application/pdf,.pdf" required onChange={(e) => setFile(e.target.files[0])} /></label>
        <button className="btn primary" disabled={busy || !file}>{busy ? "Extracting…" : "Upload & extract"}</button>
      </form>
      {res && (
        <div className="card formcard">
          <div className="row between"><div><b>{res.pages}</b> page{res.pages === 1 ? "" : "s"} · saved as <code>{res.file}</code></div>
            <button className="btn sm" onClick={() => { navigator.clipboard.writeText(res.extracted_text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied ✓" : "Copy text"}</button></div>
          {res.extracted_text.trim() ? <pre className="extract">{res.extracted_text}</pre> : <Alert kind="warn">No text found — this may be a scanned PDF (OCR isn't implemented in the backend yet).</Alert>}
        </div>
      )}
    </>
  );
}
