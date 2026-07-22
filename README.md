# Smart Banking Management System Using Oracle SQL

An academic banking simulation built around Oracle SQL and PL/SQL. React provides a responsive dashboard; Express exposes a parameterized, role-protected REST API; Oracle packages own banking validation, row locking, ledger creation, and loan calculations.

## Features and roles

- Admin: branches, staff visibility, customers, accounts, transactions, loans, reports, and audit APIs.
- Manager: branch-scoped operations and loan decisions.
- Employee: customer registration, account opening, deposits, withdrawals, transfers, and loan applications.
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

`run_all.sql` deliberately excludes destructive cleanup and optional DBA role grants. Exact order: tables, extra constraints, indexes, functions, packages, compatibility procedures, views, audit triggers, sample data. Check `USER_ERRORS` after compilation.

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

PL/SQL packages validate and mutate data but do not commit. Express commits once after the complete package call succeeds and rolls back on any error. This makes transfer and loan disbursement atomic.

## Known limitations

- Oracle runtime compilation was not available during the Codex pass and must be performed locally.
- Demo user creation is intentionally manual so no shared password enters source control.
- The UI covers the demonstration path; advanced employee editing, account status controls, loan payments, audit-log UI, chart rendering, date filters, and full browser automation remain limited.
- This is an academic simulation, not production banking software.

## Team

Md Iftekhar Alam Asif, Mrinmoy, Onamica. Add student IDs and faculty/course details before submission.

## Future scope

Optional future academic improvements: notification simulation, maker-checker approvals, statement export, more automated tests, and deployment hardening. Real payment networks, OTP/SMS, cards, crypto, biometrics, and mobile apps are outside scope.
