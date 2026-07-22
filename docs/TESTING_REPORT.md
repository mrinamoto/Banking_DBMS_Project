# Testing Report

Date: 22 July 2026

| ID | Objective | Input/steps | Expected | Actual | Result |
|---|---|---|---|---|---|
| BUILD-001 | Production UI build | `cd client; npm run build` | Bundle succeeds | 1,850 modules; bundle produced | Pass |
| LINT-001 | Client static analysis | `cd client; npm run lint` after fixes | No findings | No warnings/errors | Pass |
| NODE-001 | Server syntax | `npm run check` plus `node --check` all owned JS | Parse succeeds | Parse succeeded | Pass |
| DIFF-001 | Patch whitespace | `git diff --check` | No patch errors | No patch errors; only Git CRLF notices | Pass |
| DB-TXN-001 | Deposit/ledger | `acceptance_tests.sql`, valid +100 | Balance +100/reference then rollback | Not run: Oracle unavailable | Not verified |
| DB-TXN-002 | Reject zero deposit | amount 0 | ORA-20010 | Not run | Not verified |
| DB-TXN-003 | Reject same account | same source/destination | ORA-20020 | Not run | Not verified |
| DB-TXN-004 | Transfer rollback | invalid receiver | source unchanged | Not run | Not verified |
| DB-LOAN-001 | Zero-rate EMI | 12,000 / 12 | 1,000 | Not run | Not verified |
| AUTH-001 | Four-role login | generated demo hashes | correct user/session | Not run: schema/users unavailable | Not verified |
| AUTH-002 | Customer ownership | debit another customer's account | HTTP 400/403 | Code path verified; runtime not run | Not verified |
| UI-001 | Responsive shell | desktop/tablet/mobile inspection | usable nav/tables/forms | CSS/build verified; browser visual QA not run | Partial |

## Database test catalogue

`database/tests/acceptance_tests.sql` performs rollback-based deposit, invalid amount, same-account transfer, failed-transfer balance preservation, and zero-interest EMI checks. Additional manual faculty checks should cover duplicate codes/NID/email, frozen accounts, insufficient/minimum balance, valid transfer, loan limit/decision/payment/overpayment, completion, and audit rows. Preconditions are a disposable schema installed by `run_all.sql`. Verify balances and ledger rows before rollback; never run destructive tests on real data.

## Honest limitations

No Oracle instance/credentials were used in this pass, so packages and DDL need local compilation. No end-to-end browser runner is configured. These are the main reasons the readiness decision is “requires additional testing.”
