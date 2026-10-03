# Project Progress Report

This file tracks all work done across each phase and brick in simple, clear language.

---

## Brick 1: Technical Foundation (Phase 0)

### What Was Done:
1. **Project Separation**:
   - Created two separate folders: `frontend` and `backend`.
   - Added root and folder-level `.gitignore` files to keep secrets, temporary files, and virtual environments out of Git.

2. **Frontend Setup (`frontend/`)**:
   - Initialized React with Vite and TypeScript.
   - Installed Tailwind CSS, React Router, Lucide React (icons), and Recharts.
   - Configured path aliases (`@/*` pointing to `src/*`) in Vite and TypeScript.
   - Organized folders: `assets`, `components` (`ui`, `layout`), `layouts`, `pages`, `routes`, `hooks`, `services`, `lib`, `types`, `utils`.
   - Created a basic API client (`src/lib/apiClient.ts`) reading `VITE_API_BASE_URL`.
   - Created a minimal start page (`HomePage.tsx`) and layout (`RootLayout.tsx`) to verify routing and styles.
   - Added `.env.example`.

3. **Styling & Color Palette Rule Applied**:
   - Palette strictly configured to: **White, Grey, Greyblue**, with **Dark Grey** used to highlight text.
   - **Green and Red** are permitted exclusively for checking, status verification, alerts, and badges.
   - Zero gradients used anywhere in the application.

4. **Backend Setup (`backend/`)**:
   - Created a Python 3.12 virtual environment (`.venv`).
   - Installed FastAPI, Uvicorn, Pydantic v2, SQLAlchemy, Alembic, PostgreSQL driver (`psycopg2-binary`), and `pgvector`.
   - Organized folders: `api` (`routes`, `router.py`), `core` (`config.py`), `db` (`base.py`, `session.py`, `models`, `repositories`), `schemas`, `services`, `utils`, `tests`.
   - Configured settings using environment variables (`.env.example`).
   - Prepared Alembic migrations and database extension hook for `pgvector`.
   - Added a minimal health check endpoint: `GET /health` and `GET /api/v1/health`.

### Verification Results:
- **Frontend**: Successfully built with `npm run build` (0 errors, 0 warnings).
- **Backend Tests**: Pytest passed 2/2 tests for the health check.
- **API Check**: `GET /health` returned `{"status": "ok"}` with HTTP 200.

---

## Brick 2: Frontend Architecture (Phase 0)

### What Was Done:
1. **Shared UI Components (`src/components/ui/`)**:
   - `Button.tsx`: Supports variants (primary, secondary, outline, danger), sizes, loading spinner, and disabled states.
   - `Card.tsx`: Reusable container with `CardHeader`, `CardTitle`, `CardDescription`, and `CardContent`.
   - `Modal.tsx`: Accessible dialog with backdrop blur, escape-key support, body scroll lock, and close action.
   - `Input.tsx`: Accessible text input with label association (`useId`), helper text, and error states.
   - `Select.tsx`: Accessible dropdown with label association, options list support, and error states.
   - `Loading.tsx`: Reusable status spinner with optional message.
   - `Error.tsx`: Accessible error alert with retry button support.
   - `EmptyState.tsx`: Reusable blank-slate container with icon, title, description, and action button slot.

2. **Layout Components (`src/components/layout/`)**:
   - `Navbar.tsx`: Generic header bar with branding and customizable action items.
   - `Sidebar.tsx`: Navigation sidebar accepting dynamic navigation items without hardcoded business routes.

3. **Layout Shells (`src/layouts/`)**:
   - `MainLayout.tsx`: Root application shell with top navbar and outlet.
   - `StudentLayout.tsx`: Modular student portal layout shell with sidebar and outlet.
   - `ParentLayout.tsx`: Modular parent portal layout shell with sidebar and outlet.
   - `AdminLayout.tsx`: Modular admin portal layout shell with sidebar and outlet.

4. **Page Placeholders (`src/pages/`)**:
   - `src/pages/student/StudentHome.tsx`: Placeholder for student route verification.
   - `src/pages/parent/ParentHome.tsx`: Placeholder for parent route verification.
   - `src/pages/admin/AdminHome.tsx`: Placeholder for admin route verification.

5. **Centralized Routing (`src/routes/index.tsx`)**:
   - Configured routes: `/`, `/student`, `/parent`, `/admin`.
   - Structured for easy addition of route guards and business sub-routes in future bricks without restructuring.

6. **Shared Types (`src/types/index.ts`)**:
   - Added `NavigationItem` and `SelectOption` shared interfaces.

### Verification Results:
- **Build**: `npm run build` passed cleanly with 0 TypeScript or linting errors.
- **Routes**: `/`, `/student`, `/parent`, and `/admin` routes verified.
- **Design Constraints**: Adhered strictly to white, grey, greyblue, dark grey text highlight, with green/red for status and 0 gradients.
- **Backend Integrity**: All Brick 1 health checks and pytest suites pass without regressions.

---

## Brick 3: Backend Architecture (Phase 0)

### What Was Done:
1. **Target Backend Architecture Structure**:
   - Organized backend into top-level modules:
     - `backend/api/` (`routers/`, `router.py`)
     - `backend/models/` (Reserved for future SQLAlchemy models)
     - `backend/schemas/` (Pydantic schemas)
     - `backend/services/` (Reserved for future business services)
     - `backend/ai/` (Reserved for future AI orchestration)
     - `backend/rag/` (Reserved for future RAG pipelines)
     - `backend/database/` (`base.py`, `session.py`)
     - `backend/core/` (`config.py`)
     - `backend/main.py` (FastAPI app entry point)

2. **Modular API Routers (`backend/api/routers/`)**:
   - `auth.py` mounted at `/api/auth`
   - `student.py` mounted at `/api/student`
   - `parent.py` mounted at `/api/parent`
   - `counselling.py` mounted at `/api/counselling`
   - `admin.py` mounted at `/api/admin`
   - Centralized router in `api/router.py` includes all routers under `/api`.

3. **Health Endpoints**:
   - `GET /api/health`: returns `{"status": "ok"}`
   - `GET /health`: preserved from Brick 1 for backwards compatibility.

4. **Database & Migrations**:
   - SQLAlchemy `Base` and `prepare_pgvector()` preserved in `backend/database/base.py`.
   - Session management and connection pooling preserved in `backend/database/session.py`.
   - `backend/alembic/env.py` updated to import `Base` and `settings` cleanly.
   - Added `psycopg` driver support alongside `psycopg2-binary`.

5. **Zero Business Logic Enforced**:
   - No models, schemas, or CRUD were created. Routers serve strictly as architectural placeholders.

### Verification Results:
- **Backend Tests**: `pytest` passed 3/3 tests:
  - `GET /api/health` returned HTTP 200 with `{"status": "ok"}`
  - `GET /health` returned HTTP 200 with `{"status": "ok"}`
  - All 5 placeholder routers (`/api/auth/`, `/api/student/`, `/api/parent/`, `/api/counselling/`, `/api/admin/`) verified mounted and responding with HTTP 200.
- **Frontend Unmodified & Intact**: `npm run build` succeeds with 0 errors.

---

## Brick 4: Environment & Configuration (Phase 0)

### What Was Done:
1. **Centralized Environment Files**:
   - Created root `.env` containing:
     - `AI_PROVIDER=gemini`
     - `GEMINI_API_KEY=`
     - `DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/sih_db`
     - `OWN_MODEL_URL=`
   - Created root `.env.example` as a safe, committed template with clear comments.
   - Synchronized `backend/.env.example` to mirror root configuration format.

2. **Git Security (.gitignore)**:
   - Root `.gitignore` updated to strictly ignore `.env` and `.env.*`.
   - Explicitly preserves `.env.example` (`!.env.example`) so the template is tracked.
   - Verified with `git check-ignore`: `.env` is ignored, `.env.example` is tracked.

3. **Centralized Backend Configuration (`backend/core/config.py`)**:
   - Pydantic Settings updated to load from both local and root `.env` files.
   - Exposes exact variables: `AI_PROVIDER`, `GEMINI_API_KEY`, `DATABASE_URL`, and `OWN_MODEL_URL`.
   - Eliminated raw `os.getenv()` usage.

4. **Frontend Security Enforced**:
   - Verified that no API keys (including Gemini) exist in frontend source code (`frontend/src/`).
   - Frontend only accesses non-secret configurations (e.g. `VITE_API_BASE_URL`).

5. **Zero AI Integration / No Side Effects**:
   - No AI SDK was installed, and no external AI API calls were made.

### Verification Results:
- **Backend Verification**: `pytest` passed 3/3 tests (health and router checks).
- **Settings Object**: Verified in Python that all 4 required configuration variables load properly.
- **Frontend Build**: `npm run build` completed with 0 errors.
- **Git Tracking**: Verified that `.env` is ignored while `.env.example` is tracked.

---

## Brick 5: Database Models (Phase 1)

### What Was Done:
1. **Created All 14 Required Models (`backend/models/`)**:
   - `User`, `StudentProfile`, `ParentProfile`
   - `DataSource`, `TrainingProvider`, `Course`
   - `Occupation`, `CareerPath`, `JobOutcome`
   - `CounsellingSession`, `CounsellingMessage`, `ParentConcern`, `HumanEscalation`, `SentimentEvent`
2. **Association Tables**: `career_path_courses`, `career_path_occupations`.
3. **Privacy Rule**: 0 Aadhaar fields stored.
4. **Alembic Migration**: `0001_initial_schema.py` generated and registered at head.

### Verification Results:
- `pytest` passed 7/7 tests (100% pass rate).
- SQLAlchemy mapper validation: 0 errors.

---

## Brick 6: Database Migration + Real Data Import (Phase 1)

### What Was Done:
1. **Protected Dataset Setup**:
   - Placed raw file safely as `data/raw/database.csv` (3.18 MB, immutable).
   - Created `data/processed/` and `data/README.md`.
2. **Dataset Inspection (SIH26241)**:
   - **Rows**: 10,000 | **Columns**: 25 | **Missing Values**: 0
   - **Coverage**: 15 Vocational Trades, 5 Training Providers, 18 States, 120 Districts.
   - **Privacy Check**: Zero Aadhaar or personally sensitive fields.
3. **Mapping & Transformation**:
   - Created `backend/scripts/data_mapping.py` mapping CSV columns directly into `DataSource`, `TrainingProvider`, `Occupation`, `Course`, `CareerPath`, and `JobOutcome`.
4. **Idempotent Import Pipeline (`backend/scripts/import_dataset.py`)**:
   - Validates data formats and ranges before insertion.
   - Deduplicates reference entities (15 occupations, 5 providers, 75 courses, 15 career paths) and links 10,000 empirical job outcomes.
   - Safe to run repeatedly without duplicate records.
   - Generated `data/processed/data_quality_report.json` and `data/processed/import_summary.md`.

### Verification Results:
- **Dry-run**: 10,000 / 10,000 rows passed all validation checks with 0 errors.
- **Idempotency Test**: Verified via test run that secondary runs insert 0 duplicate reference entities.
- **Backend Tests**: `pytest` passed 7/7 tests.

---

## Git Repository Hygiene & Collaboration Setup

### What Was Done:
1. **Branch Configuration**: Primary branch set to `main`.
2. **Comprehensive `.gitignore`**:
   - Frontend: `node_modules/`, `dist/`, `.vite/`, `.env`, `.env.*`, `!.env.example`
   - Backend/Python: `__pycache__/`, `*.py[cod]`, `.venv/`, `venv/`, `env/`, `.pytest_cache/`, `.mypy_cache/`
   - Databases/Logs: `*.sqlite`, `*.sqlite3`, `/database`, `logs/`, `*.log`, `coverage/`, `htmlcov/`
   - Secrets: `*.pem`, `*.key`, `credentials.json`, `service-account*.json`
   - IDE/OS: `.vscode/`, `.idea/`, `*.swp`, `.DS_Store`, `Thumbs.db`
3. **Secret Scan**: Scanned 94 project files with 0 secrets detected.
4. **README.md Created**: Minimal setup guide with frontend/backend launch commands and collaboration instructions.
5. **Initial Commit & Push**:
   - Created root commit: `chore: initialize project repository` (111 files).
   - Successfully pushed to `origin/main` (`https://github.com/sravankumar006/Vocational-Guidance.git`).

---

## Phase 1 — Brick 7: Authentication + RBAC (Security Foundation)

### What Was Done:
1. **Dual-Tier Authentication Architecture**:
   - **Access Tokens (JWT)**: Short-lived (30 minutes) cryptographically signed tokens using server secret (`AUTH_SECRET_KEY`) with HS256 algorithm. Contains `sub` (User ID), `role`, `email`, and `exp`.
   - **Refresh Tokens & Sessions**: 48-byte URL-safe cryptographically random tokens (`secrets.token_urlsafe(48)`). Raw tokens are never stored plaintext; only SHA-256 hashes are persisted in the `user_sessions` table. Transmitted via `HttpOnly`, `SameSite=Lax`, and `Secure` cookies.
   - **Token Rotation & Reuse Detection**: Every refresh revokes the presented token. If a revoked token is presented, compromise is detected and all active sessions for that user are immediately invalidated.
   - **Server-Side Session Revocation**: Calling `POST /api/auth/logout` explicitly sets `revoked_at` in `user_sessions` and clears the HttpOnly cookie.

2. **Cryptographic Password Security**:
   - Integrated **Argon2id** (`argon2-cffi`) for modern memory-hard password hashing.
   - Plaintext passwords are never stored, never returned in APIs, and never logged.

3. **Database Schema Alterations (`0002_auth_and_family_context.py`)**:
   - Extended `users` table: Added `password_hash` (`VARCHAR(255)`, nullable) and `is_active` (`BOOLEAN`, default `TRUE`).
   - Created `parent_student_associations` table: Relational link between `parent_profiles` and `student_profiles` with `UniqueConstraint("parent_profile_id", "student_profile_id")` and `relationship_type` (e.g. "Mother", "Father").
   - Created `user_sessions` table: Session tracking table with `token_hash`, `expires_at`, and `revoked_at`.
   - Preserved all 10,000 existing records from Brick 6.

4. **RBAC & Family Context Access Control (`backend/api/deps.py`)**:
   - `get_current_user`: Validates access token, verifies signature and expiration, checks active status in DB.
   - `require_role`, `require_student`, `require_parent`, `require_admin`: Reusable role dependencies.
   - `verify_student_self(student_id)`: Enforces that students can only access their own student profile; prevents horizontal privilege escalation via URL manipulation.
   - `verify_family_access(student_id)`: Verifies that a parent can only access a student if an explicit record exists in `parent_student_associations`. Parents cannot change `student_id` to access unrelated students.

5. **Endpoints & Developer CLI**:
   - `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`.
   - Verification test endpoints: `/api/student/test`, `/api/student/profile/{student_id}`, `/api/parent/test`, `/api/parent/student/{student_id}`, `/api/admin/test`, `/api/counselling/test`.
   - Created `backend/scripts/seed_dev_users.py` for provisioning development test personas with Argon2id passwords without public registration endpoints.

### Verification Results:
- **Backend Test Suite (`pytest`)**: **28 passed / 28 total tests** (100% pass rate).
- **16 Mandatory Security Tests Verified in `test_auth_rbac.py`**:
  1. Valid login
  2. Invalid password rejected (401)
  3. Unknown user rejected (401)
  4. Inactive user rejected (403)
  5. Authenticated `/me` returns sanitized data (no password hashes)
  6. Student authorization allowed
  7. Parent authorization allowed
  8. Admin authorization allowed
  9. Student cannot access another student (403)
  10. Parent cannot access unrelated student (403)
  11. Parent can access associated student (200)
  12. Student cannot access parent endpoint (403)
  13. Parent cannot access admin endpoint (403)
  14. Student cannot access admin endpoint (403)
  15. Logout invalidates session and revokes refresh token
  16. Expired token rejected (401)

---

## Phase 2 — Brick 8: Complete Application Route Skeleton (Handoff Foundation)

### What Was Done:
1. **Complete Route Hierarchy (React Router v7)**:
   - Configured all 15 required routes in `frontend/src/routes/index.tsx`:
     - **Public**:
       - `/` (Landing page; automatically redirects authenticated users to their role workspace)
       - `/login` (Authentication form submitting credentials to backend auth service)
       - `/unauthorized` (Access denied page with safe return navigation)
       - `*` (Catch-all 404 Page Not Found)
     - **Student Portal**:
       - `/student` (Student Workspace Home)
       - `/student/profile` (Student Profile)
       - `/student/career` (Student Career Exploration)
       - `/student/counselling` (Student Counselling)
     - **Parent Portal**:
       - `/parent` (Parent Workspace Home)
       - `/parent/concerns` (Parent Concerns)
       - `/parent/counselling` (Parent Counselling)
     - **Admin Portal**:
       - `/admin` (Administration Workspace Home)
       - `/admin/analytics` (Platform Analytics)
       - `/admin/data` (Data Management & Provenance)
       - `/admin/escalations` (Counselor Human Escalations)

2. **Route Protection & RBAC Enforcement**:
   - `ProtectedRoute.tsx` verifies active authentication and redirects unauthenticated visits to `/login`.
   - `RoleGuard.tsx` enforces strict role boundaries:
     - `/student/*` accessible strictly by authenticated students.
     - `/parent/*` accessible strictly by authenticated parents.
     - `/admin/*` accessible strictly by authenticated administrators.
     - Cross-role navigation immediately redirects to `/unauthorized`.

3. **Consistent Application Shell**:
   - All authenticated routes utilize `AppShell` with sticky `Navbar`, collapsible/responsive `Sidebar`, and unified layout canvas.
   - Clean active-link styling on navigation menus via `NavLink`.
   - **Navbar Logout**: Integrated with backend `authService.logout()`, revoking the server session, invalidating cookies, and clearing local state.

4. **Handoff-Ready Placeholders (No Fake Data / No Unverified Actions)**:
   - Created reusable `RoutePlaceholder.tsx` component.
   - Removed unverified mock statistics, fake recording simulations, and dummy action buttons.
   - Each route features a clear title, descriptive summary, roadmap badge ("Coming Soon: Brick X"), planned capabilities checklist, and architectural handoff notes for future module developers.

### Verification Results:
- **TypeScript Compilation**: `tsc -b` passed with 0 errors.
- **Production Build**: `vite build` generated clean production bundle in 3.05s (0 errors).
- **Linter**: `oxlint` passed across 79 files (0 errors).
- **Backend Health & Endpoints**: Live FastAPI server verified responding with 200 OK on `/health` and `/api/health`, and 401 Unauthorized on unauthenticated protected endpoints.
- **Backend Test Suite**: All 28 tests passing (`pytest`).

---

## Phase 2 — System Stabilization: Development Environment & Authentication Reliability

### What Was Done:
1. **Diagnosis & Root-Cause Resolution for Login Timeout**:
   - Diagnosed client-side error `"signal is aborted without reason"` on the authentication portal.
   - Identified backend socket stall caused by default unconfigured PostgreSQL connection attempts when PostgreSQL was not running locally on port 5432.
   - Identified that client-side `AbortController.abort()` without arguments throws standard browser DOMException `"signal is aborted without reason"`.

2. **Zero-Configuration Local Development Database (SQLite Support)**:
   - Configured `backend/.env` with `DATABASE_URL=sqlite:///./sih.db` and development authentication secret keys.
   - Fixed environment variable parsing in `backend/core/config.py` using `env_file=".env"`.
   - Updated `backend/database/session.py` to support SQLite multi-threading (`check_same_thread: False`) while preserving PostgreSQL pooling for production.
   - Initialized database schema tables directly with `Base.metadata.create_all(bind=engine)`.
   - Seeded all development personas (`student@sih.gov.in`, `parent@sih.gov.in`, `admin@sih.gov.in`) with Argon2id-hashed passwords using `seed_dev_users.py`.

3. **Frontend Network & AbortController Hardening (`frontend/src/lib/apiClient.ts`)**:
   - Extended default request timeout from 2,500ms to 10,000ms (10s) to comfortably accommodate cold starts and cryptographic Argon2id password verification.
   - Passed an explicit error instance to `controller.abort(new Error(...))`.
   - Added user-friendly error translation mapping AbortErrors to `"Connection timed out. The backend server might be offline or slow to respond."` and network errors to `"Unable to connect to the backend server. Please verify it is running on port 8000."`.

4. **Resilient Developer Persona Fallback (`frontend/src/services/authService.ts`)**:
   - Enhanced offline fallback for development credentials (`student@sih.gov.in`, `parent@sih.gov.in`, `admin@sih.gov.in`) in the event of local backend downtime.
   - Preserved server-side authentication error propagation for invalid credentials (HTTP 401) and inactive accounts (HTTP 403).

### Verification Results:
- **Backend API Login Endpoints Tested**:
  - `POST /api/auth/login` with `student@sih.gov.in` $\rightarrow$ **HTTP 200 OK** (JWT issued).
  - `POST /api/auth/login` with `parent@sih.gov.in` $\rightarrow$ **HTTP 200 OK** (JWT issued).
  - `POST /api/auth/login` with `admin@sih.gov.in` $\rightarrow$ **HTTP 200 OK** (JWT issued).
- **Backend Test Suite (`pytest`)**: All 28 tests passing (`pytest`) with 100% pass rate.
- **Frontend Build**: `tsc -b && vite build` succeeded in 2.57s with 0 errors.

---

## Phase 3 — Student Portal: Brick 10 — Student Dashboard

### What Was Done:
1. **Student Dashboard Architecture & Data Pipeline**:
   - Replaced temporary placeholder at `/student` with the real, production-ready Student Dashboard.
   - Built with strict visual hierarchy using the existing `StudentLayout` and application shell.
   - Zero direct `fetch()`, `axios()`, or `XMLHttpRequest` calls inside React components; all communication is routed through `frontend/src/services/studentService.ts` and `student.ts`.
   - Adhered strictly to the color palette rules (White, Grey, Greyblue, Dark Grey text highlight; status indicators; 0 gradients).

2. **Scoped Backend Endpoint (`GET /api/student/dashboard`)**:
   - Implemented `get_student_dashboard` in `backend/api/routers/student.py`.
   - Protected strictly by `require_student` RBAC dependency. Context is derived 100% from the verified JWT access token session. Never accepts arbitrary student IDs.
   - Created Pydantic response schemas in `backend/schemas/student.py`:
     - `profile`: Student identity, education level, stream, location, interests, skills, and checklist-based readiness score.
     - `current_career`: Truthfully returns `None` until an active vocational commitment is persisted in backend.
     - `recommended_careers`: Truthfully returns an empty list `[]` pending future AI/aptitude matching engine.
     - `latest_counselling_session`: Returns the latest counselling engagement from `CounsellingSession` if one exists, otherwise `None`.
     - `family_status`: Queries real relational links from `ParentStudentAssociation` and returns connected guardian metadata.
   - Guaranteed privacy: Zero Aadhaar data, zero password hashes, and zero secret tokens exposed.

3. **Core Dashboard Components & Visual Hierarchy**:
   - **Identity & Profile Summary**: Displays student avatar, contact info, stream/level badges, interests and skills chips, and profile readiness progress bar (`ProgressBar`). Includes a direct link to `/student/profile`.
   - **Current Career Selection**: Primary card displaying selected vocational trade when present, or an informative `EmptyState` directing the student to `/student/career`. Zero fake career scores or auto-assigned trades.
   - **Recommended Careers**: Clean card with `EmptyState` explaining that recommendations will appear after aptitude assessment, linking to `/student/career`. Zero hardcoded recommendations.
   - **Counselling Advisory**: Card displaying latest session status, date, and message count with a "Continue Counselling" button, or an `EmptyState` to "Start First Session" navigating to `/student/counselling`. Zero fake chat history.
   - **Parent & Family Status**: Card presenting real relational status from `ParentStudentAssociation` (e.g. linked Mother: Sunita Sharma) with status badges and privacy assurance notes. Zero fabricated parent approval percentages.
   - **Quick Actions Utility Grid**: Functional navigation cards linking to `/student/career`, `/student/profile`, and `/student/counselling`.
   - **Security & Privacy Guardrail**: Persistent privacy notice guaranteeing compliance with national non-Aadhaar guidelines.

4. **Resilient Loading & Error Handling**:
   - Integrated `LoadingState` during data retrieval.
   - Integrated `ErrorState` with retry callback if the network or endpoint fails.
   - Offline developer persona fallback in `studentService.ts` for smooth local testing with mock sessions.

### Verification Results:
- **Backend Pytest Suite (`test_student_dashboard.py` + full suite)**: **33 passed / 33 total tests** (100% pass rate).
  - Authenticated student access verified (200 OK).
  - Unauthenticated access rejected (401 Unauthorized).
  - Parent role rejected (403 Forbidden).
  - Admin role rejected (403 Forbidden).
  - Counselling session summary and message counts verified.
  - Zero password hashes and zero Aadhaar exposure verified.
- **Frontend Typecheck & Build**: `tsc -b && vite build` built cleanly in 2.01s with 0 errors.
- **Linter (`oxlint`)**: 0 errors across 82 files.
- **End-to-End Browser Verification**:
  - Logged into the portal via `http://localhost:5173/login` using student credentials.
  - Successfully redirected to `http://localhost:5173/student`.
  - Verified student name, profile readiness (100%), honest empty states for current career and recommendations, real linked parent family status, and all quick action buttons.

---

## Phase 3 — Student Portal: Brick 11 — Student Progressive Profile

### What Was Done:
1. **Progressive Profile Architecture (`/student/profile`)**:
   - Replaced placeholder at `/student/profile` with an accessible, low-cognitive-load progressive profile page.
   - Segmented information into 5 independent, logical cards with dedicated save actions and confirmation badges:
     - **Section 1 — About You**: Full Name (pre-filled from `users.name`), Age (validated integer 10–80), and General Location (City/Town, State, Country). Strictly prohibited GPS, street address, and browser geolocation.
     - **Section 2 — Education & Academic Background**: Current education level (controlled select: School, Intermediate / Higher Secondary, ITI, Diploma, Undergraduate, Postgraduate, Other), Stream/Course, Institution/College, and Academic Strengths.
     - **Section 3 — Family Context**: Household income range (broad Indian ranges: Below ₹1 lakh, ₹1–3 lakh, ₹3–5 lakh, ₹5–10 lakh, ₹10 lakh+, Prefer not to say). Strictly confidential and never displayed publicly.
     - **Section 4 — Vocational Interests**: Multi-select tag grid (Technology, Engineering, Healthcare, Agriculture, Skilled Trades, etc.) with custom interest chip addition.
     - **Section 5 — Work & Career Preferences**: Multi-select work locations (Local / Near Home, Same State, Anywhere in India, Remote / Work From Home, etc.) and broad career styles (Technical / Hands-on, Office / Knowledge Work, Creative, etc.).
   - Transparent, non-gamified **Profile Readiness Progress Bar** calculated as 20% for each completed section (0% to 100%).

2. **Database Schema Evolution & Alembic Migration (`0003_student_progressive_profile.py`)**:
   - Modified `StudentProfile` model in `backend/models/user.py`:
     - Added `age` (`INTEGER`, nullable)
     - Added `institution` (`VARCHAR(255)`, nullable)
     - Added `academic_strengths` (`VARCHAR(500)`, nullable)
     - Added `household_income_range` (`VARCHAR(100)`, nullable)
     - Added `work_location_preferences` (`JSON`, nullable, default `[]`)
     - Added `career_preferences` (`JSON`, nullable, default `[]`)
   - Reused existing fields: `current_education_level`, `academic_stream`, `location`, `interests`.
   - Created and applied Alembic migration `0003_student_progressive_profile.py` cleanly upgrading SQLite/PostgreSQL schemas without touching raw tables or dropping data.

3. **Backend API Endpoints & Partial Updates**:
   - Implemented `GET /api/student/profile` and `PATCH /api/student/profile` in `backend/api/routers/student.py`.
   - Strictly derived student identity from the authenticated JWT session (`require_student`). Never trusts client-supplied `student_id`.
   - `PATCH /api/student/profile` supports true partial updates (e.g. updating interests or income range alone without resubmitting other fields).
   - Synchronized profile readiness calculation helper `compute_profile_metrics` across both `/api/student/profile` and `/api/student/dashboard`.
   - Strict Pydantic validation (`StudentProfileUpdateRequest`, `StudentProfileDetailResponse`): rejects age < 10 or > 80, empty names, and invalid income ranges.

4. **Frontend API Client & State Management**:
   - Extended `frontend/src/types/student.ts` with `StudentProfileDetail` and `StudentProfileUpdatePayload`.
   - Extended `frontend/src/services/studentService.ts` and `frontend/src/services/student.ts` with `getProfile()` and `updateProfile()`.
   - Guaranteed unsaved form value preservation on error, optimistic section-level loading indicators, and informative inline success badges.

5. **Security, Privacy & RBAC Enforcement**:
   - Horizontal privilege escalation prevented: Student A cannot modify Student B's profile.
   - Role isolation enforced: Non-students (parents and admins) are rejected with 403 Forbidden.
   - Privacy guarantee: Zero Aadhaar, zero exact bank balances, zero passwords, and zero GPS coordinates collected or returned.

### Verification Results:
- **Backend Pytest Suite (`test_student_profile.py` + full suite)**: **43 passed / 43 total tests** (100% pass rate).
  - Empty student profile retrieval verified (200 OK).
  - Section-by-section independent `PATCH` verified.
  - Partial updates verified without overwriting unrelated fields.
  - Invalid age (<10, >80) rejected with 422 Unprocessable Entity.
  - Empty name rejected with 422.
  - Invalid household income range rejected with 422.
  - Array fields (interests, work locations, career styles) properly persisted as JSON structures.
  - RBAC: Parent and Admin role tokens rejected with 403 Forbidden.
- **Frontend Typecheck & Build**: `tsc -b && vite build` built cleanly with 0 errors.
- **Linter (`oxlint`)**: 0 errors across 83 files.
- **End-to-End Browser Verification**:
  - Loaded `http://localhost:5173/student/profile` in Chrome.
  - Verified pre-filled student details and 5 independent section cards.
  - Updated Section 3 (Family Context: `₹1–3 lakh`), triggered "Save Family Context", observed "Saved successfully" toast and section badge.
  - Profile readiness metric updated dynamically to 80%.
  - Navigated to `/student` dashboard and confirmed synced profile summary and readiness.

---

## Phase 3 — Student Portal: Brick 12 + Brick 13 — Career Intent & Career Database / Search

### What Was Done:
1. **Career Intent Selector (Brick 12)**:
   - Built interactive, low-cognitive-load intent selection cards at the top of `/student/career` with 5 primary choices:
     1. *"I already have a career in mind"* (Focuses search input for trade discovery)
     2. *"Help me choose a career"* (Guides sector exploration)
     3. *"I want a job soon"* (Suggests short duration $\le$ 3-month courses)
     4. *"I want vocational training"* (Highlights accredited ITI courses and providers)
     5. *"I want to continue studying"* (Highlights vertical mobility and progression pathways)
   - Persistent intent storage: Added `career_intent` column to `student_profiles` via Alembic migration `0004_career_intent.py`.
   - Dedicated backend endpoints: `GET /api/student/career-intent` and `PUT /api/student/career-intent` validating against the 5 allowed intents.
   - Immediate feedback: Persistent intent selection badge and toast confirmation.

2. **Career Database Search & Filtering (Brick 13)**:
   - Connected `/student/career` to the genuine empirical vocational database (10,000 real records, 15 trades, 75 courses, 5 training providers).
   - Zero AI recommendation, zero machine learning prediction, zero automated scores. 100% manual, truthful exploration.
   - **Debounced Text Search (300ms)**: Searches across trade name, industry sector, description, and common job roles.
   - **Empirical Server-Side Filters**:
     - *Industry / Sector*: All 13 distinct sectors from `occupations` (Electrical, Automotive, Construction, HVAC, Healthcare, IT & Digital, etc.).
     - *Qualification Level*: Controlled NSQF qualification levels (NSQF Level 1 to 4) directly from `courses`.
     - *Training Duration*: Short ($\le$ 3 Months), Medium (4–6 Months), and exact durations.
     - *Location / State*: 18 distinct states sourced from `training_providers` and `job_outcomes`.
     - *Salary Range*: Real monthly earning bounds (₹6,500 – ₹35,000 / month) from `job_outcomes`.
     - *Verified Placement Rate*: Real placement rate slider (0% – 80%+) from empirical survey batches.
   - **Removable Filter Chips & Clear All**: Active filter tags with single-click removal and "Clear all" button.
   - **Server-Side Sorting**: By Name (A–Z, Z–A), Salary (Highest, Lowest), and Placement Rate.
   - **URL Synchronization**: Search query and active filters are mirrored in `useSearchParams`, preserving state on refresh and browser back/forward navigation.

3. **Career Results & Detail Experience (`/student/career/:careerId`)**:
   - Clean, scannable result cards showing:
     - Trade title and sector badge
     - Real monthly earning range (e.g. `₹7,000 – ₹24,000 / mo`)
     - Verified average placement rate badge (e.g. `79.3% Placement`)
     - Qualification level and duration
     - Accredited training providers count
     - Common job role chips
     - *"View Pathway"* button
   - Comprehensive detail page at `/student/career/:careerId`:
     - Breadcrumb navigation & *"Back to Search & Explore"* preserving search state.
     - Sourced wage metrics (min, max, average starting salary).
     - Placement rate and count of recorded survey graduates.
     - Step-by-step **Career Progression Ladder** (Trainee $\rightarrow$ Technician $\rightarrow$ Senior $\rightarrow$ Supervisor/Contractor).
     - Vertical educational mobility pathways.
     - Accredited courses list with provider names, provider types (Government, Private, NGO), durations, and delivery modes.
     - Empirical regional outcomes with sample district placement percentages.
     - Official Data Provenance banner (MSDE / NSDC verified data source).

4. **Backend Architecture & Endpoints**:
   - Implemented `GET /api/careers`: Paginated search with query parameters, filter aggregations, and sorting.
   - Implemented `GET /api/careers/{career_id}`: Detail view with courses, providers, statistics, and provenance.
   - Implemented `GET /api/careers/meta/filters`: Filter options metadata populated directly from current database records.
   - Exported typed schemas in `backend/schemas/career.py` and mounted router in `backend/api/router.py`.

5. **Frontend Service & Types**:
   - Created `frontend/src/types/career.ts` and `frontend/src/services/careerService.ts` (re-exported in `frontend/src/services/careers.ts` and `student.ts`).
   - Zero `fetch()` or `axios()` calls in React components.

### Verification Results:
- **Backend Pytest Suite (`test_careers.py` + full suite)**: **59 passed / 59 total tests** (100% pass rate).
  - Career search and keyword query verified.
  - Sector, education, duration, and salary filters verified.
  - Sorting and pagination verified.
  - Career detail with related courses and providers verified.
  - Career intent GET and PUT endpoints verified.
  - Invalid career intent rejected with 422 Unprocessable Entity.
  - RBAC: Non-students rejected from modifying student career intent.
  - Privacy: Zero tokens, passwords, or Aadhaar fields exposed.
- **Frontend Typecheck & Build**: `tsc -b && vite build` built in 1.26s with 0 errors.
- **Linter (`oxlint`)**: 0 errors across 86 files.
- **End-to-End Browser Verification**:
  - Loaded `http://localhost:5173/student/career` in Chrome.
  - Verified 5 Career Intent cards; clicked *"I want vocational training"*, confirmed active blue highlight and checkmark.
  - Tested search input with debouncing (`"electric"`), verified Electrician filtered as top result (`₹7,000 – ₹24,000`, `79.3% Placement`).
  - Cleared search via `X` button; tested Automotive sector filter; tested *"Clear all"*.
  - Navigated to `/student/career/11` (Electrician detail); verified Career Progression Ladder, 5 accredited courses with providers, regional outcome stats, and MSDE Data Provenance banner.
  - Clicked *"Back to Search & Explore"* and confirmed state preservation.

---

## Phase 3 — Brick 14: Deterministic Career Recommendation Engine

### 1. Architectural Foundation & Core Principles
- **Separation of Determinism and Explanation**: Built the deterministic recommendation engine *before* any LLM layer. The deterministic engine is the sole source of truth for candidate identification and ranking.
- **Zero LLM / Zero External AI in Selection**: No Gemini, no random sampling, no temperature, no probabilistic heuristics. The future LLM layer is strictly an explanation layer for the already selected candidates.
- **Top 3 Boundary**: The engine ranks all candidates and returns strictly the Top 3 compatible careers. The future LLM explanation layer is prohibited from introducing, replacing, or reordering candidates.
- **Neutral Compatibility Terminology**: Scores are strictly denoted as *"Compatibility Score"* or *"% Compatibility"* (0–100 scale). Zero claims of *"probability of success"* or *"guaranteed employment"*.
- **Explicit Missing Data Handling**: Missing attributes (salary, regional distribution, specific durations) evaluate to `unknown` (`score: null`), not `0` (poor match). Final score calculation normalizes exclusively over known factors:
  $$\text{Final Score} = \text{round}\left(\frac{\sum_{i \in \text{known}} s_i \cdot w_i}{\sum_{i \in \text{known}} w_i} \times 100\right)$$

### 2. Centralized Weight Configuration
Centralized in [`backend/services/recommendation_service.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/services/recommendation_service.py) summing to 100%:
- `education`: **0.25** (25%) — Foundational qualification alignment.
- `interests`: **0.25** (25%) — Explicit student interest alignment against sector/trade taxonomy.
- `location`: **0.15** (15%) — District/State alignment or Open to Relocation status.
- `salary`: **0.15** (15%) — Student target wage compatibility against empirical salary bands.
- `training`: **0.10** (10%) — Target training timeline vs course durations.
- `employment`: **0.10** (10%) — Career intent and work preference alignment.

### 3. Factor Scoring & Normalization Rules
1. **Education (`score_education`)**:
   - `student_lvl >= req_lvl`: Strong match (1.0).
   - `student_lvl == req_lvl - 1`: Accessible pathway (0.70).
   - `student_lvl < req_lvl - 1`: Severe educational gap (0.20).
   - Unknown if trade has no formal qualification requirements recorded.
2. **Interests (`score_interests`)**:
   - Tokenizes explicit student interest keywords against trade sector, description, and roles using curated domain taxonomy.
   - $\ge 2$ overlaps: Strong alignment (1.0).
   - 1 overlap: Moderate alignment (0.75).
   - 0 overlap: Weak alignment (0.30).
3. **Location (`score_location`)**:
   - Exact district match: Strong match (1.0).
   - State match: Regional match (0.85).
   - Open to relocation: Relocation match (0.80).
   - Different state without relocation preference: Relocation required (0.25).
4. **Salary (`score_salary`)**:
   - Max salary $\ge$ Student target: Fully compatible (1.0).
   - Max salary within 20% margin: Growth potential (0.70).
   - Substantially below target: Compensation gap (0.30).
   - Missing data: Explicitly `null` / unknown factor.
5. **Training Duration (`score_training`)**:
   - Intent `"I want a job soon"` or `"short"` + trade duration $\le 6$ months: Fast-track match (1.0).
   - Longer duration: Manageable duration (0.65) or Extended duration (0.45).
6. **Employment Preference (`score_employment`)**:
   - Self-employment preference + high self-employment trade: Entrepreneurship match (1.0).
   - Placement preference + empirical placement $\ge 75\%$: High placement match (0.95).

### 4. Deterministic Tie-Breaking
When candidates share identical compatibility scores, stable deterministic ordering is enforced via:
1. Higher count of matched factors (`len(matched_factors)` $\downarrow$).
2. Higher interest alignment score ($\downarrow$).
3. Higher education compatibility score ($\downarrow$).
4. Lexicographical trade name ($\uparrow$).

### 5. API & Backend Implementation
- **Schemas** ([`backend/schemas/career.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/career.py)):
  - `FactorEvaluation`: Factor name, evaluation result, human-readable summary, and numeric factor score.
  - `CareerRecommendationItem`: `career` summary, `compatibility_score` (0–100), `matched_factors`, `mismatched_factors`, `unknown_factors`.
  - `CareerRecommendationsResponse`: Top 3 items, `weights_used`, `algorithm` identifier.
- **Endpoints**:
  - `GET /api/careers/recommendations`: Dedicated recommendation route, protected by `require_student`.
  - `GET /api/student/recommendations`: Route alias for student portal.
- **Isolation & RBAC**:
  - Authenticated student's verified profile and career intent are queried directly from the session. No arbitrary `student_id` parameter accepted. Parents and admins are rejected with `403 Forbidden`.

### 6. Frontend Integration
- **Service** ([`frontend/src/services/careerService.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/services/careerService.ts)):
  - `careerService.getRecommendations()` calling `/api/careers/recommendations` via shared `apiClient`.
- **UI** ([`frontend/src/pages/student/StudentCareer.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/pages/student/StudentCareer.tsx)):
  - Added *"Recommended for You"* section prominently placed above the general catalog.
  - Renders Top 3 responsive recommendation cards.
  - Displays neutral badge (e.g. `98% Compatibility`), Sector pill, NSQF level, duration, and salary range.
  - Displays *"Why this appears"* with green checkmarks for matched factors.
  - Displays *"Consider"* with amber alert icons for mismatched or unknown factors.
  - *"View Career Pathway"* button navigating seamlessly to `/student/career/:id`.

### 7. Automated Testing & Verification
- **Pytest Suite** ([`backend/tests/test_recommendations.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_recommendations.py)):
  - 27 new tests covering every single factor function, missing data handling, deterministic stability across runs, tie-breaking order, API student authentication, parent/unauthenticated rejection, and verification of zero sensitive field leakage.
  - Total test suite: **86 passed, 0 failed** across all test suites.
- **TypeScript & Build Verification**:
  - `npm run build` (`tsc -b && vite build`) passed with zero errors.
- **Browser Subagent E2E Verification**:
  - Logged in as student in Chrome browser session.
  - Verified Top 3 recommended cards loaded with scores (`98% Compatibility`, `97% Compatibility`, `94% Compatibility`).
  - Verified *"Why this appears"* factor breakdowns.
  - Clicked *"View Career Pathway"* on candidate #1 (*Automotive Service Technician*), verifying navigation to `/student/career/4`.

