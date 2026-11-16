# Secure Online Examination Backend (MVP)

Django REST Framework backend starter for a secure online examination platform.

## Included
- UUID-based user accounts with STUDENT / ADMIN / SUPERADMIN roles
- Student self-registration and JWT login
- Subject management
- Question bank with MCQ / multi-select / true-false / descriptive types
- Admin question creation and approval
- Encrypted answer keys (Fernet; no answer-key read endpoint)
- Exam creation, publication, scheduling and question selection
- Student exam start, randomized question order, answer autosave and submission
- Automatic objective evaluation and results
- PDF upload endpoint and text extraction using PyMuPDF

## Important scope
This is a runnable MVP foundation, not a certified proctoring product. Safe Exam Browser integration, production tenant isolation, advanced OCR for scanned PDFs, AI descriptive grading, rate limiting, monitoring, deployment hardening and formal security review still need implementation before real examinations.

## Setup (Windows PowerShell)
```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```
Generate secrets:
```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```
Put generated values in `.env`. Create a MySQL database matching DB_NAME, then:
```powershell
python manage.py makemigrations accounts subjects question_bank security examinations evaluation
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## API prefix
`/api/v1/`

- `POST /accounts/register/` student registration
- `POST /accounts/token/` JWT login
- `POST /accounts/token/refresh/`
- `GET,POST /subjects/`
- `GET,POST /questions/`
- `POST /questions/<uuid>/approve/`
- `POST /questions/<uuid>/answer-key/` admin creates/replaces encrypted key
- `POST /papers/upload/` admin uploads PDF and extracts text
- `GET,POST /exams/` admin list/create
- `POST /exams/<uuid>/publish/`
- `GET /exams/available/` student exam list
- `POST /exams/<uuid>/start/`
- `GET /attempts/<uuid>/` returns attempt questions (never correct answers)
- `PATCH /attempts/<uuid>/answers/` saves an answer
- `POST /attempts/<uuid>/submit/`
- `GET /results/` student sees own results; admin sees results

Use `Authorization: Bearer <access_token>`.

## First admin
Register a student normally, then promote an account to ADMIN using Django admin or Django shell. Public registration deliberately cannot choose privileged roles.
