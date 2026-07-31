# Final schema reference

The database uses Oracle tables, constraints, indexes, views, PL/SQL packages,
procedures, and triggers. `USERS.ROLE` is the only application authorization
source.

## Principals

`USERS` contains login lifecycle fields (`USERNAME`, `PASSWORD_HASH`, role,
lock/failed-login state, password-change state, `STAFF_CODE`, and
`DISPLAY_NAME`). A CUSTOMER user has `CUSTOMER_ID` and no employee fields. An
ADMIN, MANAGER, or EMPLOYEE user has `EMPLOYEE_ID` and a `STAFF_CODE` matching
the linked active `EMPLOYEES.EMPLOYEE_CODE`; customer fields are null. Unique
indexes enforce case-insensitive usernames and staff codes, while foreign keys
and the `TRG_VALIDATE_USER_STAFF_CODE` trigger enforce the cross-table rule.

`EMPLOYEES` stores all bank staff, including the four Admins and the Manager;
`JOB_TITLE` is descriptive and is not a second role store. `CUSTOMERS` stores
the 25 fictional viva customers and all public signups.

## Core entities

- `BANK_PROFILE`, `BRANCHES`, `ACCOUNT_TYPES`, `ACCOUNTS`
- `TRANSACTIONS`, `FUND_TRANSFERS`, `TRANSACTION_REVERSALS`, `AUDIT_LOG`
- `LOAN_TYPES`, `LOANS`, `LOAN_PAYMENTS`
- `BENEFICIARIES`, `CUSTOMER_KYC`, `USER_PREFERENCES`
- `DEPOSIT_SCHEMES`, `DEPOSIT_CERTIFICATES`
- `NOTIFICATIONS`, `SERVICE_REQUESTS`, `LOGIN_HISTORY`

All financial writes use the maintained `PKG_BANKING_OPERATIONS` and
`PKG_LOAN_OPERATIONS` APIs where available. Packages do not commit internally;
the caller owns the transaction boundary.

## Integrity and normalization

Branches, account types, loan products, and deposit products are normalized
lookup/master tables. Foreign keys protect ownership and branch relationships;
status and amount checks protect business invariants; audit triggers record
changes. The reset worksheet recreates the complete model, while migration 006
repairs older development schemas without dropping ledger data.

## Demo data

Fresh/reset worksheets create five branches, thirteen staff entity rows, exactly
25 customers (`DEMO-NID-0001`..`DEMO-NID-0025`), products, and deterministic
package-generated financial/support records. Passwords are created only by
`server/scripts/seed-viva-users.js` at runtime and are never stored in SQL.
