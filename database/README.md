# Oracle database guide

The `database/sql` directory is the authoritative modular Oracle source. It
defines the banking schema, packages, triggers, reference data, fictional viva
data, and package-controlled ledger activity. The generated files in
`database/worksheet` are rebuilt from that source; do not edit them manually.

## Supported setup

Use Oracle Database Free/Autonomous Database (19c-compatible or later) and a
dedicated classroom schema. Node.js uses SQL*Net; browser FreeSQL access is a
separate connection path. The exact current Schema Connection Details panel is
authoritative.

## Fresh disposable schema

From PowerShell install dependencies and build the worksheets:

```powershell
npm install
npm --prefix client install
npm --prefix server install
npm run db:build-worksheets
```

In FreeSQL, run `SELECT USER FROM dual;`, then run the following browser files
with **Run Script** in order:

1. `database/worksheet/full_reset_and_install.sql` (destructive; disposable schema only)
2. `database/worksheet/verify_install.sql` (read-only)
3. From PowerShell, `npm run db:test` and `npm run db:doctor`
4. `npm --prefix server run seed:viva-users -- --base-secret "<private-secret-at-least-16-characters>"`
5. `database/tests/viva_smoke_tests.sql`
6. `database/tests/acceptance_tests.sql` (requires `FAILED : 0` and `FINAL RESULT: PASS`)

The SQL creates no application passwords. The Node seed hashes temporary
passwords and creates the thirteen staff logins in one transaction. Never run
the reset worksheet against valuable data.

## Existing schema upgrade

Run `database/worksheet/full_upgrade.sql` after taking a backup. It applies
migrations 001 through 006 without dropping customers, accounts, passwords, or
ledger history. It is not needed after a successful fresh reset. The final
unified principal model requires every ADMIN, MANAGER, and EMPLOYEE login to
link to an active `EMPLOYEES` row and matching `STAFF_CODE`; CUSTOMER logins
link only to `CUSTOMERS`.

## Final demo model

- Five fictional branches: HO-001, DHK-001, UTT-001, CTG-001, CHP-001.
- Thirteen staff entities: four Admins, one Manager, and eight Employees.
- Exactly 25 customers with `DEMO-NID-0001` through `DEMO-NID-0025`.
- Five account types, six loan products, and classroom deposit schemes.
- Package-generated accounts, transactions, transfers, loans, payments,
  beneficiaries, KYC, quotations, notifications, service requests, and audit
  rows. Demo data is rerunnable and contains no passwords.
- `BANK_PROFILE` stores fictional branding; GET is public and only ADMIN may
  update it through the API.

## Modular order

`database/run_all.sql` is a non-destructive SQL*Plus installer. It runs base
tables, constraints, indexes, reference data, views, functions, packages,
procedures, triggers, and demo data in dependency order. Do not execute all
individual files manually. `00_drop_objects.sql` is used only inside the reset
worksheet.

## Verification queries

```sql
SELECT object_name, object_type, status
FROM user_objects
WHERE status <> 'VALID'
ORDER BY object_type, object_name;

SELECT name, type, line, position, text
FROM user_errors
ORDER BY name, sequence;
```

Both queries should return no rows after installation. The read-only
`verify_install.sql` additionally checks required tables/columns, constraints,
indexes, packages, staff IDs, 25 customers, financial consistency, products,
notifications, and service requests.

## Transaction rule

Banking and loan packages validate ownership/status, lock balances, use
savepoints, and never commit. Express or the demo installer commits the whole
operation and rolls back on errors. No application path should insert ledger
rows directly when a package operation exists.

## Troubleshooting

`NJS-503`/`NJS-500` usually indicates a listener, network, wallet, or connect
string problem; `ORA-01017` indicates credentials; `ORA-12154`/`ORA-12514`
indicates a service-name/connect-string problem. Check required variables in
`server/.env`, use the exact FreeSQL connection panel value, and never print
passwords, wallet paths, tokens, or complete connect strings. FreeSQL browser
success does not prove Node SQL*Net connectivity.
