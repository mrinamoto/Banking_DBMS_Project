# API Documentation

Base URL locally: `http://localhost:5000/api`

Base URL on Vercel frontend: set `VITE_API_URL` to the Render backend plus `/api`.

## Authentication

- `POST /auth/register`: creates a customer and CUSTOMER user.
- `POST /auth/login`: verifies username and password, returns JWT.
- `GET /auth/me`: returns current JWT user.
- `POST /auth/logout`: ends client session.

## Banking

- `GET /dashboard`: dashboard metrics.
- `GET /customers`: list customers according to role scope.
- `POST /customers`: staff creates a customer.
- `PATCH /customers/:id`: update customer contact fields.
- `PATCH /customers/:id/status`: block or activate a customer.
- `GET /accounts`: list accounts.
- `POST /accounts`: open account.
- `PATCH /accounts/:id/status`: activate, freeze, or close account.
- `POST /transactions/deposit`: deposit money.
- `POST /transactions/withdraw`: withdraw money.
- `POST /transfers`: transfer money.
- `GET /transactions`: transaction history.
- `GET /loans`: loan list.
- `POST /loans`: apply for loan.
- `POST /loans/:id/decision`: approve or reject loan.
- `POST /loans/:id/payments`: pay loan installment.
- `GET /loans/:id/payments`: view loan payments.
- `GET /reports`: branch and financial reports.
- `GET /audit`: admin audit log.
- `GET /branches`: list branches.
- `POST /branches`: create branch.
- `GET /employees`: list employees.
- `POST /employees`: create employee.

## Security

All protected routes require:

```http
Authorization: Bearer <jwt>
```

Role checks run on the backend using `allowRoles` and branch/customer scope helpers.
