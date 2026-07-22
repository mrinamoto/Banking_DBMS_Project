# Codex Implementation Plan

This plan uses the existing React/Express/Oracle stack and makes the smallest coherent changes needed to turn the prototype into a faculty-demonstrable academic system.

## Phase sequence

| Phase | Goal | Verification gate |
|---|---|---|
| 0. Audit | Inventory stack, features, SQL objects, risks, and owner changes | Audit and plan exist; baseline build/lint recorded |
| 1. Stabilize | Environment example, Oracle pool/health, app export, central errors, configurable API URL | Syntax checks, client build/lint, server starts in documented modes |
| 2. Oracle design | Complete normalized core schema, constraints, indexes, install order | Static SQL checks; Oracle compile when available |
| 3. PL/SQL | Safe banking and loan packages, functions, views, reports, triggers | Rollback-based database test cases |
| 4. Auth/RBAC | Hashed passwords, signed sessions, disabled-user handling, centralized roles and ownership | Auth and permission tests |
| 5. Management | Branch, employee, customer, and account CRUD/status workflows | API validation and route tests |
| 6. Transactions | Deposit, withdrawal, atomic transfer, searchable history, receipt | Package-call integration and failure tests |
| 7. Loans | Types, applications, decisions, disbursement, payments, completion | EMI/decision/payment tests |
| 8. Reports/audit | Role-scoped dashboards, reports, audit log | Query and access checks |
| 9. UI | Responsive dashboard, shared components/forms/tables/states | Build/lint and viewport review |
| 10. QA | Static checks, automated unit/API checks, database test guide | Testing report with honest pass/unverified status |
| 11. Academic docs | README, schema, normalization, data dictionary, SQL guide, slides, viva, demo | Documentation cross-check |

## Architectural decisions

1. Keep React, Express, and Oracle. No fallback migration is needed.
2. Keep current table names where valid. `USERS`, `TRANSACTIONS`, and `AUDIT_LOG` are documented mappings for application users, bank transactions, and audit logs.
3. Add `LOAN_TYPES`, `LOAN_PAYMENTS`, and `FUND_TRANSFERS` because the existing model cannot represent those entities correctly.
4. Use Oracle identity columns rather than adding redundant sequences. A dedicated sequence is used for human-readable reference generation only where useful academically.
5. Use a single Oracle connection per HTTP request. PL/SQL packages perform validation and mutations; Express commits only after a successful package call and rolls back on error.
6. Use signed bearer tokens and Node's built-in `scrypt` password hashing to avoid plain-text passwords and unnecessary dependencies.
7. Use parameterized binds for every input. Dynamic sort/filter clauses are allow-listed.
8. Cards remain outside scope. A reference check later confirmed the placeholder card page was unused, so it was safely removed in the follow-up pass.

## Controlled change policy

- Existing uncommitted work is preserved.
- Legacy files deleted by the owner are not restored when reorganized equivalents exist.
- No commit, push, database reset, cleanup script execution, or real-data deletion will occur.
- When Oracle is unavailable, SQL correctness is checked statically and clearly marked runtime-unverified.
