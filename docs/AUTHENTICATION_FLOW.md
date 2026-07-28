# Authentication Flow

## Registration

1. Customer fills the signup form in React.
2. React sends the data to `POST /api/auth/register`.
3. Express validates required fields and username format.
4. Backend hashes the password with Node.js `crypto.scrypt`.
5. Oracle inserts a row into `customers`.
6. Oracle inserts a linked row into `users` with role `CUSTOMER`.
7. Backend commits the transaction.
8. Backend signs a JWT and returns it to React.
9. React stores the token and user profile in `localStorage`.

## Login

1. User submits username and password.
2. Express loads the user from Oracle.
3. Backend verifies the password hash using constant-time comparison.
4. Inactive users are rejected.
5. Failed active attempts increase `failed_login_count`.
6. Successful login resets the failure count and updates `last_login`.
7. Backend returns a signed JWT.

## Authorization

- Frontend hides routes for convenience.
- Backend is the authority for role checks.
- Customers can access only their own accounts and loans.
- Managers and employees are scoped to their branch.
- Admin can access all management and audit workflows.
