# Final Audit Report

Audit date: 22 July 2026

## Evidence-based result

The repository now contains a coherent React/Express/Oracle academic banking system. Confirmed static checks pass. Oracle installation, compilation, database acceptance execution, four-role runtime testing, and browser viewport evidence still require the student's local Oracle environment and demo accounts. No completion percentage or faculty score is claimed without that runtime evidence.

## Confirmed fixes

- `INSTALL-001`: `database/run_all.sql` uses child-relative `@@` calls in dependency order and excludes cleanup.
- `PL-001`: deposit, withdrawal, transfer, and loan payment create savepoints before all protected validation; packages contain no commit.
- `TEST-001`: legacy tests were replaced; acceptance failures verify exact `SQLCODE` and unchanged values.
- `AUTHZ-001`: reusable branch/customer/loan/account scope checks protect manager and employee mutations.
- `LOAN-001`: payment account ownership, API payment/history, UI payment/history, receipt, and completion status are connected.
- `HEALTH-001`: `/api/health` queries `DUAL`, returns connected status or safe HTTP 503, and closes its connection.
- `REPORT-001`: Operational Transaction Volume excludes `TRANSFER_CREDIT`.
- `AUDIT-001`: Oracle client identifier records `username:userId`; transaction update and delete are blocked.
- `UI-001`: customer/account selections, loan forms, filters, pagination, employee/status management, receipts, and admin audit UI were added.
- `DOC-001`: setup, schema, scope, test evidence, limitations, and beginner guides now match the implementation.

## Feature status

| Feature | Static implementation | Runtime evidence |
|---|---|---|
| Installer and 12-table schema | Complete | Oracle pending |
| Functions/packages/procedures/views/triggers | Complete | Oracle compilation pending |
| Account opening/deposit/withdrawal/transfer | Connected | Oracle/E2E pending |
| Loan application/decision/disbursement/payment | Connected | Oracle/E2E pending |
| Authentication/RBAC/ownership/branch scope | Connected; unit checks pass | Four-role test pending |
| Dashboard/reports/audit | Connected | Direct SQL comparison pending |
| Responsive UI | Builds and lints | Visual viewport evidence pending |
| Documentation | Complete for current scope | Local evidence fields pending |

## Preserved design

The project remains React 19, Vite, Tailwind CSS, Express 5, Node.js, `node-oracledb`, Oracle SQL, and Oracle PL/SQL. Existing normalized table names and package architecture were retained. Cards and beneficiaries are not claimed as implemented.

## Remaining blockers

1. Run `database/run_all.sql` in a fresh dedicated Oracle schema.
2. Resolve every row from `USER_ERRORS` and every invalid project object, if any.
3. Run `database/tests/acceptance_tests.sql` and capture output.
4. Create temporary hash-backed demo users and complete the four-role matrix.
5. Capture desktop, tablet, and mobile evidence for the connected workflows.

## Readiness decision

**Oracle verification still required.** Static implementation is ready for local database verification, but the project must not be presented as fully demonstrated until the pending evidence is recorded.
