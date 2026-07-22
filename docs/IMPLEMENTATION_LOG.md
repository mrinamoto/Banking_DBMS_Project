# Implementation Log

## 2026-07-22 — One-pass follow-up audit

- Initial state: clean Git working tree containing the earlier React/Express/Oracle completion pass.
- Stack confirmed: React 19, Vite, Tailwind CSS, Express 5, Node.js, `node-oracledb`, Oracle SQL and PL/SQL.
- Confirmed defects: installer used caller-relative `@` paths; four package procedures could roll back to a savepoint that had not been created; cleanup omitted project objects; five tests referenced the legacy schema; failure tests did not check exact `SQLCODE`; manager mutation scope and loan-payment ownership/backend/UI were incomplete; health did not query Oracle; transfer credit doubled dashboard volume; audit actor used only the shared schema identity; failed login count was not updated; server check parsed only two files.
- Planned order: database installation/transaction correctness → current rollback-safe tests → backend scope/payment/health/security → UI workflow completion → evidence-based documentation → `npm ci`, lint, build, syntax/unit checks.
- Safety: no cleanup script execution, schema reset, commit, push, credential readout, or real-data mutation is authorized.

## 2026-07-22 — One-pass completion and verification

- Database: repaired `@@` installer paths, savepoint order, cleanup coverage, payment ownership, application audit identity, immutable ledger protection, current smoke tests, and exact-code acceptance tests.
- Backend: added reusable manager/employee branch helpers, client identifier, account/loan/customer scope checks, loan payment/history, account and employee status/management, Oracle-aware health, accurate operational volume, failed-login counting, and recursive syntax verification.
- UI: added searchable selections, account status confirmation, transaction filters/pagination, customer pagination, structured loan decisions, loan payment/history/receipt, employee management, and Admin audit page; removed three confirmed unused files.
- Documentation: removed obsolete module/readiness/score claims; added expanded normalization/data dictionary plus Bengali beginner/system guides and pending evidence templates.
- Clean installs: client `npm ci` added 73 packages; server `npm ci` added 97; zero reported vulnerabilities. The server install emitted the documented `oracledb` allow-scripts warning.
- Checks: client lint/build passed; 20 server JavaScript files parsed; 5 Node tests passed; `git diff --check` found no whitespace errors.
- Runtime probe: normal start rejected the missing/short local session secret; a process-only temporary secret allowed Express startup. Database health returned safe HTTP 503 because Oracle port 1521 refused connection. Probe server stopped.
- Unable to verify: Oracle compilation/acceptance, four roles, financial E2E, and authenticated viewport screenshots.
- Visual follow-up: local login passed desktop, 768×1024 tablet, and 375×812 mobile inspection with no mobile/tablet horizontal overflow; accessible password visibility toggle worked. Authenticated viewport checks remain blocked by Oracle.
- Readiness: Oracle verification still required.

## 2026-07-22 — Phase 0: full repository audit

- Inspected all project-owned files, Git state, manifests, React routes/services, Express routes/controllers, Oracle scripts, database tests, and documentation.
- Confirmed the React production build passes and recorded two lint warnings.
- Identified the working tree as pre-existing owner work and preserved it.
- Recorded 5 critical, 11 high, 6 medium issues and an initial completion estimate of 28%.
- Chose to retain React/Express/Oracle and to make the application layer responsible for commit/rollback.
- Oracle runtime compilation was not attempted because a live schema was not established and destructive setup is prohibited.

### Phase completion report

- Phase: 0 — Full Repository Audit
- Files created: `docs/CODEX_AUDIT_REPORT.md`, `docs/CODEX_IMPLEMENTATION_PLAN.md`, `docs/IMPLEMENTATION_LOG.md`
- Existing files preserved: all client, server, database scripts, owner-deleted legacy paths
- Commands: `rg --files`, `git status --short`, `git diff --stat`, `npm run build`, `npm run lint`, Node/npm version checks
- Tests: client build passed; lint passed with two warnings
- Unable to verify: Oracle compilation and credential-dependent API startup
- Remaining risk: financial/authentication implementation is incomplete
- Next phase: stabilize application setup and runtime boundaries

## 2026-07-22 — Phases 1–9: implementation

- Phase 1: replaced per-request connection creation with an Oracle pool; added environment validation/example, health endpoint, safe central errors, configurable CORS/API proxy, app factory, and syntax check.
- Phases 2–3: normalized 12 core entities; added identity keys, business reference sequence, constraints, eight indexes, six views, five functions, two packages, wrappers, four triggers, 16 reports, fictional seed data, safe cleanup script, install driver, and optional privileges.
- Phase 4: added salted `scrypt` password verification, signed expiring sessions, disabled-user handling, centralized role middleware, and scoped queries.
- Phases 5–8: connected branch, customer, account, employee, transaction, loan, dashboard, report, lookup, and audit APIs. Financial handlers call packages and own commit/rollback.
- Phase 9: replaced placeholder dashboard routes with an authenticated responsive shell, shared states, forms, tables, statuses, receipts, mobile navigation, and database-backed pages.

### Key fixes

- AUTH-001/002, DB-001/002/003/004/005, PL-001/002/003, BACKEND-001/002/003, UI-001/002/003/004, SETUP-001, SQL-001.
- Earlier database notes were preserved. A later reference search confirmed `Cards.jsx`, `customerService.js`, and `dashboardService.js` had no imports; the follow-up pass removed those three dead files only.
- The accidental root `.gitignore` directory was not removed because that would be a destructive unrelated action.

### Verification

- `npm run build`: pass.
- `npm run lint`: initial warnings found; repaired and rerun in final gate.
- `npm run check` and `node --check`: pass.
- `git diff --check`: pass apart from informational CRLF notices.
- Oracle compilation: not available; must run `run_all.sql` locally.

## 2026-07-22 — Phases 10–11: QA and academic preparation

- Added rollback-based database acceptance tests and a test matrix.
- Added complete setup, schema, normalization, business rules, data dictionary, SQL explanation, presentation, 50 viva questions, and timed demo material.
- Readiness remains conditional on local Oracle compilation and end-to-end role testing.
