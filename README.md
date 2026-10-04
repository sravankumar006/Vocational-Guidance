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

---

## Git Collaboration Guidelines
- The main branch is `main`.
- Create feature branches for new work (`feature/your-module`).
- All models, routers, and client services follow the decoupled architectures established in Phase 0.
- Secrets (`.env`, credentials) and local environments (`.venv`, `node_modules`) are strictly ignored.
