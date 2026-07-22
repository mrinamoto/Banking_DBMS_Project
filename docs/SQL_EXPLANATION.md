# SQL and PL/SQL Explanation

Run `database/run_all.sql` from the repository root in SQL*Plus/SQLcl or open it from SQL Developer. Its `@@sql/...` calls resolve relative to `run_all.sql`; it stops and rolls back on an SQL error, then reports `USER_ERRORS`. It never calls the development cleanup script.

| File/object | Purpose and concepts | Inputs/output/errors |
|---|---|---|
| `01_create_tables.sql` | 12 normalized tables, identity PKs, reference sequence, defaults/checks/FKs/UQs | Creates empty schema objects; fails if objects already exist |
| `02_constraints.sql` | Cross-column loan and one-to-one ledger-link rules | DDL errors identify invalid existing data |
| `05_indexes.sql` | Search, branch scope, date history, status reporting | Improves reads; unique indexes come from UQ constraints |
| `07_functions.sql` | Balance, total customer balance, EMI, account/loan number generators | EMI uses `P*r*(1+r)^n / ((1+r)^n-1)`; zero interest is principal/months |
| `11_packages.sql` | `PKG_BANKING_OPERATIONS`, `PKG_LOAN_OPERATIONS` | Raises `-20010..-20114`; never commits |
| `08_procedures.sql` | Beginner-friendly compatibility wrappers | Delegate to the package; caller commits |
| `04_views.sql` | Six reusable join/aggregate views | Customer account, branch, transactions, loans, daily totals, pending loans |
| `10_triggers.sql` | Resolve the application audit actor; audit customer/account/loan changes; protect ledger history | Prefers `CLIENT_IDENTIFIER`, falls back to schema user; blocks transaction update/delete |
| `03_insert_sample_data.sql` | Fictional branches/types/people/accounts | Commits only installation demo data |
| `06_queries.sql` | 16 reports | Joins, left joins, aggregates, HAVING, subqueries, correlation, CASE, dates |
| `11_security_privileges.sql` | Optional Oracle role grants | Requires DBA-created roles and is excluded from `run_all.sql` |

## Atomic transfer walkthrough

`transfer_funds` creates its savepoint before validation, validates amount/accounts/ownership, gets both IDs, locks both account rows in ID order, verifies status and minimum balance, updates both balances, inserts debit and credit transactions with old/new balances, and links them in `FUND_TRANSFERS`. Any exception rolls back to the savepoint. Express then commits once; an API error rolls back the connection.

`record_payment` locks the loan and payment account, confirms both belong to the same customer, rejects non-positive/over/out-of-balance payments, records account and outstanding snapshots, and changes zero-outstanding loans to `COMPLETED`.

## Package, procedure, and function

- A function returns one value and can be called from SQL, such as `FN_CALCULATE_EMI`.
- A procedure performs an operation through parameters, such as the `PR_DEPOSIT` compatibility wrapper.
- A package groups a public specification and implementation body. `PKG_BANKING_OPERATIONS` and `PKG_LOAN_OPERATIONS` are the authoritative business APIs.

## Operational Transaction Volume

The dashboard counts deposits, withdrawals, transfer debits, loan disbursements, and loan payments. It excludes `TRANSFER_CREDIT`, because debit and credit represent the same transfer. `database/tests/test_queries.sql` prints all-ledger volume beside operational volume for comparison.

## Examples

```sql
VARIABLE ref VARCHAR2(80)
BEGIN
  pkg_banking_operations.deposit('ACCOUNT_NUMBER', 1000, NULL, :ref);
  COMMIT;
EXCEPTION WHEN OTHERS THEN ROLLBACK; RAISE;
END;
/
PRINT ref
```

Common errors: ORA-00955 means the schema is not empty; ORA-01031 means missing privileges; compilation errors appear in `USER_ERRORS`; ORA-20000-series messages are intentional business-rule failures.
