# Data Dictionary

| Table | Purpose | Important integrity |
|---|---|---|
| BRANCHES | Bank locations | unique code, active/inactive |
| CUSTOMERS | Identity/profile | unique NID/phone, nonnegative income |
| EMPLOYEES | Branch staff | branch FK, unique code/NID/email, salary > 0 |
| USERS | Login principals | XOR customer/employee link, four roles, hash required |
| ACCOUNT_TYPES | Product rules | minimum balance/rate checks |
| ACCOUNTS | Customer balances | three FKs, unique number, nonnegative balance |
| TRANSACTIONS | Immutable ledger | positive amount, balance snapshots, unique reference |
| FUND_TRANSFERS | Paired transfer | different accounts, unique debit/credit links |
| LOAN_TYPES | Lending limits | coherent amount/term ranges |
| LOANS | Application and balance | decision/status/amount checks |
| LOAN_PAYMENTS | Repayment history | positive amount and outstanding snapshots |
| AUDIT_LOG | Change evidence | table/action/actor/time and summaries |

All timestamps use Oracle `TIMESTAMP`; dates without time use `DATE`; money uses `NUMBER(15,2)`.
