# SQL and PL/SQL Explanation

Run `database/run_all.sql` from the repository root in SQL*Plus/SQLcl or open it from SQL Developer. It stops and rolls back on an SQL error, then reports `USER_ERRORS`.

| File/object | Purpose and concepts | Inputs/output/errors |
|---|---|---|
| `01_create_tables.sql` | 12 normalized tables, identity PKs, reference sequence, defaults/checks/FKs/UQs | Creates empty schema objects; fails if objects already exist |
| `02_constraints.sql` | Cross-column loan and one-to-one ledger-link rules | DDL errors identify invalid existing data |
| `05_indexes.sql` | Search, branch scope, date history, status reporting | Improves reads; unique indexes come from UQ constraints |
| `07_functions.sql` | Balance, total customer balance, EMI, account/loan number generators | EMI uses `P*r*(1+r)^n / ((1+r)^n-1)`; zero interest is principal/months |
| `11_packages.sql` | `PKG_BANKING_OPERATIONS`, `PKG_LOAN_OPERATIONS` | Raises `-20010..-20114`; never commits |
| `08_procedures.sql` | Beginner-friendly compatibility wrappers | Delegate to the package; caller commits |
| `04_views.sql` | Six reusable join/aggregate views | Customer account, branch, transactions, loans, daily totals, pending loans |
| `10_triggers.sql` | Audit meaningful customer/account/loan changes; protect ledger deletes | Inserts audit rows; blocks transaction delete |
| `03_insert_sample_data.sql` | Fictional branches/types/people/accounts | Commits only installation demo data |
| `06_queries.sql` | 16 reports | Joins, left joins, aggregates, HAVING, subqueries, correlation, CASE, dates |
| `11_security_privileges.sql` | Optional Oracle role grants | Requires DBA-created roles and is excluded from `run_all.sql` |

## Atomic transfer walkthrough

`transfer_funds` validates amount/accounts/ownership, gets both IDs, locks both account rows in ID order, verifies status and minimum balance, creates a savepoint, updates both balances, inserts debit and credit transactions with old/new balances, and links them in `FUND_TRANSFERS`. Any exception rolls back to the savepoint. Express then commits once; an API error rolls back the connection.

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
