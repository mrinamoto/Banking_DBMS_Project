# Requirements

## Functional

Users authenticate with a hash-backed account. Server-side RBAC and ownership scope every protected query. Staff register customers and open accounts. Active accounts accept valid deposits; withdrawals and transfers preserve minimum balances. Transfers debit, credit, and record both ledger rows atomically. Managers/admins decide pending loans; approval disburses atomically. Reports use bounded Oracle queries.

## Non-functional

- Money uses `NUMBER(15,2)`; inputs use bind variables.
- Passwords use salted `scrypt`; secrets are environment variables.
- Responsive UI supports 320px and wider screens.
- Errors shown to users do not expose raw Oracle details.
- Database setup is repeatable in a dedicated empty schema.
