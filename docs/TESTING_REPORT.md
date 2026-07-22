# Testing Report

Date: 22 July 2026

## Executed static checks

| Command | Exit | Actual result | Status |
|---|---:|---|---|
| `cd client; npm run lint` | 0 | No warnings or errors | Pass |
| `cd client; npm run build` | 0 | Vite built 1,851 modules | Pass |
| `cd server; npm run check` | 0 | 20 owned JavaScript files parsed | Pass |
| `cd server; npm test` | 0 | 5 tests passed, 0 failed | Pass |
| `git diff --check` | 0 | No whitespace errors; CRLF conversion notices only | Pass |

Both `npm ci` commands passed after approved npm cache/network access: client added 73 packages and server added 97, with zero reported vulnerabilities. npm warned that `oracledb@7.0.1` has an install script not covered by `allowScripts`.

## Node unit tests

| Test | Expected | Actual |
|---|---|---|
| `scrypt` verification | Correct password passes; wrong password fails; plaintext absent | Pass |
| HMAC token tampering | Modified token rejected | Pass |
| Manager/employee branch helper | Cross-branch 403; same branch allowed; Admin global | Pass |
| Customer account ownership | Another customer's account is rejected with 403 | Pass |
| Manager loan scope | Another branch's loan is rejected with 403 | Pass |

## Oracle acceptance suite

`database/tests/acceptance_tests.sql` contains rollback-safe checks for account opening, amount/minimum rules, active/frozen accounts, transfer atomicity and ledgers, ownership, EMI, loan limits/application/decision/payment/completion, three audit triggers, and transaction update/delete protection. Negative tests compare exact Oracle `SQLCODE`; relevant balances are checked after failures.

Actual result: **not executed.** A process-only server probe reached the health route, which correctly returned HTTP 503 because `127.0.0.1:1521` refused the Oracle connection. Do not mark these tests passed until output is pasted into `ORACLE_TEST_EVIDENCE.md`.

## Browser and role tests

The public login page was tested in the local in-app browser at desktop, 768×1024 tablet, and 375×812 mobile sizes. Tablet/mobile had no horizontal overflow, and the accessible password-visibility control worked with a cleared dummy value. Authenticated routes, forms, tables, modals, filters, pagination, receipts, reports, and audit remain credential/Oracle-backed visual tests. The four-role evidence template is in `FOUR_ROLE_TEST_RESULTS.md`.
