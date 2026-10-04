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

---

## Phase 4 — Brick 15: AI Provider Interface

### 1. Objective & Core Architectural Principle
- **Decoupled AI Abstraction Layer**: Designed a provider-independent AI interface (`backend/ai/provider.py`) ensuring the core vocational platform interacts exclusively with the abstract `AIProvider` contract.
- **Strict Vendor Isolation**: Business logic (recommendations, student counselling, parent decision support) is prohibited from importing or depending on Google Gemini or any external model SDK.
- **Architecture Target**:
  ```
                    Application Layer
          (Services, Routers, Background Tasks)
                           │
                           ▼
                      AIProvider
                     /          \
                    ▼            ▼
            GeminiProvider   OwnModelProvider
                  │                  │
                  ▼                  ▼
             Gemini API         OWN_MODEL_URL
  ```

### 2. Provider-Independent Contracts & Shared Types
Created in [`backend/ai/types.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/ai/types.py):
- `AIRole`: Normalized role identifier enum (`SYSTEM`, `USER`, `ASSISTANT`, `FUNCTION`).
- `AIMessage`: Vendor-neutral message model with role, content, optional name, and metadata.
- `AIResponse`: Standard text response model with content, role, model, finish_reason, and usage stats.
- `AIStreamChunk`: Async streaming chunk model with content, index, is_final flag, and finish_reason.
- `AIRequest`: Encapsulated text generation request (messages, system_prompt, temperature, max_tokens, etc.).
- `StructuredResponseRequest`: Encapsulated structured generation request with schema target.
- `StructuredAIResponse`: Output model holding parsed schema output and raw text representation.

### 3. AIProvider Abstract Interface
Defined in [`backend/ai/provider.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/ai/provider.py) as an abstract base class (`ABC`) with 3 core asynchronous methods:
1. `generate_response(messages, system_prompt, temperature, max_tokens, **kwargs) -> AIResponse`: Asynchronous standard text generation.
2. `generate_structured_response(messages, response_schema, system_prompt, temperature, **kwargs) -> StructuredAIResponse`: Schema-driven output validated against Pydantic models or JSON Schema dictionaries.
3. `stream_response(messages, system_prompt, temperature, max_tokens, **kwargs) -> AsyncIterator[AIStreamChunk]`: Incremental token chunk streaming as an asynchronous generator.

### 4. Structural Placeholders (Zero External Calls)
- **`GeminiProvider`** ([`backend/ai/providers/gemini.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/ai/providers/gemini.py)):
  - Inspects `settings.GEMINI_API_KEY` and default model identifier (`gemini-1.5-pro`).
  - Implements all 3 contract methods with clear `NotImplementedError` markers deferring SDK calls to Phase 4 Brick 16.
  - Zero external HTTP requests; zero Google SDK imports.
- **`OwnModelProvider`** ([`backend/ai/providers/own_model.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/ai/providers/own_model.py)):
  - Configured with `settings.OWN_MODEL_URL` and model identifier (`vocational-counsellor-v1`).
  - Structural placeholder for future self-hosted / fine-tuned open-weights models.
  - Implements all 3 contract methods with `NotImplementedError`.

### 5. Provider Factory & Configuration Resolver
Implemented in [`backend/ai/factory.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/ai/factory.py):
- `get_ai_provider(provider_type: Optional[str] = None) -> AIProvider`
- Resolves `AI_PROVIDER` from `backend/core/config.py` (`"gemini"` $\rightarrow$ `GeminiProvider`, `"own_model"` $\rightarrow$ `OwnModelProvider`).
- Rejects invalid provider names with custom `AIProviderConfigurationError`.

### 6. Domain Exception Hierarchy
Created in [`backend/ai/exceptions.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/ai/exceptions.py):
- `AIProviderError` (Base class)
- `AIProviderConfigurationError`
- `AIProviderUnavailableError`
- `AIProviderResponseError`

### 7. Documentation & Verification
- **Documentation**: Created [`backend/ai/README.md`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/ai/README.md) detailing architecture, decoupling rationale, Gemini plug-in path, and own model roadmap.
- **Test Suite** ([`backend/tests/test_ai_provider.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_ai_provider.py)):
  - 13 new unit tests covering:
    - Factory switching and provider resolution
    - Contract inheritance and abstract class instantiation blocking
    - Structural placeholder `NotImplementedError` verification
    - Mock concrete provider testing async generation, structured Pydantic schema validation, and streaming iterator
    - Domain exception tagging and error hierarchies
    - Verification that no API keys or active network connections are required
  - Total test suite: **99 passed, 0 failed** across all test suites.
- **Frontend Integrity**: `npm run build` executed cleanly in 2.57s with 0 errors.

---

## Phase 4 — Brick 16: Gemini Provider Implementation

### 1. Objective & Architectural Isolation
- **Encapsulated Gemini Integration**: Fully implemented `GeminiProvider` inside [`backend/ai/providers/gemini.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/ai/providers/gemini.py) fulfilling the `AIProvider` contract.
- **Complete Vendor Isolation**: All Google GenAI SDK imports, configurations, models, and types (`google.genai`, `google.genai.types`, `google.genai.errors`) are strictly confined within `backend/ai/providers/gemini.py`.
- **Zero Frontend Awareness**: Frontend codebase contains zero references to Gemini, vendor models, or provider SDKs. The frontend communicates solely with generic backend endpoints.

### 2. Method Implementation
1. **`generate_response(messages, system_prompt, temperature, max_tokens, **kwargs) -> AIResponse`**:
   - Asynchronously invokes `client.aio.models.generate_content()`.
   - Extracts candidate text, token usage metadata (`prompt_tokens`, `completion_tokens`, `total_tokens`), and finish reasons.
   - Normalizes to vendor-neutral `AIResponse`.
2. **`generate_structured_response(messages, response_schema, system_prompt, temperature, **kwargs) -> StructuredAIResponse`**:
   - Directs Gemini via `types.GenerateContentConfig(response_mime_type="application/json", response_schema=response_schema)`.
   - Supports native Pydantic validation via `raw_response.parsed`, with automatic fallback to JSON parsing and schema validation.
   - Normalizes to vendor-neutral `StructuredAIResponse`.
3. **`stream_response(messages, system_prompt, temperature, max_tokens, **kwargs) -> AsyncIterator[AIStreamChunk]`**:
   - Calls `client.aio.models.generate_content_stream()`.
   - Asynchronously yields `AIStreamChunk` instances with chunk content, progressive index, and final termination indicators.

### 3. Error Translation & Resilience
- Traps all SDK exceptions and maps them into domain error types:
  - `errors.APIError` 401/403 $\rightarrow$ `AIProviderConfigurationError`
  - `errors.APIError` 429/500/503 $\rightarrow$ `AIProviderUnavailableError`
  - `httpx.TimeoutException`, network connection drops $\rightarrow$ `AIProviderUnavailableError`
  - Schema decode errors, malformed JSON $\rightarrow$ `AIProviderResponseError`
- Missing `GEMINI_API_KEY` raises `AIProviderConfigurationError` only when live generation is attempted, preserving non-blocking instantiation in test environments.

### 4. Automated Testing & Verification
- **Test Suite** ([`backend/tests/test_ai_provider.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_ai_provider.py)):
  - 18 comprehensive tests covering:
    - Text generation, usage token extraction, finish reason parsing
    - Structured response parsing (native SDK parsed + JSON fallback)
    - Async stream iteration with progressive indices
    - Error translation (401/403 auth errors, 429 rate limits, network timeouts, JSON malformation)
    - Missing API key detection
    - Zero external network requests through dependency-injected test client
  - **104 passed, 0 failed** across all test suites.

---

## Phase 4 — Brick 17: Future Custom Model Provider

### 1. Objective & Non-Crashing "Not Configured" Safe State
- **Safe Custom Model Implementation**: Implemented `OwnModelProvider` ([`backend/ai/providers/own_model.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/ai/providers/own_model.py)) fulfilling the `AIProvider` contract for the project's future proprietary/fine-tuned vocational guidance model.
- **Zero Crash Resilience**: Because the custom model server is not yet deployed, all provider operations safely raise `AIProviderConfigurationError` ("Own model provider is not configured") without crashing the application, without making external network connections, and without pretending the model produced a fake answer.
- **Safe Secrets & Credential Sanitization**: URLs containing embedded basic auth or secret tokens (e.g. `https://user:pass@host/`) are automatically sanitized before appearing in logs or error messages.

### 2. Method Implementation
1. **`is_configured`**:
   - Property returning whether `OWN_MODEL_URL` is set and non-empty.
2. **`_ensure_configured()`**:
   - Safely raises `AIProviderConfigurationError` when `OWN_MODEL_URL` is empty.
   - Even if `OWN_MODEL_URL` is populated, raises a controlled configuration error indicating the model server is not yet deployed in this phase.
3. **`generate_response(messages, ...)`**:
   - Invokes `_ensure_configured()` and safely raises `AIProviderConfigurationError`.
4. **`generate_structured_response(messages, ...)`**:
   - Invokes `_ensure_configured()` and safely raises `AIProviderConfigurationError`.
5. **`stream_response(messages, ...)`**:
   - Checks `_ensure_configured()` on iteration start and safely raises `AIProviderConfigurationError`.

### 3. Provider Factory Integration
- Existing provider factory [`backend/ai/factory.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/ai/factory.py) continues to cleanly select `OwnModelProvider` when `AI_PROVIDER=own_model` (or aliases `'ownmodel'`, `'self_hosted'`).
- `GeminiProvider` remains fully available and unaffected when `AI_PROVIDER=gemini`.

### 4. Automated Testing & Verification
- **Test Suite** ([`backend/tests/test_ai_provider.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_ai_provider.py)):
  - 5 dedicated tests added for `OwnModelProvider`:
    - Instantiation and `AIProvider` contract satisfaction with empty `base_url`.
    - `generate_response()` safely raising `AIProviderConfigurationError` ("not configured").
    - `generate_structured_response()` safely raising `AIProviderConfigurationError`.
    - `stream_response()` safely raising `AIProviderConfigurationError` without initiating any network connection.
    - Behavior when `base_url` is provided (safely indicates service not yet deployed).
    - Credential sanitization verifying that embedded auth passwords are never leaked in error messages or logs.
  - Total test suite: **109 passed, 0 failed** across all test suites.
- **Full Backend Pytest Suite**:
  - **109 passed, 0 failed** across all 9 test suites.

---

## Phase 4 — Brick 18: AI Provider Router

### 1. Objective & Architecture
- **Centralized Provider Selection**: Implemented the authoritative AI provider router in [`backend/ai/router.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/ai/router.py) (and re-exported via [`backend/ai/factory.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/ai/factory.py) and [`backend/ai/__init__.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/ai/__init__.py)).
- **Canonical Configuration Mapping**:
  - `AI_PROVIDER=gemini` $\rightarrow$ `GeminiProvider`
  - `AI_PROVIDER=custom` $\rightarrow$ `OwnModelProvider` (also maps `'own_model'`, `'ownmodel'`, `'self_hosted'`)
- **Strict Error Handling**:
  - Unsupported provider names (e.g. `openai`, `random`) raise `AIProviderConfigurationError`. The router **never** silently falls back to Gemini.
  - Missing or empty `AI_PROVIDER` values raise `AIProviderConfigurationError` immediately.
- **Provider Instance Lifecycle**:
  - Implemented thread-safe in-memory caching to reuse provider instances across requests.
  - Provided `clear_ai_provider_cache()` for testing and dynamic reconfiguration.
- **FastAPI Dependency Support**:
  - Exposed `get_current_ai_provider()` for FastAPI route dependency injection via `Depends(get_current_ai_provider)`.
- **Zero Frontend Awareness**:
  - Provider selection occurs 100% server-side. Zero frontend files modified or exposed.

### 2. Automated Testing & Verification
- **Test Suite** ([`backend/tests/test_ai_provider.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_ai_provider.py)):
  - 8 new and enhanced tests covering:
    - Canonical `gemini` resolution to `GeminiProvider`.
    - Canonical `custom` resolution to `OwnModelProvider`.
    - Settings-based resolution via `monkeypatch`.
    - Unsupported provider rejection with explicit error message.
    - Missing/empty `AI_PROVIDER` rejection.
    - Whitespace and case-insensitive normalization.
    - FastAPI dependency injection function `get_current_ai_provider()`.
    - Singleton caching and cache clearance verification.
  - Total test suite: **113 passed, 0 failed** across all test suites.
- **Full Backend Pytest Suite**:
  - **113 passed, 0 failed** in 11.35s across all 9 test suites.
- **Frontend Verification**:
  - `npm run build` verified cleanly with 0 TypeScript/build errors.

---

## Phase 5 — Brick 19: RAG / Retrieval Layer

### 1. Objective & LLM Independence
- **Dedicated Retrieval Architecture**: Built the factual retrieval infrastructure for the future RAG system in `backend/rag/` (`knowledge_base.py`, `embeddings.py`, `retriever.py`).
- **Architectural Invariant**:
  - The **Retriever** is the sole source of factual knowledge.
  - The future **LLM** is strictly an explanation and dialogue layer.
  - Under no circumstances is the LLM permitted to become the source of truth for qualification levels, training courses, or employment statistics.

### 2. Supported Knowledge Domains
Normalized across 7 distinct domains without duplicating database tables:
1. **Occupations**: Job descriptions, sectors, skill requirements, associated career progression.
2. **Courses**: Course titles, qualification/NSQF levels, durations, delivery modes, provider links.
3. **Salary & Job Outcomes**: Regional salary bands (min-max INR), employment/placement rates, experience levels.
4. **Training Providers**: Accredited government ITIs, NSTIs, locations, institution types.
5. **Career Paths**: Multi-step progression ladders, durations, connected occupations.
6. **NSQF Descriptors**: National Skills Qualification Framework competency levels 1 through 10.
7. **Data Sources**: Statutory provenance registries, versions, and verification authorities.

### 3. Rigorous Provenance & Verified-Only Filtering
- **Provenance Payload** (`KnowledgeProvenance`):
  - Every knowledge item preserves `source`, `source_type`, `source_url`, `version`, `verified`, and `is_demo`.
  - Statutory official authorities (MSDE, NCVET, DGT, National Qualification Register) are labeled `verified=True`, `is_demo=False`.
  - Synthetic, unlinked, or test records are labeled `verified=False`, `is_demo=True`.
- **`verified_only=True` Mode**:
  - Default operating mode for student/parent factual counselling.
  - Completely excludes unverified or illustrative records from entering the factual prompt context.

### 4. Embedding Provider Abstraction
- Created abstract `EmbeddingProvider` in [`backend/rag/embeddings.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/rag/embeddings.py).
- Implemented `DeterministicLocalEmbedding`: A zero-network, zero-cost deterministic embedding provider generating 768-dimensional unit-normalized vectors using SHA-256 token n-gram distribution for testing and local benchmarking.
- Implemented `GoogleEmbeddingProvider`: Boundary for future `text-embedding-004` calls with safe non-crashing fallback.
- Centralized configuration: `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSION` in `backend/core/config.py`.

### 5. Hybrid Knowledge Retriever
Implemented in [`backend/rag/retriever.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/rag/retriever.py):
- Combines semantic vector similarity (cosine) with lexical keyword matching and statutory reliability boosting.
- Supports structured metadata filtering:
  - `knowledge_types` (restrict to specific domains e.g. Courses only)
  - `sectors` (e.g. Electrical, Automotive)
  - `nsqf_levels` (e.g. NSQF Level 4)
  - `location` (district or state matching)
- Generates `RetrievedContext` with `to_context_string()` providing formatted factual prompt citations.

### 6. Security & Privacy
- Public knowledge extraction operates exclusively on educational and occupational tables.
- Sensitive user tables (`users`, `student_profiles`, `parent_profiles`, `user_sessions`) are completely excluded from the knowledge base.

### 7. Automated Testing & Verification
- **Test Suite** ([`backend/tests/test_rag.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_rag.py)):
  - 12 comprehensive unit tests covering:
    - Provenance determination and official vs. demo labeling
    - Knowledge item normalization across all 7 domains
    - Strict `verified_only=True` isolation
    - Retriever relevance scoring on electrician and automotive queries
    - `top_k` result clamping
    - Metadata filters (sectors, knowledge types)
    - Formatting into prompt context strings
    - Embedding unit vector length and cosine similarity
    - Privacy verification (zero private student data in knowledge base)
  - Total test suite: **125 passed, 0 failed** in 16.03s across all 10 test suites.
- **Frontend Verification**:
  - `npm run build` verified cleanly with 0 TypeScript/build errors.

---

## Brick 20: Backend Counselling Service (Phase 5)

### Goal
Build the provider-independent counselling orchestration layer connecting:
`User Question` $\rightarrow$ `Student Profile` $\rightarrow$ `Career Context` $\rightarrow$ `RAG Retriever` $\rightarrow$ `Verified Evidence` $\rightarrow$ `AI Provider` $\rightarrow$ `Grounded Response`.

### 1. Architectural Architecture & Decoupling
- **Service Layer**: Created [`backend/services/counselling_service.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/services/counselling_service.py) to encapsulate all business logic, prompt assembly, signal detection, and database persistence.
- **Strict Provider Independence**:
  - Zero direct imports of vendor SDKs (`google.genai`, `GeminiProvider`).
  - Calls abstract `AIProvider.generate_response` via router resolution (`get_ai_provider()`).
  - Switching `AI_PROVIDER` (from `gemini` to `custom`) requires zero counselling business code changes.
  - Safe controlled error handling (503 Service Unavailable / 502 Bad Gateway) without silent fallback.

### 2. Student & Career Context Safety
- **Safe Profile Extraction**: Only permitted vocational fields (`education_level`, `stream`, `location`, `household_income_range`, `interests`, `skills`, `career_intent`, `career_preferences`) enter AI context.
- **Zero PII Leakage**: Strictly omits passwords, password hashes, auth tokens, phone numbers, email addresses, Aadhaar, and parent private notes.
- **Deterministic Recommendation Protection**:
  - Preloads deterministic career recommendations from Brick 14.
  - System prompt strictly forbids the AI from inventing new career options, overriding deterministic recommendation rankings, or calculating artificial compatibility scores.

### 3. Factual Retrieval & Evidence Provenance
- Uses [`KnowledgeRetriever`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/rag/retriever.py) from Brick 19 with default `verified_only=True`.
- Returns concise citations in `CounsellingEvidenceItem` (`knowledge_type`, `title`, `source`, `source_url`, `relevance_score`, `summary`).

### 4. Signal Detection & Heuristics
- **Low Confidence Detection**:
  - Structured `confidence` (0.0 to 1.0) and `confidence_reason`.
  - Configurable threshold `COUNSELLING_LOW_CONFIDENCE_THRESHOLD = 0.50` in `backend/core/config.py`.
- **Unsupported Question Detection**:
  - Flags speculative queries ("Will I 100% get a job?", "What will my salary definitely be after 5 years?").
  - Returns `supported=False`, `support_level="unsupported"`, and an explicit factual rationale.
- **Human Counsellor Escalation**:
  - Detects explicit requests ("I want to speak to a counsellor", "Can I speak to a human?").
  - Sets `human_escalation_requested=True`.
  - Creates a `HumanEscalation` record (`counselling_session_id`, `reason`, `priority=MEDIUM`, `status=PENDING`).
  - Automatically transitions `CounsellingSession.status` to `SessionStatus.ESCALATED`.

### 5. Conversation History & API Endpoints
- **Bounded Conversation Context**: Loads recent messages up to `COUNSELLING_HISTORY_LIMIT = 6` to maintain grounding while always appending the latest question.
- **Message Persistence**: User messages and assistant responses are committed to `CounsellingMessage` tables with chronological ordering.
- **Secure Endpoints** ([`backend/api/routers/counselling.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/api/routers/counselling.py)):
  - `POST /api/counselling/sessions`: Initiates session; optionally processes initial question.
  - `GET /api/counselling/sessions`: Lists sessions for authenticated student or authorized family context.
  - `GET /api/counselling/sessions/{session_id}`: Retrieves session details and message timeline.
  - `POST /api/counselling/sessions/{session_id}/messages`: Submits user question, performs RAG retrieval, and generates grounded response.

### 6. Verification Results
- **Automated Tests** ([`backend/tests/test_counselling.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_counselling.py)):
  - 18 comprehensive tests covering happy path, zero evidence, unsupported queries, low confidence, human escalation, history bounds, RBAC isolation, mock AI provider independence, evidence provenance, PII exclusion, and error handling.
- **Full Backend Pytest Suite**: **143 passed, 0 failed** in 17.66s across 11 test modules.
- **Manual Actions Required**: No manual action required for this brick.

---

## Brick 21: Structured Counselling Response (Phase 5)

### Goal
Implement a strict, provider-independent structured response contract for the counselling system (`CounsellingResponse`), establishing a single shared contract between frontend, API, counselling service, and AI providers.

### 1. Canonical Response Schema
- Created [`backend/schemas/counselling.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/counselling.py) defining the canonical contract:
  - `message`: Comprehensive, evidence-grounded counselling message supporting long answers without artificial limits.
  - `language`: Response language code (e.g. `'en'`).
  - `career`: Structured [`CounsellingCareer`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/counselling.py) (`id`, `title`, `description`, `compatibility_score`, `reasons`).
  - `evidence`: List of [`CounsellingEvidenceItem`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/counselling.py) (`id`, `type`, `title`, `content`, `relevance`, `verified`, `source`, `source_url`).
  - `career_path`: List of [`CounsellingCareerPathStep`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/counselling.py) (`step`, `title`, `description`, `course_id`).
  - `suggested_questions`: Contextual follow-up suggestions (3 to 5 questions).
  - `confidence`: System counselling confidence indicator strictly constrained between `0.0` and `1.0`.
  - `requires_human`: Boolean indicating if human counsellor referral is active or recommended.
  - `sources`: User-facing source attribution list ([`CounsellingSourceItem`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/counselling.py)).

### 2. Separation of Backend-Owned vs AI-Generated Fields
- **Backend-Owned / Evidence-Derived**:
  - `career`: Extracted from database occupation and deterministic recommendation engine (compatibility score and matching reasons are preserved and cannot be altered by AI).
  - `evidence`: Direct citations from verified RAG retrieval with provenance and relevance scores.
  - `career_path`: Derived strictly from verified database `CareerPath` records (returns `[]` if none exists, preventing hallucinated progression steps).
  - `sources`: Provenance authorities derived directly from retrieved knowledge items.
- **AI-Generated**:
  - `message`: Thorough, structured guidance generated with markdown paragraphs, headings, and bullet points.
  - `suggested_questions`: 3–5 relevant follow-up questions.
  - `language`: Target language tag.
- **System-Derived**:
  - `confidence`: Evaluated deterministically via retriever evidence score and support status.
  - `requires_human`: Triggered by explicit human escalation requests or low-confidence unsupported topics.

### 3. Long-Answer Support
- Configured `COUNSELLING_MAX_OUTPUT_TOKENS: int = 2048` in [`backend/core/config.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/core/config.py) allowing detailed explanations for complex queries without artificial truncation.

### 4. Frontend TypeScript Mirror
- Created [`frontend/src/types/counselling.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/types/counselling.ts) mirroring the canonical backend schema and exported from `frontend/src/types/index.ts`.

### 5. Automated Testing & Verification
- **Test Suite** ([`backend/tests/test_counselling.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_counselling.py)):
  - 16 comprehensive unit & integration tests covering schema validation, long answers, confidence bounds, provenance, deterministic score integrity, and RBAC isolation.
- **Full Backend Pytest Suite**: **141 passed, 0 failed** in 13.51s across 11 test modules.
- **Frontend Build**: Verified with `npm run build` (0 TypeScript errors, 0 warnings).
- **Manual Actions Required**: No manual action required for this brick.

---

## Brick 22: Student Chat UI (Phase 5)

### Goal
Build the complete, production-grade student counselling interface at `/student/counselling` consuming the canonical `CounsellingResponse` contract from Brick 21, adhering strictly to the design system (White, Grey, Greyblue, Dark grey text highlight, Green/Red for status, 0 gradients), long-answer support, evidence/career/pathway/sources/suggested-questions rendering, human escalation handling, and responsive sidebar/drawer layout.

### 1. Files Created / Modified
- **Types**:
  - [`frontend/src/types/counselling.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/types/counselling.ts): Shared TypeScript contract for sessions, messages, evidence, career info, career paths, and canonical `CounsellingResponse`.
- **Services**:
  - [`frontend/src/services/counselling.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/services/counselling.ts): Encapsulated counselling API client (`listSessions`, `getSession`, `createSession`, `sendMessage`) communicating via `apiClient` with JWT authentication and offline mock persona fallback.
- **Components** ([`frontend/src/components/counselling/`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/)):
  - [`ChatMessage.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/ChatMessage.tsx): Safe structured text renderer (paragraphs, headings, bullet lists, bold/italics, without unsafe `dangerouslySetInnerHTML`), author avatar, timestamp, confidence badge ("Well supported", "Limited information", "Needs further guidance"), and human review pill.
  - [`ChatHistory.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/ChatHistory.tsx): Session list sidebar with "New Session" CTA, active session indicator, message count badges, and formatted relative timestamps.
  - [`CareerCard.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/CareerCard.tsx): Compact career overview showing title, description, deterministic compatibility score, and matching factor criteria. Omitted when no career context is attached.
  - [`EvidenceCard.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/EvidenceCard.tsx): Scannable cards presenting retrieved statutory evidence, knowledge type, statutory authority source, and verification checkmark badges. Omitted when no evidence is attached.
  - [`CareerPath.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/CareerPath.tsx): Progression timeline illustrating progressive steps (Education $\rightarrow$ Training $\rightarrow$ Certification $\rightarrow$ Entry-Level $\rightarrow$ Senior). Omitted when empty.
  - [`SourcesList.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/SourcesList.tsx): Provenance citation list with safe external URL links (`target="_blank" rel="noopener noreferrer"`).
  - [`SuggestedQuestions.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/SuggestedQuestions.tsx): Interactive follow-up question pills that populate and send directly through the standard message pipeline.
  - [`HumanEscalationNotice.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/HumanEscalationNotice.tsx): Amber notification banner rendered when `requires_human === true`, reassuring the student that human guidance is recommended.
  - [`CounsellingLoading.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/CounsellingLoading.tsx): Calm, non-intrusive loading indicator ("Analyzing vocational records and formulating guidance...").
  - [`CounsellingError.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/CounsellingError.tsx): User-friendly error message with retry trigger, masking raw stack traces, API keys, and internal backend exceptions.
  - [`MessageComposer.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/MessageComposer.tsx): Accessible multiline textarea with auto-resizing, Enter-to-submit, Shift+Enter for newlines, and duplicate submission prevention while loading.
- **Pages**:
  - [`frontend/src/pages/student/StudentCounselling.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/pages/student/StudentCounselling.tsx): Production-grade student counselling workspace with responsive layout, mobile sidebar drawer, auto-scroll to latest message, optimistic user message appending, and conversational empty landing state with suggested starter prompts.

### 2. Architectural Highlights & Guardrails
- **Zero Frontend AI Architecture**: The frontend communicates solely with the backend `/api/counselling/*` endpoints via `counsellingService`. Zero Gemini SDK imports, zero direct AI provider calls, and zero API keys on the client.
- **Zero Fabricated Data**: If `career`, `evidence`, `career_path`, or `sources` are missing or empty in the response, their respective sections are cleanly omitted rather than rendering empty or hallucinated placeholder cards.
- **Long-Answer Support**: Container uses natural flex-col flow with unrestrained height, responsive typography, and dedicated paragraph spacing, allowing substantial counselling explanations to be read comfortably without artificial scroll cutoffs.
- **Predictable State**: Dedicated React state tracking sessions, active session, messages, input draft, loading states, error states, and optimistic message preservation on network failure.
- **Accessibility & Design Rules**: Semantic buttons, ARIA labels on textarea and buttons, high text contrast, visible focus rings, calm grey/slate palette without neon AI gradients.

### 3. Verification Results
- **Manual Actions Required**: No manual action required for this brick.

---

## Brick 23: Career Pathway Visualization (Phase 5)

### Goal
Build a reusable career pathway visualization (`CareerPath.tsx`) for the student counselling experience (`/student/counselling`) consuming the structured `CounsellingResponse.career_path` contract from Brick 21 and verified backend/RAG records without frontend data fabrication.

### 1. Files Created / Modified
- **Backend Schema & Service**:
  - [`backend/schemas/counselling.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/counselling.py): Extended `CounsellingCareerPathStep` with `id`, `duration`, `qualification`, `nsqf_level`, `type`, and `is_current`. Added `further_education` to `CounsellingResponse`.
  - [`backend/services/counselling_service.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/services/counselling_service.py): Enhanced `extract_career_and_path` to parse dictionary progression ladders, extract verified `next_nsqf` values, map estimated durations, and classify stage types (`education`, `career`, `further_education`).
  - [`backend/tests/test_counselling.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_counselling.py): Added unit and integration tests for Brick 23 schema fields, absence of fake placeholders, long pathway preservation (>5 stages), and dictionary ladder extraction.
- **Frontend Types & Components**:
  - [`frontend/src/types/counselling.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/types/counselling.ts): Updated `CounsellingCareerPathStep` and `CounsellingResponse` mirroring the backend schema with zero type mismatch.
  - [`frontend/src/components/counselling/CareerPath.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/CareerPath.tsx): Reusable, accessible visualization supporting career context headers, NSQF badges, duration badges, qualification indicators, stage type classification, "You are here" current stage pins, desktop horizontal flow with arrows, mobile vertical timeline with down-arrows, and further education options.
  - [`frontend/src/pages/student/StudentCounselling.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/pages/student/StudentCounselling.tsx): Integrated enhanced `CareerPath` component passing `careerPath`, `careerTitle`, and `furtherEducation` from `latestResponse`.

### 2. Architectural Highlights & Guardrails
- **Zero Fabricated Data**: If `nsqf_level`, `duration`, or `qualification` are not provided in verified backend records, they are completely omitted. Never renders placeholder text such as "NSQF Level —".
- **Strict Progression Ordering**: Preserves backend-provided sequence `step` without client-side alphabetical or heuristic reordering.
- **Support for Long Pathways**: Unconstrained stage capacity supporting 5, 8, or more verified stages with smooth horizontal card scrolling on desktop and vertical timeline on mobile without horizontal page overflow.
- **Current Position Indicator**: "You are here" badge rendered only when `is_current === true` is explicitly provided by the contract; zero fuzzy guessing.
- **Responsive Layout**: Desktop and tablet render horizontal connected card sequences (`→`); mobile renders an accessible vertical timeline with connecting lines and down-arrows (`↓`).
- **Accessibility**: Semantic `<ol>` lists with `aria-label="Career progression pathway"`, `<li aria-current="step">` attributes, and screen-reader accessible stage numbers.

### 3. Verification Results
- **Backend Test Suite**: `pytest` passed **145/145 tests** with 100% pass rate in 14.95s.
- **Frontend Typecheck & Build**: `tsc -b && vite build` built cleanly in 1.16s with 0 errors.
- **Linter (`oxlint`)**: 0 errors across 99 files.
- **Manual Actions Required**: No manual action required for this brick.

---

## Brick 24: Evidence & Data Visualization (Phase 5)

### Goal
Build the evidence/data visualization layer for the student counselling experience (`/student/counselling`), presenting verified career data (salary, placement, training duration, career growth, job availability) returned by the backend and database without frontend estimation, calculation, or hallucination.

### 1. Components Created
- [`frontend/src/components/counselling/SalaryCard.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/SalaryCard.tsx): Displays verified salary ranges (e.g. `₹18,000 – ₹32,000 / month`), experience level chip, range progression bar, and statutory provenance attribution.
- [`frontend/src/components/counselling/PlacementCard.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/PlacementCard.tsx): Displays verified tracer survey placement/employment percentage (e.g. `82.5%`), survey cohort period, visual progress track, and source provenance.
- [`frontend/src/components/counselling/TrainingDurationCard.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/TrainingDurationCard.tsx): Displays verified course durations (e.g. `12 Months`), delivery mode, qualification level, and NSQF level badge without fake placeholders.
- [`frontend/src/components/counselling/JobAvailabilityCard.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/JobAvailabilityCard.tsx): Displays verified statutory availability classification (e.g. `Active Statutory Demand`), regional distribution, active openings count, and source attribution.
- [`frontend/src/components/counselling/CareerGrowthCard.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/CareerGrowthCard.tsx): Reusable growth card wrapping `CareerPath` from Brick 23 with graceful fallback when pathway milestones are unavailable.
- [`frontend/src/components/counselling/CareerEvidenceSection.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/CareerEvidenceSection.tsx): Master container assembling all 5 cards in a responsive grid with statutory verification headers.

### 2. Existing Backend Fields / Contracts Consumed
- `JobOutcome`: `salary_range_min`, `salary_range_max`, `salary_currency`, `experience_level`, `region`, `employment_rate`, `data_source` (`name`, `url`, `version`).
- `Course`: `duration`, `qualification_level`, `sector`, `delivery_mode`, `data_source`.
- `CareerPath`: `name`, `description`, `progression_ladder`, `estimated_duration`.
- `DataSource`: Canonical statutory provenance registries (`NCVET`, `DGT`, `MSDE`, `NCS`).

### 3. Visualizations Implemented
- **Salary Range Visualization**: Min-to-max progression track formatted with Indian numbering (`₹`) and period designation (`month`).
- **Placement Indicator**: High-contrast percentage bar visualizing tracer employment rates (`0%` to `100%`).
- **Training Levels**: Structured chip group displaying NSQF qualification level and delivery mode.
- **Job Availability**: Statutory demand badge with geographic distribution tags and vacancy counters.
- **Career Growth**: Step-by-step career milestone roadmap with horizontal flow on desktop and vertical timeline on mobile.

### 4. Missing-Data Handling
- Explicit graceful states (`"Salary data unavailable"`, `"Placement data unavailable"`, `"Training duration unavailable"`, `"Job availability data unavailable"`, `"Progression pathway unavailable"`).
- Missing values strictly remain `null`/`undefined`; never converted to `0`, empty strings, or estimated values.

### 5. Provenance & Source Handling
- Every card displays its issuing statutory authority (e.g. `Ministry of Skill Development & Entrepreneurship`, `NCVET`, `DGT`, `NCS`).
- Valid external URLs are safely rendered via `<a target="_blank" rel="noopener noreferrer">`. Never invents URLs.

### 6. Responsive Behavior
- **Desktop**: 2-column grid for Salary, Placement, Training, and Job Availability cards, with full-width Career Growth roadmap across the bottom.
- **Mobile**: Single-column vertical stack with vertical progression timeline preventing horizontal page overflow.

### 7. Tests Added
- [`backend/tests/test_counselling.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_counselling.py):
  - `test_extract_career_metrics_verified_data`: Verifies accurate extraction of salary min/max, placement rate, training duration, and NSQF levels from database records.
  - `test_extract_career_metrics_missing_data_no_zero_fabrication`: Verifies missing values evaluate strictly to `None` without producing `0` or fake placeholders.
  - `test_counselling_response_with_career_metrics`: Verifies Pydantic serialization and validation of `career_metrics` in `CounsellingResponse`.

### 8. Backend Contract Changes
- Added [`CounsellingCareerMetrics`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/counselling.py) to `backend/schemas/counselling.py` and attached optional `career_metrics` field to `CounsellingResponse`.
- Added [`extract_career_metrics`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/services/counselling_service.py) helper in `backend/services/counselling_service.py` to extract factual metrics from database models.
- Mirrored `CounsellingCareerMetrics` in `frontend/src/types/counselling.ts`.

### 9. Verification Results
- **Backend Test Suite**: `pytest` passed **148/148 tests** with 100% pass rate in 33.54s.
- **Frontend Typecheck & Build**: `tsc -b && vite build` built cleanly in 3.74s with 0 errors.
- **Linter (`oxlint`)**: 0 errors across 105 files.
- **Manual Actions Required**: No manual action required for this brick.

---

## Brick 25: Counselling Chat Responses + Long Conversations (Phase 5)

### What Was Done:
1. **Gemini AI Provider Integration (`backend/ai/providers/gemini.py`)**:
   - Integrated `GeminiProvider` behind the vendor-neutral `AIProvider` interface.
   - Configured `GEMINI_API_KEY` validation: if key is missing or set to placeholder (`"YOUR_GEMINI_API_KEY"`), `GeminiProvider.client` raises a controlled `AIProviderConfigurationError` mapped to `HTTP 503 Service Unavailable`, preventing application crashes or silent provider switching.
   - Configured `settings.GEMINI_MODEL = "gemini-1.5-pro"` and support for `COUNSELLING_MAX_OUTPUT_TOKENS = 4096`.
   - The counselling service and frontend contain zero Google SDK imports or Gemini-specific logic, maintaining complete provider independence.

2. **Long Conversation Management & Context Strategy (`backend/services/counselling_service.py`)**:
   - Configured `COUNSELLING_HISTORY_LIMIT = 40` (configurable default in `backend/core/config.py`).
   - Scalable conversation context compression: if history exceeds 10 messages, earlier turns (up to 30 older messages) are compressed into an `--- EARLIER CONVERSATION RECAP ---` chronological summary block in the system context, while the 10 most recent turns are passed verbatim as alternating user and model messages. This ensures long conversations preserve full conversational continuity without exceeding context window token budgets.

3. **Conversational Memory & Follow-up Inheritance**:
   - Implemented `infer_career_id_from_context`: when a student asks a follow-up question (e.g. `"What about the salary?"`, `"How long does it take?"`, `"What qualifications do I need?"`) without an explicit `career_id`, the system inspects recent conversation turns and matches known occupations in the database to retain the active trade context.
   - Follow-up RAG query contextualization: if a question does not include the active occupation's name, the retriever search query is enriched with `f"{message_text} for {career_obj.title}"` to retrieve verified salary, placement, and course records directly.

4. **Long AI Answer Support**:
   - Set `COUNSELLING_MAX_OUTPUT_TOKENS = 4096` in backend settings.
   - Ensured no artificial character or token truncation occurs in either the backend service or frontend message components, allowing detailed career roadmap breakdowns.

5. **Grounding & Safety Rules (`build_system_prompt`)**:
   - Updated the system prompt to explicitly enforce: zero fabrication of salaries, placement rates, duration, job availability, qualifications, or NSQF levels; explicit acknowledgment of unavailable or uncertain data; prohibition of guarantees; authoritative status of the deterministic recommendation engine; and detailed answers for complex queries.

6. **Error Handling & Failure Recovery**:
   - User messages are saved to the database prior to provider invocation. If AI generation fails, the user's message is preserved and retries succeed without duplicating student messages or creating duplicate assistant records.

### Verification Results:
- **Backend Test Suite**: Full `pytest` suite passed **154/154 tests** with 100% pass rate in 18.58s.
  - Added unit and integration tests in `backend/tests/test_counselling.py` for:
    - Gemini provider missing API key configuration error.
    - Gemini provider message conversion and SDK abstraction.
    - Scalable context compression for conversations > 10 messages.
    - Follow-up question career context inheritance (e.g. `"What about the salary?"`).
    - Long AI response preservation (4096 token limit).
    - Failure retry and user message preservation.
- **Frontend Build**: `npm run build` (`tsc -b && vite build`) passed with 0 errors in 3.04s.
- **Multi-Model Resilient Fallback**: Tested and verified automatic fallback chain across supported active Google GenAI models (`gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, and `gemini-3.8-flash`) to transparently handle temporary 503 high-demand spikes and model deprecations.
- **Live End-to-End Verification**: Successfully verified live end-to-end counselling conversation generation using student profile data, deterministic recommendation scores, and official verified knowledge base records.
- **Security Check**: Verified that student sessions enforce server-side family authorization and prevent cross-student session access. Sensitive authentication data (passwords, tokens, Aadhaar) are completely excluded from prompt context.
- **Client Timeout Calibration**: Increased frontend client timeout from 10,000ms to 60,000ms in `apiClient.ts` and `counsellingService.sendMessage` to accommodate long, detailed multi-stage LLM generation without client-side aborts.
- **Manual Actions Required**: None. The Gemini API key has been added to `backend/.env`, the backend server has reloaded with the active credentials, and live counselling responses are operational.

---

## Brick 26: Contextual Explain → AI Counsellor (Phase 5)

### Goal
Connect factual career, course, job, salary, placement, training, career progression, and qualification cards throughout the student and parent experience directly to the existing AI counselling system via reusable `[Explain]` / `[Explain this]` actions. Structured context is transferred via frontend route state to existing counselling routes (`/student/counselling` and `/parent/counselling`), triggering immediate, evidence-grounded AI explanations without re-typing or client-side fact invention.

### 1. Files Created / Modified
- **Frontend Components & Pages**:
  - [`frontend/src/components/counselling/ExplainAction.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/ExplainAction.tsx): Reusable, accessible action component rendering clear `[Explain]` / `[Explain this]` buttons. Detects role (`student` vs `parent`), packages minimum identifying context into React Router navigation state, and handles click events without URL query parameter pollution.
  - [`frontend/src/components/counselling/SalaryCard.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/SalaryCard.tsx): Integrated `ExplainAction` with `intent="explain_salary"`.
  - [`frontend/src/components/counselling/PlacementCard.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/PlacementCard.tsx): Integrated `ExplainAction` with `intent="explain_placement"`.
  - [`frontend/src/components/counselling/TrainingDurationCard.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/TrainingDurationCard.tsx): Integrated `ExplainAction` with `intent="explain_training"`.
  - [`frontend/src/components/counselling/JobAvailabilityCard.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/JobAvailabilityCard.tsx): Integrated `ExplainAction` with `intent="explain_job_availability"`.
  - [`frontend/src/components/counselling/CareerPath.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/CareerPath.tsx): Integrated `ExplainAction` with `intent="explain_career_growth"`.
  - [`frontend/src/components/counselling/CareerEvidenceSection.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/CareerEvidenceSection.tsx): Threaded `careerId` and `careerTitle` to child cards for precise entity targeting.
  - [`frontend/src/pages/student/StudentCareer.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/pages/student/StudentCareer.tsx): Added `ExplainAction` to career recommendation cards and catalog cards.
  - [`frontend/src/pages/student/StudentCareerDetail.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/pages/student/StudentCareerDetail.tsx): Added contextual `ExplainAction` buttons across Wage card, Placement card, Training Duration card, Qualification Level card, Career Progression ladder, Educational Mobility, and Course cards.
  - [`frontend/src/pages/student/StudentHome.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/pages/student/StudentHome.tsx): Added `ExplainAction` to dashboard recommended career cards.
  - [`frontend/src/pages/student/StudentCounselling.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/pages/student/StudentCounselling.tsx): Consumes incoming `location.state.explainContext`, immediately clears route state to prevent duplicate calls on refresh, displays the active contextual explain banner, and triggers automatic session creation / messaging with authoritative AI grounding.
  - [`frontend/src/pages/parent/ParentCounselling.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/pages/parent/ParentCounselling.tsx): Production-grade Parent AI Counselling Workspace supporting contextual explain requests with child context, conversation history, and verified family access enforcement.
  - [`frontend/src/types/counselling.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/types/counselling.ts): Defined `CounsellingIntent`, `CounsellingEntityType`, and `CounsellingContext`.
  - [`frontend/src/services/counselling.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/services/counselling.ts): Updated `createSession` and `sendMessage` payload types to include optional `context: CounsellingContext`.

- **Backend Schemas, Service & Routers**:
  - [`backend/schemas/counselling.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/counselling.py): Added `CounsellingContextPayload` schema and attached optional `context` field to `CreateCounsellingSessionRequest` and `SendCounsellingMessageRequest`.
  - [`backend/services/counselling_service.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/services/counselling_service.py):
    - Added `resolve_context_entity`: Resolves database entities (`Occupation`, `Course`, `CareerPath`, `JobOutcome`) with safety fallbacks for missing or unmapped records.
    - Added `synthesize_explain_question`: Synthesizes authoritative natural language questions for all 10 explain intents.
    - Added `get_intent_suggested_questions`: Produces tailored, topical follow-up question pills (salary, progression, certifications, local hiring) via `suggested_questions`.
    - Updated `format_grounded_messages`: Injects a `CONTEXTUAL EXPLAIN DIRECTIVE` instructing the AI to explain the verified evidence, maintain statutory boundaries, avoid promising guaranteed salaries, and cite authoritative sources.
    - Updated `process_counselling_message`: Orchestrates context resolution, synthesized question processing, and intent-focused suggested questions.
  - [`backend/api/routers/counselling.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/api/routers/counselling.py):
    - Updated `create_counselling_session` to automatically trigger an initial AI explanation when `payload.context` is provided.
    - Updated `post_counselling_message` to pass `payload.context` to the counselling service.
  - [`backend/tests/test_counselling_explain.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_counselling_explain.py): 15 comprehensive unit and integration tests covering schemas, entity resolution, query synthesis, directives, suggested questions, service orchestration, human escalation, and API router.

---

### 2. Explain Component (`ExplainAction.tsx`)
- Rendered as a clean, accessible button with a descriptive label (`[Explain]`, `[Explain this]`, `[Explain this path]`).
- Accepts:
  ```tsx
  <ExplainAction
    intent="explain_career"
    entityType="career"
    entityId={career.id}
    entityTitle={career.name}
    label="Explain"
  />
  ```
- Automatically resolves target route based on current path or authenticated user role:
  - Students $\rightarrow$ `/student/counselling`
  - Parents $\rightarrow$ `/parent/counselling`
- Transfers context via React Router `navigate(targetRoute, { state: { explainContext: ... } })`, avoiding sensitive query params or database dumps in URLs.

---

### 3. Supported Entity Types
- `career` (Occupation records)
- `course` (Course/Curriculum records)
- `provider` (TrainingProvider institutions/ITIs)
- `occupation` (Vocational trade records)
- `salary` (JobOutcome wage distributions)
- `placement` (Tracer study placement rates)
- `training` (Course durations and delivery modes)
- `career_growth` (CareerPath progression ladders)
- `job_availability` (Regional employment demands)
- `nsqf` (National Skills Qualification Framework levels)
- `further_education` (Academic and polytechnic mobility)

---

### 4. Supported Intents
1. `explain_career`: Comprehensive breakdown of role, trade duties, training, and progression.
2. `explain_course`: Course curriculum, eligibility, duration, and certification details.
3. `explain_provider`: Accreditation, facility type, and vocational training history.
4. `explain_salary`: Grounded explanation of monthly wage bands, experience tiers, and statutory reporting.
5. `explain_placement`: Tracer study employment outcomes, cohort periods, and verified placement rates.
6. `explain_training`: Breakdown of classroom, workshop, and on-the-job apprenticeship durations.
7. `explain_career_growth`: Step-by-step career mobility from apprentice to supervisor/specialist.
8. `explain_job_availability`: Regional industry demands, hiring trends, and active statutory vacancies.
9. `explain_nsqf`: Qualification competency level, equivalencies, and educational ladders.
10. `explain_further_education`: Post-vocational lateral entry diplomas, degrees, and higher certifications.

---

### 5. Frontend Routing
- Existing counselling routes are reused:
  - `/student/counselling` for students.
  - `/parent/counselling` for parents.
- No separate `/student/explain` or `/parent/explain` pages created.
- On landing:
  - Reads `location.state?.explainContext`.
  - Immediately executes `navigate(location.pathname, { replace: true, state: {} })` to clear route state, preventing duplicate triggers upon browser refresh.
  - Automatically posts the contextual request or generates an initial session without requiring the user to re-type `"Explain X"`.
  - Displays a clean dismissible context banner: `"Explaining: [Entity Title] — [Intent Description]"`.

---

### 6. Backend Context Handling
- Backend receives structured payload:
  ```json
  {
    "message": "",
    "context": {
      "intent": "explain_career",
      "entity_type": "career",
      "entity_id": "123",
      "entity_title": "Automobile Technician"
    }
  }
  ```
- The backend resolves the entity from the database via `resolve_context_entity`.
- Retrieves verified evidence via `KnowledgeRetriever`.
- Generates a synthesized query via `synthesize_explain_question` if the user sent `"Explain"` or an empty string.
- Injects a `CONTEXTUAL EXPLAIN DIRECTIVE` into the grounded prompt, enforcing strict factual fidelity.

---

### 7. Authorization & Security
- **Student Isolation**: Students can only start sessions for their own verified profile (`user.student_profile.id`).
- **Parent Family Access (`verify_family_access`)**: Parents can only access counselling for their explicitly linked child verified through `ParentStudentAssociation`. Unlinked parents attempting to specify another child's ID are rejected with `HTTP 403 Forbidden`.
- **Zero Sensitive Data in URLs**: No user IDs, student profiles, or DB records are passed via query parameters.
- **Entity Access Safety**: Invalid or unmapped entity IDs degrade gracefully to general guidance without raising 500 exceptions or exposing internal errors.

---

### 8. AI Integration & Grounding Rules
- AI provider interactions remain strictly behind the `AIProvider` interface. Zero direct frontend calls to Gemini or any external LLM vendor.
- Prompt grounding strictly prohibits the LLM from fabricating salary figures, placement percentages, training hours, or job openings.
- If verified data is missing, the AI explicitly states:
  > *"The available verified data does not provide enough information to answer that part confidently."*
- Follow-up suggestions (`suggested_questions`) are dynamically tailored to the active intent (e.g. asking about experience tiers for salary, or lateral entry for training).

---

### 9. Long-Conversation Compatibility
- Fully compatible with Brick 25 long conversation architecture:
  - History limit of 40 turns.
  - Summary recap block for conversations $> 10$ messages.
  - Output token capacity of 4,096 tokens.
- Follow-up questions seamlessly inherit the active career context (`infer_career_id_from_context`).

---

### 10. Human-Escalation Compatibility
- Contextual counselling sessions preserve the full `HumanEscalation` contract:
  - If the user requests a human counsellor while viewing an explanation, `requires_human` is set to `true`.
  - A `HumanEscalation` record is created preserving the active session, reason, priority, and original context.
  - The UI displays the `HumanEscalationNotice` banner offering human referral.

---

### 11. Test Results
- **New Test Suite** ([`backend/tests/test_counselling_explain.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_counselling_explain.py)):
  - **15 passed, 0 failed** in 9.03s:
    1. `test_counselling_context_payload_validation`: Validates required fields, enum intents, and constraints.
    2. `test_resolve_context_entity_career`: Resolves occupation entity and metadata.
    3. `test_resolve_context_entity_course`: Resolves course entity and associated career path.
    4. `test_resolve_context_entity_pathway`: Resolves career pathway and associated occupations.
    5. `test_resolve_context_entity_missing_safe`: Graceful degradation for non-existent IDs.
    6. `test_synthesize_explain_questions_all_intents`: Verifies questions generated for all 10 intents.
    7. `test_intent_suggested_questions_all_intents`: Verifies follow-ups generated for all 10 intents.
    8. `test_format_grounded_messages_includes_explain_directive`: Verifies prompt directive injection.
    9. `test_service_contextual_explain_career`: End-to-end service execution with mock provider.
    10. `test_service_contextual_explain_salary_preserves_bounds`: Grounded salary bounds and metrics.
    11. `test_service_human_escalation_in_contextual_request`: Preserves escalation signal and DB records.
    12. `test_api_create_session_with_explain_context`: API session creation with instant AI explanation.
    13. `test_api_parent_contextual_counselling_authorized`: Linked parent session creation and validation.
    14. `test_api_parent_cross_student_access_rejected`: Cross-student access rejection (403 Forbidden).
    15. `test_api_post_message_with_explain_salary_context`: Post contextual explain message via API.
- **Full Backend Pytest Suite**: **169 passed, 0 failed** in 30.95s across all 13 test modules with zero regressions.

---

## Brick 27: Parent Dashboard (Phase 5)

### Goal
Build the parent dashboard at `/parent` to give parents a warm, simple, and understandable entry point into their child's vocational career journey without analytics bloat, charts, or speculative AI generation.

---

### 1. Components Created
- [`frontend/src/components/parent/ChildSummary.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/parent/ChildSummary.tsx):
  - Displays authenticated child name, relationship badge (e.g. `YOUR CHILD • mother`), authoritative career title or neutral empty state (`Career not selected yet`), and sanitized metadata (education level, location).
- [`frontend/src/components/parent/ParentQuestionCard.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/parent/ParentQuestionCard.tsx):
  - Accessible, semantic `<button>` action card with Lucide icons, short title, plain description, visible keyboard focus indicators, and tap target (min 44px).
- [`frontend/src/components/parent/ParentQuestionGrid.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/parent/ParentQuestionGrid.tsx):
  - Renders the 6 question cards arranged in a responsive grid (2-column desktop, 1-column mobile).
- [`frontend/src/pages/parent/ParentHome.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/pages/parent/ParentHome.tsx):
  - Main dashboard page mounted at `/parent`. Encapsulates loading, server-down error handling with retry CTA, neutral empty state when no student is linked, and active child dashboard.
- [`frontend/src/types/parent.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/types/parent.ts):
  - TypeScript definitions for `ParentChildContext`, `ParentChildCareer`, and `ParentQuestionAction`. Exported via `frontend/src/types/index.ts`.
- [`frontend/src/services/parentService.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/services/parentService.ts):
  - Service abstraction layer consuming `/api/parent/child` with offline developer mock fallback.

---

### 2. Backend APIs Consumed & Created
- **Created**: `GET /api/parent/child` ([`backend/api/routers/parent.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/api/routers/parent.py)):
  - Enforces `require_parent` server-side RBAC dependency.
  - Queries `ParentStudentAssociation` for `current_user.parent_profile.id`.
  - Derives authoritative career without hallucination: checks student's preferred career matching `Occupation`, or queries deterministic recommendation engine (`generate_recommendations(limit=1)`).
  - Returns sanitized [`ParentChildContextResponse`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/parent.py).
  - Returns `has_linked_student=False` and neutral message if no student profile is linked.
- **Consumed**: `POST /api/counselling/sessions`:
  - Starts or continues counselling sessions linking authorized family context.
- **Consumed**: `POST /api/counselling/sessions/{id}/messages`:
  - Dispatches contextual parent inquiry to AI counselling pipeline grounded in statutory evidence.

---

### 3. Child / Student Context Source
- The student context is derived **strictly from the authenticated parent's database relationship** (`ParentStudentAssociation.parent_profile_id == current_user.parent_profile.id`).
- Never accepts arbitrary `student_id` in URL parameters to determine authorization.
- Career identity is deterministically extracted from database `Occupation` records and the recommendation engine; never hallucinated by the LLM or invented by the frontend.

---

### 4. Navigation Behavior
Clicking any of the 6 action cards initiates navigation into the existing `/parent/counselling` flow:
1. **Income**:
   - Question: `"What income information is available for this career?"`
   - Intent: `explain_salary`
2. **Job Security**:
   - Question: `"What job availability information is available for this career?"`
   - Intent: `explain_placement`
3. **Further Education**:
   - Question: `"What further education options are available after this career?"`
   - Intent: `explain_training`
4. **Career Growth**:
   - Question: `"What does the career progression look like?"`
   - Intent: `explain_pathway`
5. **Work Near Home**:
   - Question: `"What information is available about opportunities near my child's preferred location?"`
   - Intent: `explain_career`
6. **Talk to AI**:
   - Question: `null` (opens `/parent/counselling` directly without automated question, allowing general dialogue).

[`ParentCounselling.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/pages/parent/ParentCounselling.tsx) handles incoming `location.state.initialQuestion` and `location.state.explainContext`: creates an active session and immediately retrieves grounded guidance with evidence cards.

---

### 5. Security & Authorization Checks
- **Role Isolation**: Only authenticated users with `role: parent` can call `/api/parent/child`. Student or admin roles without parent credentials are rejected with `403 Forbidden` or `401 Unauthorized`.
- **Data Sanitization**: Excludes sensitive data (passwords, tokens, Aadhaar, phone numbers, email addresses, private student logs).
- **Cross-Student Access Block**: Parents can never query or view student profiles not explicitly mapped in `ParentStudentAssociation`.

---

### 6. Responsive Behavior
- **Desktop (1024px+)**: Centered container (`max-w-3xl`) with 2-column grid of question cards matching the requested layout hierarchy.
- **Tablet (768px - 1023px)**: 2-column grid with touch-friendly spacing and generous tap targets.
- **Mobile (< 768px)**: 1-column vertically stacked cards with minimum 44px tap target height and visible focus rings.

---

### 7. Tests Added
- **Backend Test Suite** ([`backend/tests/test_parent_dashboard.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_parent_dashboard.py)):
  1. `test_parent_child_context_success`: Verifies authorized child data, relationship badge, and career title.
  2. `test_parent_without_linked_student`: Verifies neutral empty state and "No student profile is linked" message.
  3. `test_parent_student_without_career_selected`: Verifies "Career not selected yet" when no career is chosen.
  4. `test_parent_endpoint_unauthenticated`: Verifies 401 Unauthorized for missing token.
  5. `test_parent_endpoint_student_forbidden`: Verifies 403 Forbidden when a student token calls the parent endpoint.
- **Full Backend Pytest Suite**: **174 passed, 0 failed** in 23.30s.
- **Frontend Build**: Verified with `npm run build` (0 TypeScript errors, 0 warnings).

---

### 8. Backend Changes
- Added [`backend/schemas/parent.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/parent.py) defining `ParentChildContextResponse` and `ParentChildCareer`.
- Added `GET /child` endpoint in [`backend/api/routers/parent.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/api/routers/parent.py).
- Re-exported parent schemas in [`backend/schemas/__init__.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/__init__.py).

---

### 9. Manual Action Required
- No manual actions required. All services, APIs, and frontend pages are operational and validated.

---

## Linguistic Localization Layer: Natural Telugu Translation & Meaningful Grammar Formation

### Goal
Ensure all student and parent interactions can be experienced in natural, culturally respectful, and grammatically sound Telugu—strictly avoiding literal, mechanical word-by-word substitution and adhering to authentic Telugu sentence syntax (కర్త - కర్మ - క్రియ వాక్య నిర్మాణం).

### 1. Telugu Grammatical & Cultural Integrity Principles
- **Grammatical Syntax (కర్త - కర్మ - క్రియ)**: Enforced Subject-Object-Verb (SOV) sentence order rather than unnatural English Subject-Verb-Object (SVO) mirroring.
- **Contextual Meaning over Word-for-Word Substitution**: Phrased guidance with genuine Telugu idioms and vocational terminology appropriate for Indian parents inquiring about technical training, job stability, and starting salaries.
- **Statutory Terms & Acronym Retention**: Preserved statutory acronyms (ITI, NSQF, MSDE, NCVET) and trade titles while embedding them naturally within Telugu grammatical context (e.g., *ITI సర్టిఫికేషన్*, *NSQF లెవెల్ 4 శిక్షణ*).

### 2. Frontend Translation Architecture ([`frontend/src/context/LanguageContext.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/context/LanguageContext.tsx))
- **Child Context Overview**:
  - `yourChild`: `'మీ బిడ్డ'`
  - `careerNotSelected`: `'ఇంకా వృత్తిని ఎంచుకోలేదు'`
  - `relationship`: Localized badges for Mother (`తల్లి`), Father (`తండ్రి`), Guardian (`సంరక్షకులు`).
- **Parent 6 Question Cards**:
  1. **ఆదాయం & జీతం**:
     - వివరణ: *అందుబాటులో ఉన్న జీతభత్యాలు మరియు భవిష్యత్ సంపాదన వివరాలను తెలుసుకోండి.*
     - ప్రశ్న: *ఈ వృత్తికి సంబంధించి ఎంత ఆదాయం లేదా జీతం లభిస్తుంది?*
  2. **ఉద్యోగ భద్రత**:
     - వివరణ: *ఉద్యోగావకాశాలు మరియు భద్రతకు సంబంధించిన నిజమైన సమాచారాన్ని పరిశీలించండి.*
     - ప్రశ్న: *ఈ వృత్తిలో ఉద్యోగ అవకాశాలు మరియు భద్రత ఎలా ఉంటాయి?*
  3. **ఉన్నత విద్య & శిక్షణ**:
     - వివరణ: *ఈ కోర్సు తర్వాత చదవగలిగే తదుపరి విద్యా మార్గాలు మరియు డిప్లొమా అవకాశాలు.*
     - ప్రశ్న: *ఈ వృత్తి శిక్షణ పూర్తయిన తర్వాత ఇంకా ఏ ఉన్నత చదువులు చదవవచ్చు?*
  4. **కెరీర్ ఎదుగుదల**:
     - వివరణ: *అనుభవంతో పాటు పెరిగే హోదా మరియు భవిష్యత్ పదోన్నతుల వివరాలు.*
     - ప్రశ్న: *ఈ వృత్తిలో భవిష్యత్ పదోన్నతులు మరియు కెరీర్ ఎదుగుదల ఎలా ఉంటుంది?*
  5. **సమీపంలో ఉద్యోగావకాశాలు**:
     - వివరణ: *మీ ప్రాంతం మరియు ప్రాధాన్యత ప్రదేశాలలో లభించే అవకాశాలను తెలుసుకోండి.*
     - ప్రశ్న: *మా ప్రాంతానికి సమీపంలో ఈ వృత్తికి సంబంధించిన ఎలాంటి ఉద్యోగావకాశాలు ఉన్నాయి?*
  6. **కౌన్సెలర్‌తో మాట్లాడండి**:
     - వివరణ: *మీ బిడ్డ భవిష్యత్తు గురించి మీకు నచ్చిన ఏదైనా సందేహాన్ని అడగండి.*
- **AI Counselling Workspace Headers & Prompts**:
  - శీర్షిక: **తల్లిదండ్రుల వృత్తి విద్యా మార్గదర్శి**
  - ఉపశీర్షిక: **ప్రభుత్వ గుర్తింపు పొందిన అధికారిక సమాచారంతో కుటుంబాలకు మార్గదర్శకత్వం**
  - బ్యాడ్జ్: **కుటుంబ వివరాలు భద్రపరచబడ్డాయి**
  - వివరణ నోటీసు: *మీరు వివరణ కోరిన అంశం:* • *ముఖ్య అంశం:*
  - స్టార్టర్ ప్రశ్నలు:
    - *సర్టిఫైడ్ ITI టెక్నీషియన్లకు ఉద్యోగ స్థిరత్వం మరియు ప్రారంభ జీతం ఎంతవరకు ఉంటాయి?*
    - *సాధారణ విశ్వవిద్యాలయ డిగ్రీతో పోలిస్తే NSQF లెవెల్ 4 వృత్తి విద్యా కోర్సు ఎలాంటి ప్రయోజనాలను ఇస్తుంది?*
    - *ప్రభుత్వ ITI సంస్థల్లో విద్యార్థుల కోసం ఎలాంటి భద్రతా ప్రమాణాలు మరియు శిక్షణ వాతావరణం ఉంటాయి?*
    - *ITI సర్టిఫికేషన్ పూర్తయిన తర్వాత నా బిడ్డ ఇంజనీరింగ్ పాలిటెక్నిక్ డిప్లొమా లేదా డిగ్రీ చదవవచ్చా?*

### 3. Backend AI Natural Telugu Grounding ([`backend/services/counselling_service.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/services/counselling_service.py))
- **System Prompt Instructions**:
  - Automatically configured when `language == 'te'`:
    - Strict instruction: *"RESPOND STRICTLY IN NATURAL, GRAMMATICALLY ACCURATE, MEANINGFUL TELUGU (తెలుగు)."*
    - Prohibits literal translation: *"NEVER do mechanical word-for-word translation from English. Ensure authentic Telugu sentence structure (కర్త - కర్మ - క్రియ), respectful tone, and clear flow suitable for parents."*
    - Follow-up generation: *"Generate all `suggested_questions` strictly in natural, grammatically correct Telugu."*
- **Automatic Telugu Script Detection**:
  - Enhanced `process_counselling_message` to detect Unicode Telugu characters (`[\u0C00-\u0C7F]`) in user inquiries.
  - Automatically switches response language to `'te'` even if the initial request header defaulted to English, preventing mixed-language or awkward responses.

### 4. Verification Results
- **Automated Backend Pytest Suite**: **174 passed, 0 failed** in 31.11s.
- **Frontend Production Build**: `npm run build` completed with zero TypeScript errors or warnings.
- **Live Browser Subagent Verification**:
  - Navigated to `http://localhost:5173/parent` and activated Telugu via language switcher.
  - Confirmed accurate, culturally respectful Telugu sentences across all navigation tabs, child summary cards, and all 6 question cards.
  - Clicked into `/parent/counselling` and verified localized workspace headers, prompt transmission, and natural Telugu follow-up generation.
  - Captured screenshots: `telugu_parent_dashboard_1791092600045.png` and `telugu_counselling_workspace_1791092704916.png`.

---

## Brick 28: Parent Concerns (`/parent/concerns`)

### Goal & Purpose
Build a specialized, highly accessible, low-literacy-friendly Parent Concerns experience at `/parent/concerns`. Parents who may be low-literate, unfamiliar with digital portals, or more comfortable with Telugu/regional languages and speaking rather than typing can express what worries them regarding their child's vocational pathway through **large icons + very simple words + voice/audio interaction**.

### 1. Files & Components Created / Modified
- **Backend Components**:
  - [`backend/schemas/parent.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/parent.py): Added `CreateParentConcernRequest` and `ParentConcernResponse`.
  - [`backend/schemas/__init__.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/schemas/__init__.py): Re-exported parent concern schemas.
  - [`backend/api/routers/parent.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/api/routers/parent.py): Added `POST /api/parent/concerns` (creates authenticated concern) and `GET /api/parent/concerns` (lists authenticated parent's concerns).
  - [`backend/services/counselling_service.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/services/counselling_service.py): Added prompt directives and tailored follow-up question sets for all 8 `concern_*` intents.
  - [`backend/tests/test_parent_concerns.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_parent_concerns.py): Created 5 test cases validating RBAC, cross-student isolation, unauthenticated 401, student 403, and persistence.
- **Frontend Components**:
  - [`frontend/src/types/parent.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/types/parent.ts): Defined `ParentConcernCategory`, `CreateParentConcernPayload`, `ParentConcernItem`, and `ParentConcernCardDef`.
  - [`frontend/src/services/parentService.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/services/parentService.ts): Added `saveConcern()` and `listConcerns()` API methods with offline mock fallbacks.
  - [`frontend/src/components/parent/ParentConcernCard.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/parent/ParentConcernCard.tsx): Reusable card with large Lucide icon, large tap area, minimal text, keyboard accessibility, and Web Speech Synthesis read-aloud button (`🔊`).
  - [`frontend/src/components/parent/ParentConcernGrid.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/parent/ParentConcernGrid.tsx): 8-card responsive grid component.
  - [`frontend/src/components/parent/ParentVoicePrompt.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/parent/ParentVoicePrompt.tsx): Voice speaking affordance with visual listening feedback and real-time Web Speech Recognition.
  - [`frontend/src/components/parent/ParentConcernHeader.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/parent/ParentConcernHeader.tsx): Conversational title, child context badge, back navigation, and human counsellor escalation button (`👤 Talk to a Person`).
  - [`frontend/src/pages/parent/ParentConcerns.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/pages/parent/ParentConcerns.tsx): Full parent concerns workspace, loading/error/empty state handling, and "Other" custom query modal.
  - [`frontend/src/pages/parent/ParentHome.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/pages/parent/ParentHome.tsx): Integrated warm discovery card linking directly to `/parent/concerns`.
  - [`frontend/src/context/LanguageContext.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/context/LanguageContext.tsx): Added English and natural, culturally meaningful Telugu translations for all 8 categories, cards, audio labels, and headers.

### 2. Parent Context Source & Authorization
- Resolves authenticated user with `role: parent`.
- Queries `ParentStudentAssociation` on the server to retrieve the primary linked child context.
- Frontend IDs are never trusted for authorization. If no student is linked, returns neutral empty state (`"No student profile is linked to your account yet."`).
- Associates the linked `student_profile_id` with the newly created `ParentConcern` row in PostgreSQL/SQLite.

### 3. The 8 Exact Canonical Concern Categories
| # | Category | Intent | English Card Title / Subtitle | Meaningful Telugu Title / Subtitle | Lucide Icon |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Income** | `concern_income` | **Income**<br>*Can my child earn enough?* | **ఆదాయం & జీతం**<br>*నా బిడ్డ తగినంత సంపాదించగలరా?* | `Coins` (Emerald) |
| 2 | **Job Security** | `concern_job_security` | **Job**<br>*Can my child get a job?* | **ఉద్యోగ భద్రత**<br>*నా బిడ్డకు ఉద్యోగం ఖచ్చితంగా దొరుకుతుందా?* | `Briefcase` (Blue) |
| 3 | **Further Education** | `concern_further_education` | **Study More**<br>*Can my child study further?* | **పై చదువులు**<br>*నా బిడ్డ తర్వాత ఇంకా పై చదువులు చదువుకోవచ్చా?* | `GraduationCap` (Purple) |
| 4 | **Social Perception** | `concern_social_perception` | **Respect**<br>*What will others think?* | **సమాజంలో గౌరవం**<br>*బంధువులు మరియు ఇతరులు ఏమనుకుంటారు?* | `Users` (Rose) |
| 5 | **Distance** | `concern_distance` | **Distance**<br>*Is the work too far from home?* | **సమీపంలో పని**<br>*పని ఇంటికి చాలా దూరంగా ఉంటుందా?* | `MapPin` (Amber) |
| 6 | **Working Conditions** | `concern_working_conditions` | **Work Safety**<br>*What is the work like? Is it safe?* | **పని వాతావరణం**<br>*పని ఎలా ఉంటుంది? సురక్షితమైనదేనా?* | `Wrench` (Teal) |
| 7 | **Career Growth** | `concern_career_growth` | **Growth**<br>*Can my child get a better job later?* | **కెరీర్ ఎదుగుదల**<br>*భవిష్యత్తులో మంచి పదోన్నతి వస్తుందా?* | `TrendingUp` (Indigo) |
| 8 | **Other** | `concern_other` | **Other Question**<br>*I have another worry or question.* | **ఇతర సందేహం**<br>*నాకు వేరొక సందేహం లేదా ప్రశ్న ఉంది.* | `HelpCircle` (Slate) |

### 4. Illiterate & Low-Literacy UX Design
- **Icon + Very Simple Words**: Replaced technical jargon (e.g. "Placement Probability Factor") with everyday language ("Can my child get a job?").
- **Large Touch Targets**: Cards feature min-h 64px tap area, generous padding, and clear active scaling.
- **Audio Read-Aloud (`🔊`)**: Every card includes a dedicated text-to-speech button powered by Web Speech Synthesis (`SpeechSynthesisUtterance`) that reads the title and question aloud in English or Telugu (`te-IN`), allowing non-reading parents to understand effortlessly.

### 5. Voice Interaction Affordance
- **`🎙️ Tell us your concern`**: Prominent voice banner above the concern grid.
- Uses Web Speech Recognition (`webkitSpeechRecognition` / `SpeechRecognition`) with visual audio pulse animation and Telugu/English language auto-configuration.
- Shows live transcribed text with a one-click **"Ask Counsellor"** button.

### 6. Concern Persistence & Direct Counselling Navigation
- Selecting any concern triggers two actions:
  1. `POST /api/parent/concerns`: Records the concern in the backend database with `status: OPEN`, category, and description.
  2. Navigates to `/parent/counselling` passing `explainContext`:
     ```json
     {
       "entity_type": "concern",
       "entity_id": "Income",
       "entity_title": "Income",
       "intent": "concern_income"
     }
     ```
     together with the pre-populated initial question.
- Seamlessly reuses the existing Brick 25 & Brick 26 AI counselling interface without building a second chatbot.

### 7. Social Perception & Working Conditions Empathetic Handling
- In [`backend/services/counselling_service.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/services/counselling_service.py):
  - **`concern_social_perception` Directive**: Instructs the AI counsellor to address parental anxiety regarding prestige, family honor, and societal perception with warm empathy, reassurance, and factual data about respected trades and national qualification recognition.
  - **`concern_working_conditions` Directive**: Instructs the AI counsellor to explain daily workshop safety standards, physical demands, protective gear (PPE), and government ITI guidelines with calm, grounded facts.

### 8. Human Counsellor Escalation Affordance
- Header features **`👤 Talk to a Person`** (`talkToPerson`).
- Clicking it routes into `/parent/counselling` with an explicit human escalation request prompt, immediately triggering the Brick 20 human escalation notice and ticket creation.

### 9. Verification & Automated Test Results
- **New Parent Concerns Tests** ([`backend/tests/test_parent_concerns.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_parent_concerns.py)): **5 passed, 0 failed**.
- **Full Backend Pytest Suite**: **179 passed, 0 failed** in 41.83s.
- **Frontend Production Bundle**: `npm run build` completed with zero TypeScript compilation errors or warnings.
- **End-to-End Live API & AI Pipeline**: Verified with real parent token on running server (`POST /api/parent/concerns` -> 201 Created; `GET /api/parent/concerns` -> 200 OK; `POST /api/counselling/sessions/{id}/messages` with `concern_income` -> 200 OK grounded response).
- **Manual Actions Required**: None. All components and services are operational.

---

## Phase 5 — Brick 29: Parent AI Counselling (`/parent/counselling`)

### 1. Executive Summary & Core Purpose
Implemented **Brick 29 — Parent Counselling**, the primary AI counselling interface tailored for parents to understand and make informed decisions about their child's vocational education and career.
Designed from the ground up for low-literacy parents and regional language comfort, the system strictly relies on verified empirical evidence, structured parent concerns, child context, voice interaction, and accessible escalation to human counsellors.

---

### 2. Components Created & Modified

#### Created:
- [`frontend/src/services/voice.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/services/voice.ts): Clean voice provider abstraction separating Text-to-Speech (TTS) and Speech-to-Text (STT) from UI components. Implements `BrowserVoiceService` using Web Speech API (`SpeechSynthesis` and `SpeechRecognition`) with Indian English (`en-IN`) and Telugu (`te-IN`) support, and markdown tag stripping for natural pronunciation.

#### Modified:
- [`backend/api/routers/counselling.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/api/routers/counselling.py):
  - Updated `create_counselling_session` to automatically resolve authenticated parent's linked student context (`ParentStudentAssociation`) when not explicitly passed, preventing frontend from needing to query or supply student IDs.
- [`backend/services/counselling_service.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/services/counselling_service.py):
  - Updated `build_system_prompt(language, user_role)` to accept `user_role` and enforce low-literacy parent guidance:
    - Simple, jargon-free explanations (e.g. no academic economic jargon).
    - Respectful handling of social perception/prestige questions without shaming.
    - Structured long answers (short sections, simple headings, bullet points, highlighted numbers, clear conclusions).
    - Honest decision support without emotional manipulation.
    - Grounding directives for all 8 canonical parent concerns (`concern_income`, `concern_job_security`, `concern_further_education`, `concern_social_perception`, `concern_distance`, `concern_working_conditions`, `concern_career_growth`, `concern_other`).
- [`frontend/src/context/LanguageContext.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/context/LanguageContext.tsx):
  - Added bilingual English and natural, grammatically correct Telugu translations for: `parentYou`, `studentYou`, `vocationalCounsellor`, `listenToAnswer`, `stopListening`, `ttsUnavailable`, `notFullySureNotice`, `talkToHumanCounsellor`, `humanReviewAdvised`, `statutoryRecordsSupported`, `generalGuidanceNotice`, `limitedDataNotice`, `askByVoice`, `voiceHelpText`, `voicePromptBannerTitle`, `voicePromptBannerSubtitle`, `speakNaturallySamples`.
- [`frontend/src/components/counselling/ChatMessage.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/ChatMessage.tsx):
  - Added sender identification recognizing parent (`parentYou`) vs student vs AI counsellor.
  - Added accessible `🔊 Listen` / `⏹️ Stop` Web Speech Synthesis read-aloud button on each AI response with markdown tag cleaning.
  - Added parent-friendly low-confidence notice: *"I don't have enough verified information to answer that with full confidence"* with direct `[ 👤 Talk to a Human Counsellor ]` action button.
- [`frontend/src/components/counselling/MessageComposer.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/MessageComposer.tsx):
  - Added one-touch microphone button for voice speech-to-text input with live recording state and bilingual placeholder.
- [`frontend/src/components/counselling/HumanEscalationNotice.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/HumanEscalationNotice.tsx):
  - Added bilingual Telugu/English copy and `onEscalate` action button for instant counsellor connection.
- [`frontend/src/pages/parent/ParentCounselling.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/pages/parent/ParentCounselling.tsx):
  - Added `ParentVoicePrompt` banner (`🎙️ Ask your question by voice`) for natural speaking without typing.
  - Added header action `👤 Talk to a Human Counsellor` with automatic escalation dispatching.
  - Added the 8 canonical parent concern starter cards in the empty state.
  - Integrated `onEscalate` prop forwarding to `ChatMessage` and `HumanEscalationNotice`.

---

### 3. Backend Endpoints Used
1. `GET /api/counselling/sessions`: Lists parent's active and previous guidance sessions.
2. `POST /api/counselling/sessions`: Creates a new session; backend verifies authenticated parent and resolves authorized child.
3. `GET /api/counselling/sessions/{id}`: Retrieves full message history and context.
4. `POST /api/counselling/sessions/{id}/messages`: Processes parent question through RAG retriever and AI provider, generating structured evidence-grounded response.

---

### 4. Parent / Child Authorization Flow
- The backend enforces parent-child authorization on session creation and message processing:
  ```text
  Authenticated Parent (JWT / Session)
           ↓
  ParentStudentAssociation Lookup
           ↓
  Authorized Student Profile ID (Backend strictly enforced)
           ↓
  Child Profile + Career Intent + Job Outcomes
           ↓
  Parent Concern + Verified Statutory Evidence
           ↓
  AI Counselling Response
  ```
- If a parent attempts to access another student's session or profile, the backend rejects it with `403 Forbidden` (`FORBIDDEN_PARENT_ACCESS`).

---

### 5. AI Input Context Structure
The counselling service constructs a structured, scoped context payload:
```json
{
  "child": {
    "education": "Class 10 Pass",
    "location": "Telangana / Warangal",
    "interests": "Practical mechanical work, circuits",
    "career": "Automobile Technician"
  },
  "career": {
    "id": 11,
    "name": "Automobile Technician",
    "nsqf_level": "Level 4",
    "training_duration": "1 Year"
  },
  "parent_concern": {
    "category": "income",
    "intent": "concern_income"
  },
  "evidence": [
    {
      "source": "MSDE / NCVT Survey",
      "metric": "Starting monthly wage ₹12,000 - ₹18,000",
      "confidence": 0.85
    }
  ],
  "conversation_history": [ ... ]
}
```

---

### 6. Evidence Retrieval Flow (Source of Truth)
- Uses the existing RAG vector & metadata retriever (`KnowledgeBase` + `EmbeddingProvider`).
- Facts regarding starting wage, placement percentage, NSQF qualifications, and training duration are strictly anchored to verified records.
- Hallucinations are prohibited: if verified evidence is unavailable, the AI explicitly states: *"I don't have enough verified information to answer that with full confidence"* and offers a human counsellor next step.

---

### 7. Conversation Persistence & Long Conversations
- Messages and sessions are persisted in PostgreSQL/SQLite using `CounsellingSession` and `CounsellingMessage` tables.
- Parents can navigate away, close the browser, and return to `/parent/counselling` with full session history preserved in the sidebar.
- Long conversation handling: Scopes prompt history to recent turns and context summaries to prevent unbounded context growth while preserving child and career grounding.

---

### 8. Long AI Answers & Low-Literacy Formatting
- When complex questions require thorough explanations, answers are structured with:
  - Short sections with clear headings
  - Bulleted lists
  - Highlighted numbers and benchmarks
  - Direct, clear conclusions
  - Zero academic or economic jargon

---

### 9. Voice & Read-Aloud Architecture
- **Speech-to-Text (STT)**:
  - Prominent voice banner (`🎙️ Ask your question by voice`) and microphone button in message composer.
  - Browser Web Speech Recognition configured for `te-IN` (Telugu) or `en-IN` (English).
- **Text-to-Speech (TTS / Read-Aloud)**:
  - Accessible `🔊 Listen` button on each AI response.
  - Strips markdown formatting for smooth speech delivery.
  - Shows clear notice if browser lacks speech synthesis instead of failing silently.
  - Vendor-agnostic provider abstraction in `frontend/src/services/voice.ts`.

---

### 10. Human Counsellor Escalation
- Immediate escalation triggers:
  1. AI confidence score $< 0.4$ (`limitedDataNotice`).
  2. `requires_human: true` in AI response.
  3. Parent clicks `👤 Talk to a Human Counsellor` in topbar or message prompt.
- Escalation creates an assigned referral record (`HumanEscalation`) for certified vocational counsellors to review.

---

### 11. Contextual Explain Compatibility
- Fully compatible with Brick 26 "Explain" actions from Career cards, Salary cards, and Parent Concern cards.
- When clicked, passes `explainContext` in route state, automatically generating the contextual explanation without requiring manual parent typing.

---

### 12. Verification & Automated Test Results
- **Full Backend Pytest Suite**: **179 passed, 0 failed** in 28.46s:
  - `test_counselling.py`: Session creation, parent self, structured prompt grounding, human escalation, follow-up context.
  - `test_counselling_explain.py`: Career explain, salary explain, parent authorized contextual session, cross-student rejection.
  - `test_parent_concerns.py`: 8 canonical categories, student forbidden, parent isolation.
  - `test_parent_dashboard.py`: Child context resolution, empty state, auth barriers.
- **Frontend Production Build**: `tsc -b && vite build` built in 2.19s with **0 errors**.
- **Manual Actions Required**: None. All features are verified and functional.

---

## Phase 8 — Voice: Brick 30: Voice Counselling

### 1. Executive Summary & Core Purpose
Implemented **Phase 8 — Brick 30: Voice Counselling**, delivering an accessible, parent-first voice interaction loop for vocational counselling in **Telugu** and **English**:
```text
Spoken Telugu Question (Natural Speech)
              ↓
  Speech-to-Text (STTProvider)
              ↓
  Existing Counselling Pipeline (POST /api/counselling/sessions/{id}/messages)
              ↓
  RAG Verified Evidence Retrieval (NCVT / MSDE Records)
              ↓
  Backend AIProvider (Gemini Grounded Inference)
              ↓
  Structured Response + Sentence Chunking
              ↓
  Text-to-Speech (TTSProvider)
              ↓
Spoken Telugu Audio Playback
```

Voice is treated as a primary mode of communication for illiterate and low-literacy parents rather than a decorative accessory. It operates seamlessly alongside typed text chat within the same continuous conversation history.

---

### 2. Voice Components Created
- [`frontend/src/services/voice.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/services/voice.ts): Formal provider architecture defining:
  - `STTProvider` interface: `isSupported()`, `getSupportedLanguages()`, `start(language, callbacks)`.
  - `TTSProvider` interface: `isSupported()`, `getSupportedLanguages()`, `synthesize(text, language, callbacks)`.
  - `BrowserSTTProvider`: Implements Web Speech Recognition API with `te-IN` and `en-IN`.
  - `BrowserTTSProvider`: Implements Web Speech Synthesis API with intelligent chunking (~180 char boundary splits on Telugu/English sentence punctuation `.` `!` `?` `।` `\n`) to prevent browser speech cutoff on long answers.
  - `VoiceServiceManager`: High-level voice coordinator with state lifecycle (`idle`, `listening`, `confirming`, `processing`, `speaking`), pause/resume/stop methods, and backward compatibility.
- [`frontend/src/components/counselling/VoiceCounsellingWidget.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/VoiceCounsellingWidget.tsx): High-visibility, accessible parent voice widget featuring:
  - Large accessible microphone button (min-h 56px).
  - Explicit multi-state handling:
    - **Idle**: `🎙️ Tap to speak` (`voiceIdleBtn`)
    - **Listening**: `🔴 Listening... Speak now` (`voiceListeningBtn`) with accessible animated pulse (not color-only).
    - **Confirming**: Shows `"You said: ..."` with `[ Send ]` and `[ Speak Again ]` actions; reading is optional with one-tap or auto-send.
    - **Processing**: `Thinking...` (`voiceProcessing`)
    - **Speaking**: `🔊 Speaking answer...` (`voiceSpeaking`) with `[ ⏹ Stop ]` control.
    - **Error**: User-friendly retry with `[ 🎙️ Try Again ]` button.

---

### 3. Backend Components & Integration
- Uses existing backend counselling pipeline:
  - `POST /api/counselling/sessions`: Creates/resumes authorized session.
  - `POST /api/counselling/sessions/{id}/messages`: Processes transcribed question.
- Backend derives all authorization from JWT session; no client-provided IDs are trusted.
- Zero Gemini API keys or cloud credentials in the frontend. All AI and evidence retrieval stays strictly on the backend.

---

### 4. STT Provider Used
- `BrowserSTTProvider` utilizing the browser's standard Speech Recognition engine (`SpeechRecognition` / `webkitSpeechRecognition`).
- Native recognition for Telugu (`te-IN`) and Indian English (`en-IN`).
- Provider interface allows replacing with backend cloud STT (e.g. Whisper, Google Cloud Speech, Bhashini) with zero component changes.

---

### 5. TTS Provider Used
- `BrowserTTSProvider` utilizing browser's standard Speech Synthesis (`window.speechSynthesis`).
- Sentence and phrase chunking prevents browser truncation on long, detailed AI responses.
- Strips markdown formatting (`###`, `**`, bullets, code blocks) so speech sounds natural.
- Native voice playback in Telugu (`te-IN`) and Indian English (`en-IN`).

---

### 6. AI Provider Used
- Existing backend `AIProvider` configured with `AI_PROVIDER=gemini` via `backend/ai/providers/gemini.py`.
- No new provider created; reuses established RAG evidence retrieval and schema validators.

---

### 7. Telugu & English Support Status
- **Telugu (`te-IN`)**: Primary focus. Natural speech recognition and playback; supports colloquial phrasing (`"నా కొడుకు ఈ కోర్స్ చేసిన తర్వాత ఎంత సంపాదించగలడు?"`, `"ఉద్యోగం దొరుకుతుందా?"`).
- **English (`en-IN`)**: Full parity with natural Indian English recognition and speech synthesis.
- Extensible to other regional languages (Hindi, Tamil, Kannada) via the language parameter in `STTProvider` and `TTSProvider`.

---

### 8. Parent & Student Voice Flows
- **Parent Portal (`/parent/counselling`)**:
  - Voice is front and center via `VoiceCounsellingWidget` on the landing screen and above the composer.
  - Parents can ask questions by voice, receive evidence-grounded answers, and listen to the audio response.
- **Student Portal (`/student/counselling`)**:
  - `MessageComposer` provides voice recording microphone button.
  - `ChatMessage` provides `🔊 Listen` audio read-aloud on every AI answer.

---

### 9. Conversation Persistence & Context
- Voice questions and AI audio answers are stored in `CounsellingSession` and `CounsellingMessage` tables.
- Text and voice alternate seamlessly within the same session.
- Context is preserved: follow-up questions understand references to previously discussed careers and child profiles without repeating.

---

### 10. Long-Answer Handling
- Long AI responses are not truncated for voice.
- `BrowserTTSProvider` splits the full text into grammatical sentence segments and queues them sequentially.
- Visual chunk indicator (`Section X of Y`) informs parents of playback progress.
- `⏹ Stop` button immediately halts audio playback at any time.

---

### 11. Failure Handling
- **STT Failure**: Displays user-friendly notice: *"We couldn't understand that. Please try speaking again."* / *"మీ మాటలు స్పష్టంగా వినపడలేదు. దయచేసి మళ్లీ మాట్లాడండి."* with a large `[ 🎙️ Try Again ]` button. Zero technical error codes or stack traces.
- **TTS Failure**: Displays *"Your answer is ready. Voice playback isn't available right now. You can still read the answer below."* Conversation text and structured cards remain intact.
- **AI / Network Failure**: Displays controlled retry banner without discarding the parent's spoken question.

---

### 12. Human Escalation Behavior
- If the AI confidence is low ($< 0.4$) or `requires_human: true`, the voice UI presents an accessible `[ 👤 Talk to a Human Counsellor ]` action button.
- Tapping it sends the escalation inquiry immediately without requiring typing.

---

### 13. Contextual Explain Integration
- Fully integrated with Brick 26 "Explain" actions. When navigating from Career or Salary cards with `explainContext`, the AI explanation is generated and can be heard immediately via `🔊 Listen`.

---

### 14. Accessibility & Mobile-First
- Large touch targets ($\ge 56$px) for comfortable tapping on mobile devices.
- Visual state indicators use both text and animated shapes (not color alone).
- Full keyboard navigation (Space/Enter to trigger voice).
- High contrast, calm surfaces, zero neon/glowing gradients.

---

### 15. Tests Performed & Results
- **Frontend Build (`npm run build`)**: `tsc -b && vite build` built successfully in 2.31s with **0 errors**.
- **Backend Targeted Pytest (`tests/test_counselling.py`, `tests/test_counselling_explain.py`, `tests/test_parent_concerns.py`, `tests/test_parent_dashboard.py`)**: **54 passed, 0 failed** in 19.79s.
- **Full Backend Pytest Suite**: **179 passed, 0 failed**.

---

### 16. Provider Configuration & Manual Action
- **Zero API keys required for frontend**: Web Speech APIs run natively in the browser without third-party accounts, billing, or secrets.
- **Manual Actions Required**: None. All services and components are fully operational.

---

# PHASE 9 — Human Counsellor

## Brick 31 — Human Escalation & Role Switcher Isolation

### Goal
Implement the human counsellor escalation system and enforce strict, safe role-switching boundaries:
1. Provide a transparent, reassuring escalation path from AI counselling to human counsellors (`/parent/counselling`, `/student/counselling`) with case-record tracking.
2. Enforce strict role switching: seamless toggling between Student and Parent family views, while completely preventing switching to or from the Administrator role.

---

### 1. Architectural Case Record Model
- **Database Schema** ([`backend/models/counselling.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/models/counselling.py)):
  - Updated `HumanEscalation` table to store complete case context:
    - `id` (Integer, Primary Key)
    - `counselling_session_id` (ForeignKey to `counselling_sessions.id`)
    - `student_id` (ForeignKey to `student_profiles.id`, nullable)
    - `parent_id` (ForeignKey to `parent_profiles.id`, nullable)
    - `career_id` (ForeignKey to `occupations.id`, nullable)
    - `concern` (String(100), standardized category: `job_security`, `salary`, `career_growth`, etc.)
    - `language` (String(10), e.g. `'te'`, `'en'`)
    - `reason` (Text, user-facing rationale or escalation trigger)
    - `notes` (Text, optional parent/student notes)
    - `conversation_summary` (Text, deterministic factual summary of the session)
    - `priority` (Enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT`)
    - `status` (Enum: `PENDING`, `IN_PROGRESS`, `RESOLVED`, `CANCELLED`)
    - `created_at`, `updated_at` (DateTime timestamps)
  - Created Alembic migration [`backend/alembic/versions/0005_human_escalation_case_record.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/alembic/versions/0005_human_escalation_case_record.py).

---

### 2. Escalation Service & Factual Summarization
- Implemented in [`backend/services/counselling_service.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/services/counselling_service.py):
  - `resolve_user_student`: Securely discovers student context for students or linked parents.
  - `resolve_student_career`: Obtains verified target occupation from student profile or session messages.
  - `normalize_concern`: Maps raw voice or text inputs to standard categories.
  - `generate_escalation_summary`: Generates factual dialogue synthesis grounded solely in actual conversation messages without hallucinated facts.
  - `create_escalation`: Creates a persistent case record. Idempotent: returns existing active record if a `pending` or `in_progress` escalation already exists for that session, preventing duplicate submissions.
  - `list_escalations` & `get_escalation`: Provides secure case inspection.

---

### 3. API Endpoints
- **Student & Parent Escalations** ([`backend/api/routers/counselling.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/api/routers/counselling.py)):
  - `POST /api/counselling/escalations`: Submits escalation inquiry with session and concern context (HTTP 201 Created).
  - `GET /api/counselling/escalations`: Lists escalation records for the caller's authorized family context.
  - `GET /api/counselling/escalations/{id}`: Detailed escalation case record.
- **Admin Review** ([`backend/api/routers/admin.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/api/routers/admin.py)):
  - `GET /api/admin/escalations`: Lists all system escalation cases with filter by status (`pending`, `in_progress`, `resolved`).

---

### 4. User Experience & Reassurance
- **HumanEscalationModal** ([`frontend/src/components/counselling/HumanEscalationModal.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/HumanEscalationModal.tsx)):
  - Reassuring tone: *"A counsellor will review your questions and help your family understand the next steps."*
  - Concern category selector with simple labels in English and Telugu.
  - Optional notes input.
  - Active status badges (`Pending Review`, `In Progress`, `Resolved`).
- **HumanEscalationNotice** ([`frontend/src/components/counselling/HumanEscalationNotice.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/HumanEscalationNotice.tsx)):
  - Calm, persistent banner alerting the family if a case is currently active or resolved.
  - Prompt card: *"Need more guidance? Sometimes a question is easier to discuss with a person."*

---

### 5. Strict Role-Switching Isolation
- **User Requirement**:
  - *"Switching between parent and student views has to be possible, switching between administrator and others should not be possible at all."*
- **Frontend Navbar Implementation** ([`frontend/src/components/layout/Navbar.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/layout/Navbar.tsx)):
  - Removed `switch-admin` dropdown option completely.
  - When logged in as `student`, only "Switch to Parent View" is rendered.
  - When logged in as `parent`, only "Switch to Student View" is rendered.
  - When logged in as `admin`, **no role switching options are rendered at all**; only Log Out is available.
- **Auth Context Security Guard** ([`frontend/src/context/AuthContext.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/context/AuthContext.tsx)):
  - Restricted `switchRole` signature to strictly accept `'student' | 'parent'`.
  - Added runtime guards:
    - Throws error if any attempt is made to switch to `admin` or an unauthorized role.
    - Throws error if an `admin` account attempts to switch views.
- **Full Localization** ([`frontend/src/context/LanguageContext.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/context/LanguageContext.tsx)):
  - Added `switchToStudent` ("Switch to Student View" / "విద్యార్థి వీక్షణకు మారండి") and `switchToParent` ("Switch to Parent View" / "తల్లిదండ్రుల వీక్షణకు మారండి").

---

### 6. Verification Results
- **Backend Tests** ([`backend/tests/test_escalations.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_escalations.py)):
  - 10 automated test cases verifying escalation creation, duplicate deduplication, summary generation, student/parent RBAC security, and admin overview.
  - Full suite passing: **189 passed, 0 failed**.
- **Frontend Build**:
  - `tsc -b && vite build` bundled successfully with **0 errors**.

---

# PHASE 9 — Reliability

## Brick 33 — Error Handling

### Goal
Implement a consistent application-wide error handling architecture across backend, frontend, AI, database, RAG, voice, authentication, and network layers.
**Core Directive**: Never expose raw technical errors, stack traces, SQL internals, or provider exceptions to parents or students.

---

### 1. Error Architecture Created
- **Multi-Tier Boundary**:
  - **Backend Layer** ([`backend/core/errors.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/core/errors.py), [`backend/core/handlers.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/core/handlers.py)): Centralized exception hierarchy, status classification, sensitive data redactor, and global exception handlers.
  - **Transport / Correlation** ([`backend/core/middleware.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/core/middleware.py)): `CorrelationIdMiddleware` injecting and preserving `X-Correlation-ID` headers across all requests and responses.
  - **Frontend Normalizer** ([`frontend/src/utils/errors.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/utils/errors.ts)): `normalizeError` converting API errors, network drops, timeouts, and unhandled rejections into uniform `AppError` instances with bilingual recovery actions.
  - **Client Transport** ([`frontend/src/lib/apiClient.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/lib/apiClient.ts)): Centralized fetch interceptor with bounded retry for safe GET operations, correlation ID tracking, and automatic auth expiry management.
  - **Rendering Safeguard** ([`frontend/src/components/common/ErrorBoundary.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/common/ErrorBoundary.tsx)): Application-level React error boundary guarding against white-screen render crashes.

---

### 2. Backend Error Codes
Strictly mapped to canonical standard codes in [`ErrorCode`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/core/errors.py):
- `AI_UNAVAILABLE` (503, retryable)
- `DATABASE_UNAVAILABLE` (503, retryable)
- `VOICE_UNAVAILABLE` (503, non-retryable)
- `INVALID_AI_RESPONSE` (502, retryable)
- `NO_CAREER_MATCH` (404, non-retryable)
- `NO_VERIFIED_EVIDENCE` (404, non-retryable)
- `NETWORK_ERROR` (Client, retryable)
- `AUTHENTICATION_REQUIRED` (401, non-retryable)
- `FORBIDDEN` (403, non-retryable)
- `VALIDATION_ERROR` (422, non-retryable)
- `RATE_LIMITED` (429, retryable)
- `REQUEST_TIMEOUT` (504, retryable)
- `INTERNAL_ERROR` (500, retryable)

---

### 3. Frontend Error Handling
- Normalizes all runtime failures via `normalizeError`:
  - Returns `AppError` containing `code`, `userMessageEn`, `userMessageTe`, `action`, `retryable`, and `correlationId`.
  - Zero raw `TypeError: Failed to fetch`, `AxiosError`, or `SQLAlchemyError` reaches the UI.

---

### 4. API Client Changes
- Enhanced [`apiClient.ts`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/lib/apiClient.ts):
  - Automatically parses backend `{ error: { code, message, retryable, correlation_id } }` payloads.
  - Attaches authorization tokens securely.
  - Bounded retry: up to 2 retries with exponential backoff on transient 502/503/504 errors for safe/idempotent GET queries.
  - Never blindly retries mutations (POST/PUT/DELETE) without explicit permission.

---

### 5. React Error Boundary
- Created [`ErrorBoundary.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/common/ErrorBoundary.tsx):
  - Wraps the top-level app in [`App.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/App.tsx).
  - Presents a calm, reassuring card with a **"Refresh Page / రీఫ్రెష్ చేయండి"** recovery action.
  - Component stacks and traces are logged exclusively to the developer console, never displayed to the user.

---

### 6. AI Error Handling
- Catches upstream `AIProviderUnavailableError` and Gemini timeouts in [`ai_provider_exception_handler`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/core/handlers.py):
  - Formats as `AI_UNAVAILABLE` with user message: *"The AI counsellor is temporarily unavailable. Please try again in a little while."*
  - Zero `GoogleGenerativeAIError` or upstream stack traces leaked.

---

### 7. Database Error Handling
- Catches `SQLAlchemyError` and `DBAPIError` in [`sqlalchemy_exception_handler`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/core/handlers.py):
  - Masks raw table names, query strings, and database connection strings.
  - Formats as `DATABASE_UNAVAILABLE` with user message: *"We couldn't load this information right now. Please try again shortly."*

---

### 8. Voice Error Handling
- Voice permissions denied: *"Microphone access is turned off. Please allow microphone access to use voice."* / *"మైక్రోఫోన్ అనుమతి నిలిపివేయబడింది."*
- STT failure: *"I couldn't understand that. Please try speaking again."* with one-tap `[ Try Voice Again ]` and `[ Type a Question ]`.
- TTS failure: *"I couldn't play the answer aloud. You can still read the answer below."* Conversation text remains completely intact.

---

### 9. Invalid AI Response Handling
- Handles malformed model outputs via `InvalidAIResponseException`:
  - Returns `INVALID_AI_RESPONSE` with status 502.
  - Directs parents to either re-prompt or connect with a human counsellor.

---

### 10. No-Career Handling
- When recommendations or searches return 0 matching entries:
  - Formats as `NO_CAREER_MATCH` (404) with calm guidance: *"We couldn't find a career that matches these preferences yet. Try changing your preferences."*
  - Offers direct `[ Change Preferences ]` and `[ Talk to AI ]` actions instead of blank pages.

---

### 11. No-Evidence Handling
- When factual statutory evidence is missing for a user query:
  - Returns `NO_VERIFIED_EVIDENCE` (404) with explicit reassurance: *"I don't have enough verified information to answer that with full confidence."*
  - Offers immediate escalation to a human counsellor. AI is strictly forbidden from fabricating facts to avoid an error.

---

### 12. Network / Timeout Handling
- Handled at transport layer:
  - Timeouts format as `REQUEST_TIMEOUT`: *"The request is taking longer than expected. Please try again."*
  - Connectivity drops format as `NETWORK_ERROR`: *"We couldn't connect right now. Please check your internet connection and try again."*

---

### 13. Authentication Handling
- Session expiration formats as `AUTHENTICATION_REQUIRED` (401):
  - Message: *"Your session has expired. Please sign in again."* / *"మీ సెషన్ ముగిసింది. దయచేసి మళ్ళీ సైన్ ఇన్ చేయండి."*
  - Clears stale tokens and provides clean login action.

---

### 14. Authorization Handling
- Forbidden operations format as `FORBIDDEN` (403):
  - Generic message: *"You do not have permission to view or modify this information."*
  - Avoids disclosing whether requested records exist for other students or parents, preventing ID enumeration.

---

### 15. Retry Behavior
- Idempotent GET requests: bounded retry (up to 2 attempts with 400ms delay).
- Non-idempotent mutations (POST escalation creation, student profile updates): never retried automatically to prevent duplicate records.

---

### 16. Parent-Facing Messages
- Simple, respectful, non-technical Telugu and English strings.
- Eliminates technical jargon like "token", "payload", "SQL", "null", "undefined".

---

### 17. Student-Facing Messages
- Clear guidance with actionable recovery buttons (`[ Change Preferences ]`, `[ Try Again ]`, `[ Talk to AI ]`).

---

### 18. Logging Implementation
- Backend logging via Python's standard `logging` with `sih.request` and `sih.error` loggers:
  - Captures timestamp, correlation ID, endpoint, status code, exception type, and stack trace server-side.
  - Sensitive data filtering via `mask_sensitive_data` automatically scrubs passwords, auth tokens, Gemini API keys, and Aadhaar numbers.

---

### 19. Correlation ID Implementation
- Handled by `CorrelationIdMiddleware`:
  - Automatically generates `corr_<hex>` or preserves client `X-Correlation-ID`.
  - Propagated to response headers and included in error responses for easy tracing.

---

### 20. Security Verification
- Verified zero exposure of:
  - `GEMINI_API_KEY`
  - `DATABASE_URL`
  - Internal filesystem paths
  - Raw SQL queries or table names
  - Passwords or JWT secrets

---

### 21. Tests Added
- Created [`backend/tests/test_error_handling.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_error_handling.py) with 12 targeted automated tests:
  1. `test_correlation_id_generated_and_returned`
  2. `test_correlation_id_propagated_if_supplied`
  3. `test_unauthenticated_error_structure`
  4. `test_validation_error_structure`
  5. `test_custom_app_exception_formatting`
  6. `test_no_career_match_exception`
  7. `test_no_verified_evidence_exception`
  8. `test_mask_sensitive_data`
  9. `test_database_error_masking_zero_leakage`
  10. `test_generic_internal_error_zero_stack_trace_leakage`
  11. `test_ai_provider_unavailable_handling`
  12. `test_ai_provider_response_error_handling`

---

### 22. Test Results
- **Backend Test Suite**: **201 passed, 0 failed** in 67.72s.
- **Frontend Production Build**: `tsc -b && vite build` bundled successfully in 3.65s with **0 errors**.
- **Frontend Linting**: `oxlint` passed with **0 errors**.

---

### 23. Environment Changes
- None. Fully compatible with existing `.env` configuration.

---

### 24. Manual Action Required
- None. All error handlers, middleware, and boundaries are active and live.

---

# PHASE 10 — Security & Production Readiness

## Brick 34 — Security Audit & Hardening

### Goal
Perform a comprehensive security audit and hardening pass across the frontend, backend, database, authentication, API layer, AI integration, RAG, voice system, and environment configuration.
**Core Directive**: No secrets exposed, no unauthorized data access, no trusting the frontend for authorization, and no unnecessary personal data stored.

---

### 1. Secrets Audit
- **Exhaustive Scan**: Scanned entire repository for `GEMINI_API_KEY`, `AIza`, `DATABASE_URL`, `postgresql://`, `password=`, `token=`, and `Authorization: Bearer`.
- **Zero Exposed Production Secrets**: All runtime credentials reside strictly on the server in `.env`. Frontend build artifacts (`dist/`) contain zero API keys, JWT secrets, or database URLs.

---

### 2. API Key Exposure Status
- `GEMINI_API_KEY` is loaded exclusively server-side via [`core/config.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/core/config.py).
- Frontend communicates solely with backend API endpoints (`/api/counselling/sessions`, etc.). The frontend never calls Gemini or external AI APIs directly.

---

### 3. .env / .gitignore Status
- **Root `.gitignore`** ([`/.gitignore`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/.gitignore)): Enforces `.env`, `.env.*`, `*.pem`, `*.key`, `credentials.json`, `service-account*.json`, while preserving `!.env.example`.
- **Backend & Frontend `.gitignore`**: Explicitly ignore `.env` files.
- **Git History Verification**: Ran `git log --all --full-history -- "backend/.env" ".env"`: verified `.env` has never been committed.
- **Example Templates**: [`backend/.env.example`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/.env.example) and [`frontend/.env.example`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/.env.example) contain only safe placeholder configurations.

---

### 4. RBAC Audit
- Enforced strictly on backend via [`api/deps.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/api/deps.py):
  - `require_student`: Restricts endpoints to `UserRole.STUDENT`.
  - `require_parent`: Restricts endpoints to `UserRole.PARENT`.
  - `require_admin`: Restricts endpoints to `UserRole.ADMIN`.
- Frontend role guards (`RoleGuard.tsx`) serve exclusively as UX defense-in-depth; all permissions and resource mutations are verified on the server.

---

### 5. Student Authorization Audit
- Student profile identity is strictly derived from the authenticated JWT session token (`current_user.student_profile`).
- Query parameter manipulation (`?student_id=999`) or path manipulation is completely ignored by profile routes.
- [`verify_student_self`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/api/deps.py#L134) rejects cross-student context manipulation with HTTP 403 Forbidden.

---

### 6. Parent-Child Authorization Audit
- Parents are strictly restricted to verified children via [`verify_family_access`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/api/deps.py#L154):
  - Queries `ParentStudentAssociation` table to verify legal family linkage.
  - Rejecting unlinked students with HTTP 403 Forbidden (*"Access denied: Parent is not linked to this student context"*), preventing IDOR attacks.

---

### 7. Admin Authorization Audit
- Admin routes ([`backend/api/routers/admin.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/api/routers/admin.py)) strictly require `require_admin`.
- Non-admin callers (students, parents, unauthenticated users) receive HTTP 401 or 403 Forbidden.

---

### 8. Input Validation Audit
- All incoming payloads validate strictly via Pydantic v2 schemas.
- Bounded lengths and ranges:
  - Counselling message: `1 <= len <= 5000`
  - Escalation notes: `len <= 2000`
  - Career intents: restricted to validated enum list (`VALID_CAREER_INTENTS`)
- Malformed bodies automatically reject with HTTP 422 `VALIDATION_ERROR`.

---

### 9. CORS Configuration
- Configured in [`backend/core/config.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/core/config.py) and [`backend/main.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/main.py):
  - Strict origin whitelist: `["http://localhost:5173", "http://127.0.0.1:5173"]` (no wildcard `*` with credentials).
  - Explicit HTTP methods: `["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]`.

---

### 10. Database Security
- Zero raw SQL string concatenation. All database operations execute through SQLAlchemy ORM with parameterized binding.
- Database credentials (`DATABASE_URL`) never reach the client.
- `SQLAlchemyError` handler intercepts database connection drops or syntax errors, logging tracebacks server-side while returning generic, safe 503 `DATABASE_UNAVAILABLE` messages.

---

### 11. Aadhaar Verification
- **Zero Storage**: Confirmed zero Aadhaar fields or identifiers across all models, migrations, schemas, seed scripts, and frontend forms.
- Verified by automated test `test_privacy_no_aadhaar_fields`.
- Dataset import verification script confirmed `aadhaar_detected: false`.

---

### 12. Personal-Data Minimization
- Profile tables collect only strictly necessary vocational attributes: name, age, district/state, education level, stream, household income range, and trade interests.
- No bank details, PAN, precise GPS coordinates, biometric data, or unrelated family records are collected or stored.

---

### 13. Authentication & Token Security
- Password hashing: **Argon2id** (`time_cost=2`, `memory_cost=65536` / 64 MiB, `parallelism=1`).
- Passwords and password hashes are never returned in API responses or user profiles.
- Access tokens: Signed JWTs with server-side secret and short expiration (30 minutes).
- Refresh tokens: Cryptographically secure 256-bit entropy stored in HttpOnly cookies with server-side revocation tracking.

---

### 14. AI Prompt & Output Security
- Strict prompt boundary: System prompt and evidence retrieval context are assembled exclusively server-side.
- User inputs are treated as untrusted text within bounded prompt delimiters, preventing prompt injection or overriding core instructions.
- AI output is strictly validated against `CounsellingResponse` schema before delivery to the frontend.

---

### 15. RAG Security
- Knowledge base retrieval operates in read-only mode for student and parent users.
- `KnowledgeRetriever` defaults to `verified_only=True`, ensuring guidance cites only verified statutory records.
- Standard students/parents have zero mutation access to occupational or salary benchmarks.

---

### 16. XSS / Security Rendering Audit
- Frontend renders text via safe React DOM nodes (`<h3>`, `<p>`, `<li>`, `<strong>`, `<em>`) in [`ChatMessage.tsx`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/frontend/src/components/counselling/ChatMessage.tsx).
- `dangerouslySetInnerHTML` is completely avoided.

---

### 17. Rate Limiting
- Added [`InMemoryRateLimiter`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/core/rate_limit.py):
  - `rate_limit_login`: 100 req/min per IP to prevent credential brute-forcing.
  - `rate_limit_counselling`: 120 req/min per IP to prevent rapid AI token depletion.
  - Converts violations to standard HTTP 429 `RATE_LIMITED` with `retryable=True`.

---

### 18. Error Leakage Audit
- Verified that responses never leak:
  - Stack traces
  - Database table schemas or query text
  - Absolute server filesystem paths
  - Vendor API keys or credentials

---

### 19. Logging Audit
- Python `sih.request` and `sih.error` loggers:
  - Scrub sensitive values via [`mask_sensitive_data`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/core/errors.py#L190).
  - Redacts `password`, `token`, `secret`, `authorization`, `api_key`, `aadhaar`.

---

### 20. Dependency Audit
- Frontend: `npm audit` / `oxlint` executed cleanly with 0 errors.
- Backend: Standard, maintained dependencies (`fastapi`, `pydantic`, `sqlalchemy`, `argon2-cffi`, `pyjwt`, `google-genai`).

---

### 21. Git Security Audit
- Working tree inspected: `.env` untracked and gitignored.
- Git commit logs verified: zero credentials committed to repository history.

---

### 22. Tests Added
- Created [`backend/tests/test_security_audit.py`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/tests/test_security_audit.py):
  1. `test_security_headers_present`: Verifies `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy`.
  2. `test_student_cannot_access_another_student_profile`: Verifies profile derivation from JWT and `verify_student_self` IDOR rejection.
  3. `test_parent_cannot_access_unlinked_student`: Verifies `verify_family_access` blocks unlinked student access with 403 Forbidden.
  4. `test_student_and_parent_cannot_access_admin_endpoints`: Verifies admin RBAC blocks student and parent roles.
  5. `test_admin_can_access_admin_endpoints`: Verifies admin role access.
  6. `test_password_hash_never_in_user_profile`: Verifies password hashes are never returned.
  7. `test_no_aadhaar_in_any_response`: Verifies zero Aadhaar leakage.
  8. `test_excessively_large_message_rejected`: Verifies payload length validation.
  9. `test_rate_limiter_blocks_rapid_spam`: Verifies sliding-window rate limiter blocks excessive requests.

---

### 23. Test Results
- **Full Backend Pytest Suite**: **210 passed, 0 failed** in 63.42s.
- **Frontend Production Build**: `tsc -b && vite build` built cleanly in 3.74s with **0 errors**.
- **Frontend Linting**: `oxlint` completed with **0 errors**.

---

### 24. Issues Fixed During Audit
1. **Security Headers**: Added [`SecurityHeadersMiddleware`](file:///c:/Users/SAMSUNG/OneDrive/Desktop/sih/backend/core/middleware.py) setting `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
2. **CORS Hardening**: Explicitly restricted `allow_methods` to `["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]`.
3. **Rate Limiting**: Added in-memory rate limiting to `/api/auth/login` and `/api/counselling/sessions/{id}/messages`.
4. **Frontend Git Ignore**: Added `.env` and `.env.*` to `frontend/.gitignore`.

---

### 25. Remaining Risks
- In-memory rate limiting is node-local; in a multi-instance production cluster with multiple Uvicorn workers, Redis-backed rate limiting should be introduced.
- Default `AUTH_SECRET_KEY` in `.env.example` must be replaced with a high-entropy 256-bit random secret in production deployments.

---

### 26. Manual Action Required
1. Ensure the production deployment sets a strong, random `AUTH_SECRET_KEY` (e.g. `openssl rand -hex 32`).
2. Update `CORS_ORIGINS` in production `.env` to match the exact production domain (e.g. `https://margadarshak.gov.in`).
3. Terminate TLS/HTTPS at the production reverse proxy (Nginx, Traefik, or Cloudflare).

















