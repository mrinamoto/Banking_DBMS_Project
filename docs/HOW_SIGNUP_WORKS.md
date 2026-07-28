# How Signup Works

Signup creates a real customer login in Oracle.

## Required Fields

- First name
- Last name
- Date of birth
- Phone
- National ID
- Address
- Username
- Password

## Backend Steps

1. Validate required fields.
2. Normalize username to lowercase.
3. Reject duplicate username, phone, email, or national ID.
4. Hash the password.
5. Insert the customer row.
6. Insert a linked `users` row with role `CUSTOMER`.
7. Commit the Oracle transaction.
8. Return a JWT so the customer enters the dashboard immediately.

## Database Compatibility

No existing schema file was changed for signup. The current `customers` and `users` tables already support customer application users.
