# GEMINI.md

## Project Overview
UniTasker is a full-stack task and activity planner designed for students (Project Integrador I). It allows users to manage academic activities, track tasks, and monitor progress.

### Architecture
- **Backend:** Django 6.0.2 with Django Rest Framework (DRF).
- **Frontend:**
  - `frontend/`: React 19 application.
- **Database:** PostgreSQL (via `psycopg2-binary`).

---

## Building and Running

### Backend Setup
1. **Navigate to backend:** `cd backend`
2. **Environment:**
   - Create a virtual environment: `python -m venv venv`
   - Activate it: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
   - Copy env: `cp .env.example .env`
3. **Install Dependencies:** `pip install -r requirements.txt`
4. **Database:** `python manage.py migrate`
5. **Run Server:** `python manage.py runserver`
   - API available at `http://127.0.0.1:8000/api/`

### Frontend Setup (`frontend/`)
1. **Navigate:** `cd frontend`
2. **Install:** `npm install`
3. **Run:** `npm start` (Configure build tool before running)

---

## Development Conventions

### Coding Standards
- **Backend Styling:** Adhere to `black` formatting and `flake8` linting.
  - Run before PR: `black . && flake8 .`
- **Frontend Styling:** Uses Tailwind CSS. `frontendv1` uses Radix UI components (Shadcn UI style).

### Git & Collaboration
- **Branch Naming:** `type/<ID-JIRA>-description`
  - Types: `feature`, `fix`, `hotfix`, `chore`, `refactor`.
- **Pull Requests:**
  - Title format: `type: brief description` (e.g., `feature: create Task model`).
  - Always merge into `develop`. `main` is for production-ready releases.

### Key Directories
- `backend/planner/`: Core logic for activities and tasks.
- `backend/usuarios/`: Custom user model and authentication.
- `frontendv1/components/`: Reusable UI components for the dashboard.

---

## Testing Strategy
- **Backend:** Uses Django's `TestCase`. Tests are currently located in `backend/planner/tests.py` and `backend/usuarios/tests.py` (TODO: Implementation needed).
- **Run Tests:** `python manage.py test` (from `backend/` directory).
