# Faculty Demo Script (7–10 minutes)

Prepare an empty dedicated schema, run `run_all.sql`, create temporary Admin/Manager/Employee/Customer hashes, and record the two generated account numbers.

1. **0:00 Admin login** — explain salted hash and environment secret.
2. **0:30 Dashboard** — show live Oracle totals/recent activity; refresh to prove it is not hardcoded.
3. **1:00 Branches** — show both locations and add one fictional branch.
4. **1:30 Customers** — register a customer with unique NID/phone.
5. **2:15 Accounts** — open a savings account with at least the shown minimum.
6. **3:00 Deposit** — deposit and show the reference/ledger row.
7. **3:40 Invalid withdrawal** — exceed available balance; show safe business error and unchanged balance.
8. **4:20 Transfer** — transfer between demo accounts; show paired debit/credit history and receipt.
9. **5:15 Loan** — submit within type limits; log in as Manager and approve; show disbursement.
10. **6:30 Payment** — call the documented loan-payment package in SQL Developer if UI payment controls are not present; show outstanding reduction.
11. **7:15 Reports** — branch and monthly aggregation.
12. **8:00 Audit** — query `AUDIT_LOG`; explain old/new status summaries.
13. **8:30 ACID** — show `transfer_funds`: ordered row locks, savepoint, two balance updates, two transactions, one final API commit.

If Oracle fails, do not fake success. Show `USER_ERRORS`, the testing report, and the exact package code while explaining the remaining local blocker.
