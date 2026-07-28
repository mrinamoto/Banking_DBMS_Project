# Project Structure

```text
Banking_DBMS_Project/
  client/        React + Vite frontend
  server/        Express API and Oracle connection
  database/      Oracle SQL schema, PL/SQL, triggers, tests
  docs/          Beginner guides and academic documentation
```

## Client

- `src/pages`: dashboard, customers, accounts, loans, transactions, reports, audit, branches, employees, settings, login/signup.
- `src/components`: shared layout, sidebar, navbar, and UI helpers.
- `src/context`: authentication state and JWT persistence.
- `src/services`: Axios API client.

## Server

- `app.js`: Express app, CORS, routes, health check.
- `config/db.js`: Oracle connection pool from environment variables.
- `controllers`: route logic and business workflow calls.
- `middleware`: authentication, authorization, and error handling.
- `scripts`: password hash and demo user seed helpers.

## Database

- `run_all.sql`: installs the full Oracle schema in order.
- `sql`: tables, constraints, indexes, views, functions, procedures, packages, triggers, sample data.
- `tests`: acceptance and object-specific database tests.
