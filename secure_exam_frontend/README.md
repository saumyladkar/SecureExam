# Secure Exam — Frontend

React 18 + Vite + React Router. Talks to the Django backend in `secure_exam_backend`.

## Run
```bash
npm install
cp .env.example .env      # set VITE_API_URL if the API isn't at http://127.0.0.1:8000/api/v1
npm run dev               # http://localhost:5173  (matches the backend's CORS FRONTEND_URL)
```
Start the backend first (`python manage.py runserver`). Promote one account to ADMIN via Django admin/shell to see the admin screens.

## Screens
**Student:** register / sign in · available exams · full-screen exam runner (countdown from server `expires_at`, autosave per answer, question palette, flag for review, auto-submit at 0, tab-leave warning, resume after refresh) · results.
**Admin:** exams (create, pick questions, publish) · question bank (create → auto-approve → encrypted answer key; replace key later) · subjects · PDF import (text extraction) · all results.

## Answer contract (important)
The backend grades by exact equality between the stored answer key and the student's saved answer, so both use the same JSON:
- MCQ / TRUE_FALSE: `{"correct_option": "B"}` (option **label**)
- MULTI_SELECT: `{"correct_options": ["A","C"]}` (sorted labels)
- SHORT_ANSWER / DESCRIPTIVE: `{"text": "..."}` — not auto-graded

If you change this shape, change `buildAnswer`/`readLabels` in `src/api.js`.

## Known backend gaps the UI works around
- Login is `/token/` (README says `/accounts/token/`); student exam list is `GET /exams/` (no `/exams/available/`).
- `GET /attempts/<id>/` doesn't return saved answers, so answers are mirrored in localStorage for resume.
- There's no "list my attempts" endpoint, so the active attempt id is remembered in localStorage.
- Client-side anti-cheat (copy/paste block, tab-leave counter) is deterrence only; the server doesn't record it.
