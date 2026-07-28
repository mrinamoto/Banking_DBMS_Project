# Database Structure

The database remains Oracle SQL and PL/SQL compatible with Oracle Database Free in Oracle Cloud.

## Core Tables

- `branches`: bank branch master data.
- `account_types`: savings/current rules and minimum balances.
- `customers`: customer profile and KYC-style information.
- `employees`: branch employees and managers.
- `users`: application login identities for four roles.
- `accounts`: customer bank accounts.
- `loan_types`: available loan products.
- `loans`: loan applications and approval lifecycle.
- `transactions`: deposits, withdrawals, transfers, loan disbursements, and payments.
- `fund_transfers`: links debit and credit transfer transactions.
- `loan_payments`: loan repayment records.
- `audit_log`: trigger-generated activity history.

## Relationships

- A customer can own many accounts and loans.
- A branch has many employees and accounts.
- A user is either a customer login, employee login, manager login, or admin login.
- Transactions belong to accounts and optionally reference related accounts.
- Loan payments link loans, accounts, and transactions.

## PL/SQL Logic

- Banking operations are handled in PL/SQL packages for transactional consistency.
- Triggers write audit records.
- Views support reporting and dashboard summaries.
- Constraints prevent invalid roles, statuses, balances, and broken relationships.

## Validation Queries

```sql
SELECT object_type, status, COUNT(*)
FROM user_objects
GROUP BY object_type, status;

SELECT name, type, line, position, text
FROM user_errors
ORDER BY name, sequence;
```
