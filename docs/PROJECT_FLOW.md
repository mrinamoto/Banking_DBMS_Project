# Project Flow

## Request Flow

1. Browser loads React from Vercel.
2. React calls the Express API on Render.
3. Express validates JWT and role permissions.
4. Express runs SQL or PL/SQL against Oracle Database Free.
5. Oracle constraints, packages, procedures, and triggers enforce banking rules.
6. Express returns clean JSON responses.
7. React updates dashboard tables, receipts, and forms.

## Demonstration Flow

1. Open the Vercel URL.
2. Register a new customer from the signup panel.
3. Sign in as staff to open an account for that customer.
4. Deposit, withdraw, and transfer money.
5. Apply for a loan as customer.
6. Approve or reject the loan as manager.
7. View reports as manager or admin.
8. View audit logs as admin.
