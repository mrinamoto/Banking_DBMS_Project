# Smart Banking Management System Using Oracle SQL

An academic banking simulation built around Oracle SQL and PL/SQL. React provides a responsive dashboard; Express exposes a parameterized, role-protected REST API; Oracle packages own banking validation, row locking, ledger creation, and loan calculations.

## Features and roles

- Admin: branches, staff visibility, customers, accounts, transactions, loans, reports, and audit APIs.
- Manager: operations, employees, accounts, transactions, loans, and decisions for the manager's assigned branch.
- Employee: institution-wide customer registration, followed by account/financial/loan operations only for the employee's assigned branch.
- Customer: own accounts, transactions, transfers, loans, and limited profile changes.

Core modules include branches, employees, customers, account types/accounts, deposit, withdrawal, atomic transfer, transaction receipts/history, loan types/applications/decisions/payments, reports, users, RBAC, and audit history.

## Stack

- Oracle Database 19c+ / Oracle Free, SQL, PL/SQL, `oracledb` 7
- Node.js 20+ and Express 5
- React 19, Vite 8, Tailwind CSS 4, Axios, Lucide
- Signed eight-hour bearer sessions; Node `scrypt` password hashes

## Folder structure

```text
client/          React UI
server/          Express API and Oracle pool
database/sql/    Ordered Oracle schema/object scripts
database/tests/  Rollback-based manual database tests
docs/            Design, testing, setup, demo, presentation, and viva guides
```

## Windows PowerShell setup

Prerequisites: Node.js 20+, npm, Oracle Database 19c+ (or Oracle Free), and SQLcl/SQL*Plus or SQL Developer.

```powershell
Copy-Item server\.env.example server\.env
notepad server\.env
Set-Location server
npm install
Set-Location ..\client
npm install
```

Set `DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING`, and a random `SESSION_SECRET` of at least 32 characters. Never commit `server/.env`.

Install the dedicated Oracle schema from the project root:

```powershell
sqlplus bank_app@localhost:1521/FREEPDB1 `@database/run_all.sql
```

`run_all.sql` uses child-relative `@@` paths and deliberately excludes destructive cleanup and optional DBA role grants. Exact order: tables/sequence, extra constraints, indexes, functions, packages, compatibility procedures, views, audit triggers, sample data, compiler report. Check `USER_ERRORS` after compilation.

Start both processes in separate PowerShell windows:

```powershell
Set-Location server
npm start
```

```powershell
Set-Location client
npm run dev
```

Open `http://localhost:5173`. The Vite server proxies `/api` to port 5000.

## Demo users

No password is stored in this repository. Generate a hash for a temporary demo password:

```powershell
Set-Location server
npm run demo-hash -- "choose-a-temporary-10-character-password"
```

Insert the printed hash into `USERS` with SQL Developer. Link managers/employees using `EMPLOYEE_ID`, customers using `CUSTOMER_ID`, and leave both null for an admin. Valid roles are `ADMIN`, `MANAGER`, `EMPLOYEE`, and `CUSTOMER`. Delete or disable demo users after presentation.

```sql
INSERT INTO users(username,password_hash,role,is_active)
VALUES ('faculty_admin', '<paste-generated-hash>', 'ADMIN', 'Y');
COMMIT;
```

## Checks

```powershell
Set-Location client
npm run lint
npm run build
Set-Location ..\server
npm run check
```

Run `database/tests/acceptance_tests.sql` only in a disposable project schema. It uses savepoints and rollback for financial tests.

## Important design rule

PL/SQL packages validate and mutate data but do not commit. Express commits once after the complete package call succeeds and rolls back on any error. This makes transfer, loan disbursement, and loan payment atomic. Managers and employees are checked against `req.user.branchId`; a staff transfer is allowed only when the source account belongs to that branch. Customer ownership is checked independently.

The dashboard metric **Operational Transaction Volume** counts deposits, withdrawals, transfer debits, loan disbursements, and loan payments. It excludes transfer credits so one transfer is not counted twice.

Logout removes the bearer token from browser storage. This classroom implementation has no server-side token revocation list; an already copied token remains valid until its eight-hour expiry. Use a new `SESSION_SECRET` to invalidate all tokens during a security reset.

## Known limitations

- Oracle runtime compilation was not available during the Codex pass and must be performed locally.
- Demo user creation is intentionally manual so no shared password enters source control.
- Chart rendering and browser automation are not included. Oracle compilation, four-role runtime tests, and desktop/tablet/mobile visual evidence remain pending locally.
- This is an academic simulation, not production banking software.

## Team

Md Iftekhar Alam Asif, Mrinmoy, Onamica. Add student IDs and faculty/course details before submission.

## Future scope

Optional future academic improvements: notification simulation, maker-checker approvals, statement export, more automated tests, and deployment hardening. Real payment networks, OTP/SMS, cards, crypto, biometrics, and mobile apps are outside scope.
