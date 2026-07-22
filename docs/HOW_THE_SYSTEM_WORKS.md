# How the System Works — সহজ ব্যাখ্যা

## Request flow

```text
React form
→ Axios /api request with bearer token
→ Express authentication and role check
→ customer/branch ownership helper
→ Oracle package with bind variables
→ Express COMMIT once on success or ROLLBACK on failure
→ Oracle-derived receipt shown in React
```

React balance বা outstanding amount সিদ্ধান্ত নেয় না। Browser শুধু input পাঠায়; Oracle row lock নিয়ে আসল value পরীক্ষা করে।

## Authentication

Password `scrypt$salt$hash` format-এ থাকে। Login successful হলে signed eight-hour token পাওয়া যায়। Middleware signature এবং expiry verify করে। Logout browser token delete করে; server-side revocation list নেই। Inactive user login করতে পারে না এবং wrong password হলে `FAILED_LOGIN_COUNT` বাড়ে।

## Role and branch policy

- `ADMIN`: global access.
- `MANAGER`: নিজের `branchId`-এর employees/accounts/transactions/loans এবং loan decision.
- `EMPLOYEE`: customer register করতে পারে; account/financial/loan operation শুধু assigned branch-এ। Staff transfer-এর source account assigned branch-এ হতে হবে; receiver অন্য internal branch হতে পারে।
- `CUSTOMER`: শুধু নিজের accounts, transactions, loans, transfer source, এবং loan-payment account.

Frontend menu শুধু convenience। আসল security server controller/helper এবং Oracle package-এ।

## Transfer and ACID

Package savepoint তৈরি করে, amount/source/destination/ownership/status/minimum balance validate করে, দুই account ID order-এ lock করে, sender debit ও receiver credit করে, দুই ledger row এবং এক `FUND_TRANSFERS` row insert করে। কোনো step fail করলে savepoint-এ rollback হয়; Express final commit করে না। তাই partial transfer হয় না।

## Loan payment

Loan row এবং account row lock হয়। Account owner ও loan customer একই না হলে `-20115` error হয়। Payment account balance এবং loan outstanding উভয়ের before/after snapshot রাখা হয়। Outstanding zero হলে status `COMPLETED`।

## Audit identity

Mutation-এর আগে Express `DBMS_SESSION.SET_IDENTIFIER('username:userId')` চালায়। Trigger `CLIENT_IDENTIFIER` ব্যবহার করে; না থাকলে Oracle schema user fallback। Password/token/secret audit value-তে যায় না।

## Operational Transaction Volume

Deposit + Withdrawal + Transfer Debit + Loan Disbursement + Loan Payment যোগ হয়। `TRANSFER_CREDIT` বাদ যায়, নাহলে একটি transfer দুইবার count হতো।
