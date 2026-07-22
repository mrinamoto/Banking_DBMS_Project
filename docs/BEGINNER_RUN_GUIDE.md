# Beginner Run Guide — সহজভাবে চালানোর নিয়ম

এই project চালাতে তিনটি অংশ আছে: Oracle Database, Express server, এবং React client। প্রথমে শুধু একটি dedicated practice schema ব্যবহার করুন। গুরুত্বপূর্ণ database-এ cleanup script চালাবেন না।

## 1. প্রয়োজনীয় software

- Oracle Database 19c+ বা Oracle Database Free
- SQL Developer / SQLcl / SQL*Plus
- Node.js 20+
- PowerShell

Version দেখুন:

```powershell
node --version
npm --version
sqlplus -version
```

## 2. Environment file

```powershell
Set-Location F:\Projects\Banking_DBMS_Project
Copy-Item server\.env.example server\.env
notepad server\.env
```

নিজের local `DB_USER`, `DB_PASSWORD`, এবং `DB_CONNECT_STRING` লিখুন। `SESSION_SECRET` কমপক্ষে 32 character random text হবে। এই file Git-এ add করবেন না।

## 3. Oracle installer

Empty project schema-তে repository root থেকে চালান:

```powershell
sqlplus bank_app@localhost:1521/FREEPDB1 `@database/run_all.sql
```

`run_all.sql` নিজে সঠিক order-এ child scripts চালায়। `00_drop_objects.sql` installer-এর অংশ নয়। শেষে `USER_ERRORS` output empty হওয়া দরকার। Common error:

- `ORA-00955`: schema empty নয়; fresh schema ব্যবহার করুন।
- `ORA-01031`: object create privilege নেই।
- `ORA-12154`: connect string ভুল।
- `PLS-...`: `USER_ERRORS` থেকে file/object/line দেখুন।

## 4. Demo user hash

```powershell
Set-Location server
npm run demo-hash -- "your-temporary-demo-password"
```

Printed hash `USERS.PASSWORD_HASH`-এ insert করুন। Plain password database/source code-এ লিখবেন না। README-তে Admin insert example আছে।

## 5. Dependencies and checks

```powershell
Set-Location F:\Projects\Banking_DBMS_Project\server
npm ci
npm run check
npm test

Set-Location ..\client
npm ci
npm run lint
npm run build
```

## 6. Run application

PowerShell window 1:

```powershell
Set-Location F:\Projects\Banking_DBMS_Project\server
npm start
```

PowerShell window 2:

```powershell
Set-Location F:\Projects\Banking_DBMS_Project\client
npm run dev
```

Browser: `http://localhost:5173`. Health: `http://localhost:5000/api/health`; database ঠিক থাকলে `database: connected` দেখাবে।

## 7. Oracle tests

```sql
@database/tests/acceptance_tests.sql
```

শেষে `FAILED : 0` এবং `FINAL RESULT: PASS` প্রয়োজন। Test suite নিজের test changes rollback করে। Actual output `ORACLE_TEST_EVIDENCE.md`-তে paste করুন।
