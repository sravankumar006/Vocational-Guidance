# Vocational Guidance Platform

A full-stack, modular platform designed to connect students with verified vocational pathways while addressing parental concerns regarding career progression, earnings, and job security.

---

## Project Structure

```text
/
├── frontend/    # React + Vite + TypeScript + Tailwind CSS
├── backend/     # FastAPI + SQLAlchemy 2.0 + Alembic + Pydantic v2
│   └── data/    # Raw and processed vocational reference datasets
├── .env.example # Centralized environment configuration template
└── report.md    # Incremental progress report
```

---

## Getting Started

### 1. Environment Configuration
Copy the template to create your local `.env`:
```bash
cp .env.example .env
```
*(Never commit `.env` containing personal credentials).*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Accessible at: `http://localhost:5173`

### 3. Backend Setup
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```
API Documentation: `http://localhost:8000/api/docs`  
Health Check: `http://localhost:8000/api/health`

### Render PostgreSQL Deployment

Set Render's PostgreSQL connection in the backend service environment as `DATABASE_URL`. Do not commit the value. Also set a strong `AUTH_SECRET_KEY`; `CORS_ORIGINS` may be set to the Vercel URL as a comma-separated value if it differs from the default.

Use these Render service commands from the repository root:

```bash
# Build Command
pip install -r backend/requirements.txt

# Start Command
cd backend && alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT
```

After the service is deployed and `DATABASE_URL` is available, run the existing idempotent dataset importer once from the repository root (for example, in a Render shell):

```bash
python backend/scripts/import_dataset.py --csv-path backend/data/raw/database.csv
```

The importer reads `backend/data/raw/database.csv`, preserves existing records, and commits the career, course, provider, occupation, career-path, and job-outcome data in one transaction. Run `alembic upgrade head` before importing; the importer intentionally does not create schema. Local development continues to use `sqlite:///./sih.db` when `DATABASE_URL` is not set.

---

## Git Collaboration Guidelines
- The main branch is `main`.
- Create feature branches for new work (`feature/your-module`).
- All models, routers, and client services follow the decoupled architectures established in Phase 0.
- Secrets (`.env`, credentials) and local environments (`.venv`, `node_modules`) are strictly ignored.
