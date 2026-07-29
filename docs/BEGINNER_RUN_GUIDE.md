# Beginner Run Guide

This project has three parts: Oracle, the Express API, and the React client. Use a dedicated classroom schema and never run the destructive cleanup script against valuable data.

## Prerequisites

Install Git, Node.js 20 or newer, npm, PowerShell, and SQL Developer/SQLcl/SQL*Plus. Use Oracle Database Free or an accessible Autonomous Database.

```powershell
node --version
npm --version
sqlplus -version
```

## Install and configure

```powershell
Set-Location F:\Projects\Banking_DBMS_Project
npm install
npm --prefix client install
npm --prefix server install
Copy-Item server\.env.example server\.env
notepad server\.env
```

Set `PORT`, `CLIENT_ORIGIN`, `DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING`, `DB_POOL_MIN`, `DB_POOL_MAX`, and a 32+ character `SESSION_SECRET`. Optional `DB_WALLET_DIR` and `DB_WALLET_PASSWORD` support mTLS; never commit the wallet or `.env`. The Vite proxy makes `client/.env.local` optional during local development.

## Database install and repair

Connect to the dedicated schema and run `@database/run_all.sql`. It intentionally excludes `database/sql/00_drop_objects.sql`. Then run the read-only checks below. If objects are invalid, fix the reported file/line in the corresponding SQL script and rerun only the affected create/replace script.

```sql
SELECT object_type, status, COUNT(*)
FROM user_objects
GROUP BY object_type, status
ORDER BY object_type, status;

SELECT name, type, line, position, text
FROM user_errors
ORDER BY name, sequence;
```

Do not proceed to application testing until required tables and packages are valid. Run `@database/tests/acceptance_tests.sql` only in the dedicated schema and require `FAILED : 0` and `FINAL RESULT: PASS`.

## Verify and run

```powershell
npm --prefix server run db:test
npm run client:lint
npm run client:build
npm run server:check
npm run server:test
```

PowerShell window 1:

```powershell
npm run server:start
```

PowerShell window 2:

```powershell
npm run client:dev
```

Open `http://localhost:5173/login` and check `http://localhost:5000/api/health`.

## Troubleshooting

- Port 5000 or 5173 in use: stop the owning process or change `PORT`.
- Missing environment variable: compare `server/.env` with `.env.example` without printing secret values.
- Oracle credential/service error: verify the user, password, host, port, and service name in the Oracle connection details.
- Database unavailable: wait for the Autonomous Database to become Available and rerun `npm --prefix server run db:test`.
- CORS/API errors: align `CLIENT_ORIGIN` and use `VITE_API_URL` only for a separately hosted client.
- Schema errors: inspect `USER_ERRORS` and invalid `USER_OBJECTS`; do not run the drop script automatically.
- Expired JWT: sign out, clear the browser session, and sign in again.
- Dependency mismatch: reinstall with the existing `package-lock.json` files.
