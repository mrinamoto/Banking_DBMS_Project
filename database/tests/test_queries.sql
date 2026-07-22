PROMPT Current view smoke tests
SELECT * FROM vw_customer_account_summary FETCH FIRST 5 ROWS ONLY;
SELECT * FROM vw_branch_performance FETCH FIRST 5 ROWS ONLY;
SELECT * FROM vw_account_transaction_summary FETCH FIRST 5 ROWS ONLY;
SELECT * FROM vw_loan_summary FETCH FIRST 5 ROWS ONLY;
SELECT * FROM vw_daily_transaction_totals FETCH FIRST 5 ROWS ONLY;
SELECT * FROM vw_pending_loan_applications FETCH FIRST 5 ROWS ONLY;

PROMPT Operational volume comparison: TRANSFER_CREDIT is deliberately excluded
SELECT SUM(amount) all_ledger_volume,
       SUM(CASE WHEN transaction_type='TRANSFER_CREDIT' THEN 0 ELSE amount END) operational_transaction_volume
FROM transactions;
