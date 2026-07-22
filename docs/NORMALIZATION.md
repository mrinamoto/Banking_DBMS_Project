# Normalization Using the Banking Model

## UNF — unnormalized form

Imagine one spreadsheet row:

`Customer(NID, name, phone, branchName, branchAddress, {accountNumber, accountType, balance, {transaction}}, {loanType, rate, {payment}})`

Accounts, transactions, loans, and payments repeat inside a customer row. A single cell may contain several values, so searching and enforcing keys is unreliable.

## First Normal Form (1NF)

1NF requires atomic values and one value per cell. Repeating accounts, transactions, loans, and payments become separate rows. Every table receives a primary key such as `CUSTOMER_ID`, `ACCOUNT_ID`, or `TRANSACTION_ID`.

Remaining problem: if a combined account-product table used key `(ACCOUNT_ID, ACCOUNT_TYPE_ID)`, `TYPE_NAME` and `MIN_BALANCE` would depend only on `ACCOUNT_TYPE_ID`.

## Second Normal Form (2NF)

2NF removes partial dependency on part of a composite key. Product rules move to `ACCOUNT_TYPES`; an account stores only `ACCOUNT_TYPE_ID`. Likewise, loan limits/rates/terms move to `LOAN_TYPES`, and repeated repayment rows move to `LOAN_PAYMENTS`.

## Third Normal Form (3NF)

3NF removes transitive dependency between non-key attributes:

- `ACCOUNT_ID → BRANCH_ID`, while `BRANCH_ID → BRANCH_NAME, ADDRESS`; therefore branch details stay only in `BRANCHES`.
- `ACCOUNT_ID → CUSTOMER_ID`, while `CUSTOMER_ID → NAME, PHONE, NATIONAL_ID`; customer details stay only in `CUSTOMERS`.
- `LOAN_ID → LOAN_TYPE_ID`, while `LOAN_TYPE_ID → RATE, MIN/MAX AMOUNT, MIN/MAX TERM`; type rules stay in `LOAN_TYPES`.
- `USER_ID → EMPLOYEE_ID`, while `EMPLOYEE_ID → BRANCH_ID`; branch is not duplicated in `USERS` and is joined at login.

## Functional dependencies

- `BRANCH_ID → BRANCH_CODE, BRANCH_NAME, CITY, ADDRESS, STATUS`
- `CUSTOMER_ID → NATIONAL_ID, NAME, PHONE, EMAIL, ADDRESS, STATUS`
- `EMPLOYEE_ID → BRANCH_ID, EMPLOYEE_CODE, NAME, JOB_TITLE, SALARY, STATUS`
- `ACCOUNT_ID → ACCOUNT_NUMBER, CUSTOMER_ID, BRANCH_ID, ACCOUNT_TYPE_ID, BALANCE, STATUS`
- `TRANSACTION_ID → ACCOUNT_ID, TYPE, AMOUNT, PREVIOUS_BALANCE, NEW_BALANCE, REFERENCE_NO`
- `LOAN_ID → CUSTOMER_ID, LOAN_TYPE_ID, ACCOUNT_ID, AMOUNTS, TERM, STATUS`
- `PAYMENT_ID → LOAN_ID, ACCOUNT_ID, TRANSACTION_ID, AMOUNT, OUTSTANDING SNAPSHOTS`

Unique candidate dependencies also exist, for example `ACCOUNT_NUMBER → ACCOUNT_ID` and `NATIONAL_ID → CUSTOMER_ID`.

## Anomalies removed

- Insertion anomaly: a new branch or loan product can be inserted without inventing an account or loan.
- Update anomaly: changing a branch address updates one `BRANCHES` row, not every account.
- Deletion anomaly: closing an account does not delete the customer, branch, or account-type definition.
- Financial-history anomaly: transaction rows retain old/new balances instead of being reconstructed from the current account balance.

## Final table mapping

| Subject | 3NF table |
|---|---|
| Location | `BRANCHES` |
| Customer identity | `CUSTOMERS` |
| Staff identity/branch | `EMPLOYEES` |
| Login credential/role | `USERS` |
| Account product rule | `ACCOUNT_TYPES` |
| Customer account state | `ACCOUNTS` |
| Immutable ledger entry | `TRANSACTIONS` |
| Paired account transfer | `FUND_TRANSFERS` |
| Loan product rule | `LOAN_TYPES` |
| Loan application/state | `LOANS` |
| Repayment history | `LOAN_PAYMENTS` |
| Change evidence | `AUDIT_LOG` |
