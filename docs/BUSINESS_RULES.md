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
11. Disabled users cannot log in. Managers are branch-scoped; audit access is admin-only.
