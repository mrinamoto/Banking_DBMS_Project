# Four-Role End-to-End Test Results

Status: **Pending demo-user and Oracle-backed execution**. Expected results are defined; actual results must not be invented.

| Role | Test | Expected | Actual | Result/evidence |
|---|---|---|---|---|
| Admin | Login/global dashboard | Global totals load | Pending | Pending |
| Admin | Create branch/employee | Created and visible | Pending | Pending |
| Admin | Reports/audit/logout | Allowed; browser token removed | Pending | Pending |
| Manager | Branch employees/accounts/transactions/loans | Only assigned branch | Pending | Pending |
| Manager | Approve assigned-branch loan | Allowed | Pending | Pending |
| Manager | Cross-branch mutation | HTTP 403 | Pending | Pending |
| Manager | Logout | Token removed | Pending | Pending |
| Employee | Register customer/open branch account | Allowed | Pending | Pending |
| Employee | Deposit/withdraw/apply loan in branch | Allowed | Pending | Pending |
| Employee | Cross-branch operation | HTTP 403 | Pending | Pending |
| Employee | Loan approval/reports/audit | HTTP 403 | Pending | Pending |
| Customer | Own accounts/transactions/loans | Own rows only | Pending | Pending |
| Customer | Transfer from owned account | Allowed | Pending | Pending |
| Customer | Another customer's source | HTTP 403/business rejection | Pending | Pending |
| Customer | Loan payment from owned account | Receipt/history shown | Pending | Pending |
| Customer | Staff pages | Hidden and API forbidden | Pending | Pending |

Record username only—never record password, hash, token, secret, or database password.
