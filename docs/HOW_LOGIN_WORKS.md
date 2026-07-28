# How Login Works

1. The user opens `/login`.
2. The React form collects username and password.
3. Axios sends `POST /api/auth/login`.
4. Express queries Oracle `users` and linked `employees` data.
5. The password is verified against the stored `scrypt` hash.
6. A valid user receives a JWT containing user ID, username, role, customer ID, employee ID, and branch ID.
7. React stores the JWT as `bank_token`.
8. Later API requests include `Authorization: Bearer <token>`.
9. If the token is missing, expired, or invalid, the API returns `401`.
10. The frontend sends the user back to `/login`.

## Demo Logins

Run this after installing sample data:

```bash
npm --prefix server run seed:demo-users -- ClassroomPass123
```

Then sign in as `admin`, `manager`, `employee`, or `customer`.
