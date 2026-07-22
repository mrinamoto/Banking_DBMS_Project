# Codex Repository Audit Report

Audit date: 22 July 2026  
Project: Smart Banking Management System Using Oracle SQL

## Executive summary

The repository is an early full-stack prototype. The Oracle coursework contains useful tables, joins, views, functions, procedures, triggers, sample data, and tests, while the React dashboard and Express API establish a viable stack. The client builds successfully. However, the application is not yet a connected banking system: authentication and authorization are absent, six of eight pages are placeholders, only customers and three dashboard counts have APIs, customer submission is broken, and the financial PL/SQL does not create a complete double-entry-style ledger for deposits and withdrawals. The existing transfer procedure uses a transaction but commits inside the procedure, has incomplete status/minimum-balance checks, and does not preserve both balance snapshots.

Estimated completion before Codex work: **28%**.

## Detected technology stack

| Area | Detected implementation |
|---|---|
| Frontend | React 19, React Router 7, Vite 8 |
| UI/CSS | Tailwind CSS 4 via Vite plugin, Lucide React icons |
| Backend | Node.js CommonJS, Express 5 REST API |
| Database | Oracle, `oracledb` 7 thin-mode driver |
| HTTP client | Axios |
| Configuration | `dotenv`; local `server/.env` exists and is ignored |
| Authentication | Missing |
| Tests | SQL scripts only; no application test runner initially |
| Build | `cd client; npm run build` |
| Lint | `cd client; npm run lint` |
| Run | `cd server; npm start`; `cd client; npm run dev` |
| Entry points | `server/server.js`, `client/src/main.jsx` |

## Initial console summary

1. Stack: React/Vite/Tailwind + Express/Node + Oracle/PLSQL.
2. Estimated completion: 28%.
3. Current run status: client build passes; server runtime requires Oracle credentials and a reachable schema, so full startup is not verified.
4. Critical issues: 5.
5. High-priority issues: 11.
6. Main database weakness: incomplete normalized loan/transfer model and unsafe/incomplete financial package behavior.
7. Main backend weakness: almost all workflows and all authorization are missing.
8. Main UI weakness: placeholder pages and no responsive/authenticated workflow shell.
9. Proposed phases: stabilize; schema; PL/SQL; auth/RBAC; management APIs; transactions; loans; reports/audit; UI; tests; documentation.

## Repository map

- `client/`: React single-page application, shared layout, pages, API services.
- `server/`: Express API, Oracle connection, controllers, routes.
- `database/sql/`: Oracle DDL, constraints, seed data, views, queries, functions, procedures, triggers, packages.
- `database/tests/`: manual SQL/PLSQL test scripts.
- `database/docs/`: earlier academic notes retained as source material.
- `docs/`: legacy documentation was moved in the current uncommitted work; this audit restores a canonical documentation area.

The working tree already contained substantial uncommitted changes before this audit. They are treated as owner work and preserved unless directly repaired.

## Feature status before implementation

| Feature | Status | Evidence |
|---|---|---|
| Client build | Complete | Vite production build succeeds |
| Server startup | Unable to verify | Startup hard-depends on live Oracle; errors are swallowed |
| Oracle connection | Partial | Environment-based connection exists; no pool/health endpoint |
| Login/logout | Missing | No routes, middleware, or page |
| Password hashing | Database only/incorrect | Placeholder strings in seed data |
| Sessions/tokens | Missing | No authentication implementation |
| Role permissions/ownership | Missing | All routes are public |
| Dashboard | Partial | Three real counts only; no error/loading state |
| Customers | Broken/partial | GET/POST only; form handler scoped inside effect and unusable; insert omits required columns |
| Branches | Database only | No API or UI |
| Employees | Database/UI only | Table and heading page |
| Accounts | Database/UI only | Table and heading page |
| Deposits/withdrawals/transfers | Database only/unsafe | Procedures exist; incomplete validation and ledger behavior |
| Transaction history | Database/UI only | View and heading page |
| Loan types/payments | Missing | Only a basic `LOANS` table exists |
| Loan approval/rejection | Missing | No connected workflow |
| Reports | SQL only | Many ad hoc queries; UI is a heading |
| Audit logs | Partial | Minimal table; trigger prints rather than auditing useful changes |
| Search/filter/pagination | Partial | Client-only customer search; no server pagination |
| Responsive UI | Partial | Fixed sidebar and non-responsive customer table/form |
| Error handling | Partial | Generic database errors; raw errors logged; no central handler |
| Documentation | Partial | Database notes exist; root README was empty |
| Tests | Partial | Manual SQL scripts; no backend/frontend automated tests |

## Database inventory before implementation

- Tables (11): `BRANCHES`, `ACCOUNT_TYPES`, `CUSTOMERS`, `EMPLOYEES`, `ACCOUNTS`, `USERS`, `LOANS`, `TRANSACTIONS`, `BENEFICIARIES`, `CARDS`, `AUDIT_LOG`.
- Constraints: primary keys, several foreign keys/unique/check constraints; important status, salary, branch code, actor, and ownership rules missing.
- Sequences: none; identity columns are used.
- Indexes: six basic indexes.
- Views: five basic views.
- Functions: customer name, account balance, account count.
- Procedures: deposit, withdrawal, transfer.
- Packages: one incomplete banking package.
- Triggers: last-transaction update, negative-balance check, output-only customer trigger, blanket customer delete prevention.
- Seed data: extensive but contains duplicate usernames and placeholder password values.
- Privileges: missing.

## Issue register

| ID | Severity | Finding | Planned resolution |
|---|---|---|---|
| AUTH-001 | Critical | No authentication or backend RBAC | Token authentication, password hashing, centralized middleware |
| AUTH-002 | Critical | No customer ownership enforcement | Scope SQL using authenticated customer/branch identity |
| DB-001 | Critical | Financial model lacks transfer record and balance snapshots | Normalize transfers and ledger columns |
| PL-001 | Critical | Banking package permits invalid deposits/withdrawals and commits internally | Replace with validated row-locking package; caller owns commit |
| PL-002 | Critical | Transfer lacks minimum-balance/status/audit guarantees | Atomic savepoint workflow with ordered row locks |
| BACKEND-001 | High | API covers only dashboard and customer create/list | Add connected management, transaction, loan, report APIs |
| BACKEND-002 | High | Customer insert omits required DOB/address | Validate and bind complete inputs |
| BACKEND-003 | High | Startup swallows failure and has no health endpoint | Export app, validate config, central errors, health checks |
| DB-002 | High | Loan types and payments missing | Add normalized entities and constraints |
| DB-003 | High | User can only link to customers and roles exclude staff | Support customer/employee principals and four roles |
| DB-004 | High | Seed data has duplicate usernames and fake hashes | Replace with deterministic business seed and hash generator |
| DB-005 | High | Audit table cannot store old/new state | Add actor and JSON/text summaries |
| UI-001 | High | Customer submit handler is out of scope | Repair controlled form workflow |
| UI-002 | High | Most routed pages are placeholders | Implement connected pages and shared states |
| UI-003 | High | Fixed desktop-only navigation | Responsive mobile navigation/sidebar |
| TEST-001 | High | No automated API tests and SQL tests mutate state unsafely | Add static/API tests and rollback-based SQL tests |
| SETUP-001 | Medium | API URLs hardcoded to localhost | Relative `/api` URLs with Vite proxy/environment override |
| SETUP-002 | Medium | Root `.gitignore` is an accidental directory | Document; avoid destructive removal without explicit approval |
| SQL-001 | Medium | Executable demo statements mixed with object scripts | Separate object creation, reports, seed, and tests |
| PL-003 | Medium | No meaningful loan package/EMI function | Add loan package and calculation functions |
| UI-004 | Medium | Mojibake bank emoji appears in navigation | Replace with accessible icon/text |
| DOC-001 | Medium | Empty root README and missing faculty material | Produce complete beginner documentation |

## Baseline verification

| Command | Result |
|---|---|
| `cd client; npm run build` | Pass |
| `cd client; npm run lint` | Pass with 2 warnings in `Customers.jsx` |
| `node --version` | v24.18.0 |
| `npm --version` | 11.16.0 |
| Oracle SQL compilation/runtime | Not verified: no destructive or credential-dependent database operation was run |

## Safety notes

- `database/sql/00_drop_objects.sql` will be cleanup-only and will never be included in automatic setup.
- The application layer will own `COMMIT` and `ROLLBACK`; packages will never commit halfway through a business request.
- Financial records will be status-managed, not deleted.
- Local secrets remain in ignored `server/.env`; documentation uses names only.

