# Oracle Database Guide

This directory contains the Oracle SQL and PL/SQL academic core of the Smart Banking Management System. The implemented entities are branches, customers, employees, application users, account types, accounts, bank transactions, fund transfers, loan types, loans, loan payments, and audit logs. Cards and beneficiaries are not implemented modules.

## Requirement

- Oracle Database 19c or later, including Oracle Database Free
- SQL*Plus, SQLcl, or Oracle SQL Developer
- A dedicated empty project schema

## Safe installation

From the repository root:

```powershell
sqlplus bank_app@localhost:1521/FREEPDB1 `@database/run_all.sql
```

`run_all.sql` uses `@@` so every child path is resolved relative to the installer file. Its order is:

1. `sql/01_create_tables.sql` — tables and `SEQ_BUSINESS_REFERENCE`
2. `sql/02_constraints.sql` — additional cross-column constraints
3. `sql/05_indexes.sql` — non-unique search/report indexes
4. `sql/07_functions.sql` — balance, EMI, and number-generation functions
5. `sql/11_packages.sql` — banking and loan package specifications/bodies
6. `sql/08_procedures.sql` — compatibility procedure wrappers
7. `sql/04_views.sql` — reporting views
8. `sql/10_triggers.sql` — audit actor/function, audit triggers, immutable ledger protection
9. `sql/03_insert_sample_data.sql` — fictional classroom data
10. `USER_ERRORS` compiler report

The installer never calls `sql/00_drop_objects.sql`. That cleanup file is development-only and must never be run against important data.

## Phase 1 staff-login upgrade

For an existing schema, run `database/migrations/001_staff_users_explorer_dashboard.sql` (or paste the equivalent `database/worksheet/phase1_upgrade.sql`) as the schema owner. It adds `USERS.MUST_CHANGE_PASSWORD`, `ACCOUNT_LOCKED`, `LOCKED_AT`, `PASSWORD_CHANGED_AT`, `UPDATED_AT`, the `LOGIN_HISTORY` table, and supporting indexes without dropping or rewriting existing rows. The fresh installer creates the same final shape.

## Transaction rule

Packages use validation, `SAVEPOINT`, `SELECT ... FOR UPDATE`, balance updates, and ledger inserts. They do not call `COMMIT`. Express commits once after the entire PL/SQL operation succeeds and rolls back after an error. This is the project's ACID boundary.

## Tests

After a successful fresh-schema installation:

```sql
@database/tests/acceptance_tests.sql
```

The suite checks exact expected Oracle error codes and rolls all test data back. The five smaller `test_*.sql` files are current smoke tests and do not contain old schema names.

Verify compilation:

```sql
SELECT object_name, object_type, status
FROM user_objects
WHERE status <> 'VALID'
ORDER BY object_type, object_name;

SELECT name, type, line, position, text
FROM user_errors
ORDER BY name, sequence;

Run the read-only Phase 1 checks with `@database/tests/phase1_tests.sql`. They verify lifecycle columns, the one-employee/one-login constraint, and the allowlisted explorer indexes; they do not create test data.
```

Oracle execution evidence is pending until these commands are run against the student's local schema.
