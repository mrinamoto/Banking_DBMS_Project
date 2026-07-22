# Relational Schema

- `BRANCHES(branch_id PK, branch_code UQ, ..., status)`
- `CUSTOMERS(customer_id PK, national_id UQ, phone UQ, ..., status)`
- `EMPLOYEES(employee_id PK, branch_id FK, employee_code/national_id/email UQ, ...)`
- `USERS(user_id PK, customer_id FK UQ nullable, employee_id FK UQ nullable, username UQ, role, password_hash)`
- `ACCOUNT_TYPES(account_type_id PK, type_name UQ, min_balance, interest_rate)`
- `ACCOUNTS(account_id PK, account_number UQ, customer_id/branch_id/account_type_id FK, balance, status)`
- `TRANSACTIONS(transaction_id PK, account_id FK, related_account_id FK nullable, reference_no UQ, balance snapshots)`
- `FUND_TRANSFERS(transfer_id PK, from/to_account_id FK, debit/credit_transaction_id FK UQ)`
- `LOAN_TYPES(loan_type_id PK, limits, rate, terms)`
- `LOANS(loan_id PK, loan_number UQ, customer/type/account/reviewer FK, financial state)`
- `LOAN_PAYMENTS(payment_id PK, loan/account/transaction/user FK, outstanding snapshots)`
- `AUDIT_LOG(audit_id PK, table, record, actor, old/new summary, time)`
