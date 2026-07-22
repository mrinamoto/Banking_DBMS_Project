# Business Rules

1. Branch codes, customer national IDs, employee IDs/emails, usernames, account numbers, transaction references, and loan numbers are unique.
2. A customer may own many accounts; every account belongs to one customer, branch, and type.
3. Only active accounts transact. Closing requires a zero balance.
4. Amounts are positive; balance and outstanding amounts cannot become negative.
5. Withdrawal/transfer leaves the account type's minimum balance.
6. Customer transfers may debit only an owned account.
7. Transfer source and destination differ; both rows are locked in ID order.
8. A pending loan is decided once. Approval cannot exceed the request; rejection needs a reason.
9. Loan terms/amounts follow the selected type. Browser calculations are advisory only; Oracle calculates EMI.
10. Loan payments are positive and cannot exceed outstanding balance. Zero outstanding marks completion.
11. Disabled users cannot log in. Invalid passwords increment `FAILED_LOGIN_COUNT`; successful login resets it.
12. Managers and employees perform account/transaction/loan/staff mutations only for their assigned branch. A staff transfer is scoped by its source account; the internal receiver may be another branch.
13. Audit access is Admin-only. Express sets `username:userId` as Oracle client identifier before mutations.
14. Operational Transaction Volume excludes transfer-credit rows to avoid double counting.
