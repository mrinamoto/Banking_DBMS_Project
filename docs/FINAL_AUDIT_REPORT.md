# Final Audit Report

## Executive summary

Initial estimated completion: 28%. Final estimated implementation completion: 82%. The prototype is now a coherent React/Express/Oracle academic system with normalized schema, safe PL/SQL financial packages, signed authentication, centralized RBAC, ownership/branch scoping, real database dashboards, connected management/transaction/loan/report pages, responsive styling, and faculty documentation.

## Feature matrix

| Feature | Final status |
|---|---|
| Setup/configuration/client build | Complete; build verified |
| Oracle schema/constraints/indexes/views | Implemented; runtime compilation required |
| Deposit/withdrawal/atomic transfer | Implemented in package/API; runtime test required |
| Loan application/approval/disbursement/payment | Package complete; UI covers apply/decision, payment is SQL/API follow-up |
| Authentication/RBAC/ownership | Implemented; runtime role tests required |
| Branch/customer/account management | Core list/create workflows connected |
| Employee management | Role-scoped listing; create/update/status UI not complete |
| Transaction history/receipt | Connected; basic type/search API, UI filter controls limited |
| Reports/dashboard | Connected to Oracle; charts not rendered |
| Audit | Table/triggers/admin API; audit page not implemented |
| Responsive UI/states | Implemented; browser visual QA required |
| Automated QA | Build/lint/syntax; Oracle/browser automation limited |
| Academic documentation | Complete core set |

## Database objects

- 12 tables, extensive PK/FK/UQ/check/default rules, 1 business sequence, 8 explicit indexes.
- 6 views, 5 standalone functions, 2 packages with 11 public operations, 3 wrapper procedures, 4 triggers, 16 report queries.
- Optional Oracle roles/grants in a separate, deliberately non-automatic script.

## Major fixes

Resolved: AUTH-001/002, DB-001/002/003/004/005, PL-001/002/003, BACKEND-001/002/003, UI-001/002/003/004, SETUP-001, SQL-001, DOC-001. TEST-001 is partially resolved because local Oracle and browser E2E execution remain outstanding.

## Verification and limitations

The client production build, lint, server parsing, and patch checks pass at the final gate. No database was reset or changed. Oracle packages/DDL were not compiled against a live instance, and no credential-backed end-to-end test was performed. Employee editing, account status UI, loan-payment UI, audit UI, Chart.js charts, full filters, and browser automation remain limitations.

## Faculty score estimate

| Category | Score |
|---|---:|
| Problem definition | 5/5 |
| Requirement analysis | 5/5 |
| ER diagram | 9/10 |
| Relational schema | 9/10 |
| Normalisation | 9/10 |
| Constraints and integrity | 9/10 |
| SQL queries | 9/10 |
| PL/SQL | 9/10 |
| Transaction and ACID | 9/10 |
| UI and usability | 4/5 |
| Testing | 3/5 |
| Documentation | 5/5 |
| Presentation readiness | 4/5 |
| **Total** | **89/100** |

## Readiness decision

**Requires additional testing.** No known critical design issue remains, but local Oracle compilation and successful end-to-end role/financial tests are mandatory before claiming faculty-demo readiness.
