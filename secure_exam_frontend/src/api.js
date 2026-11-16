const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
const K = { access: "se_access", refresh: "se_refresh" };

export const tokens = {
  get access() { return localStorage.getItem(K.access); },
  get refresh() { return localStorage.getItem(K.refresh); },
  set({ access, refresh }) {
    if (access) localStorage.setItem(K.access, access);
    if (refresh) localStorage.setItem(K.refresh, refresh);
  },
  clear() { localStorage.removeItem(K.access); localStorage.removeItem(K.refresh); },
};

export class ApiError extends Error {
  constructor(message, status, data) { super(message); this.status = status; this.data = data; }
}

// Flatten DRF error shapes ({detail}, {field:[msgs]}, [msgs]) into one readable string.
function describe(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);
  if (Array.isArray(data)) return data.join(" ");
  return Object.entries(data)
    .map(([k, v]) => `${k === "non_field_errors" ? "" : k + ": "}${Array.isArray(v) ? v.join(" ") : typeof v === "object" ? describe(v, "") : v}`)
    .join("  ") || fallback;
}

let refreshing = null;
async function refreshAccess() {
  if (!tokens.refresh) return false;
  refreshing ??= fetch(`${BASE}/token/refresh/`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: tokens.refresh }),
  }).then(async (r) => { if (!r.ok) return false; tokens.set(await r.json()); return true; })
    .catch(() => false).finally(() => { refreshing = null; });
  return refreshing;
}

export let onSessionExpired = () => {};
export const setSessionExpiredHandler = (fn) => { onSessionExpired = fn; };

async function request(path, { method = "GET", body, form, auth = true } = {}, retried = false) {
  const headers = {};
  if (auth && tokens.access) headers.Authorization = `Bearer ${tokens.access}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
  let res;
  try { res = await fetch(`${BASE}${path}`, { method, headers, body: payload }); }
  catch { throw new ApiError("Cannot reach the server. Check your connection.", 0); }

  if (res.status === 401 && auth && !retried) {
    if (await refreshAccess()) return request(path, { method, body, form, auth }, true);
    tokens.clear(); onSessionExpired();
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new ApiError(describe(data, `Request failed (${res.status})`), res.status, data);
  return data;
}

export const api = {
  login: (username, password) => request("/token/", { method: "POST", body: { username, password }, auth: false }),
  register: (b) => request("/accounts/register/", { method: "POST", body: b, auth: false }),
  me: () => request("/accounts/me/"),

  subjects: () => request("/subjects/"),
  createSubject: (b) => request("/subjects/", { method: "POST", body: b }),
  updateSubject: (id, b) => request(`/subjects/${id}/`, { method: "PATCH", body: b }),
  deleteSubject: (id) => request(`/subjects/${id}/`, { method: "DELETE" }),

  questions: () => request("/questions/"),
  createQuestion: (b) => request("/questions/", { method: "POST", body: b }),
  deleteQuestion: (id) => request(`/questions/${id}/`, { method: "DELETE" }),
  approveQuestion: (id) => request(`/questions/${id}/approve/`, { method: "POST" }),
  // POST creates the key; the backend answers 409 if one exists, so fall back to PUT (replace).
  async setAnswerKey(id, answer) {
    try { return await request(`/questions/${id}/answer-key/`, { method: "POST", body: { answer } }); }
    catch (e) { if (e.status === 409) return request(`/questions/${id}/answer-key/`, { method: "PUT", body: { answer } }); throw e; }
  },
  uploadPaper: (file) => { const form = new FormData(); form.append("file", file); return request("/papers/upload/", { method: "POST", form }); },

  exams: () => request("/exams/"),
  createExam: (b) => request("/exams/", { method: "POST", body: b }),
  publishExam: (id) => request(`/exams/${id}/publish/`, { method: "POST" }),
  startExam: (id) => request(`/exams/${id}/start/`, { method: "POST" }),
  attempt: (id) => request(`/attempts/${id}/`),
  saveAnswer: (id, question_id, answer) => request(`/attempts/${id}/answers/`, { method: "PATCH", body: { question_id, answer } }),
  submit: (id) => request(`/attempts/${id}/submit/`, { method: "POST" }),
  results: () => request("/results/"),
};

/**
 * Answer-key / student-answer JSON contract (the backend grades by exact equality of the two objects):
 *   MCQ, TRUE_FALSE : { "correct_option": "B" }            (option label)
 *   MULTI_SELECT    : { "correct_options": ["A", "C"] }    (labels, sorted)
 * The student's saved answer uses the same keys, so labels are what travel — never shuffled positions.
 * SHORT_ANSWER / DESCRIPTIVE are not auto-graded; students send { "text": "..." }.
 */
export const OBJECTIVE = ["MCQ", "TRUE_FALSE", "MULTI_SELECT"];
export function buildAnswer(type, labels) {
  const sorted = [...labels].sort();
  return type === "MULTI_SELECT" ? { correct_options: sorted } : { correct_option: sorted[0] };
}
export function readLabels(type, answer) {
  if (!answer) return [];
  return type === "MULTI_SELECT" ? answer.correct_options ?? [] : answer.correct_option ? [answer.correct_option] : [];
}
