-- 1 Inner/multi-table join: customer accounts
SELECT * FROM vw_customer_account_summary ORDER BY customer_name;
-- 2 Left join: every branch, including empty branches
SELECT * FROM vw_branch_performance ORDER BY total_balance DESC;
-- 3 Aggregate and GROUP BY: accounts by type
SELECT t.type_name,COUNT(*) accounts,SUM(a.balance) balance FROM account_types t LEFT JOIN accounts a ON a.account_type_id=t.account_type_id GROUP BY t.type_name;
-- 4 HAVING: customers with multiple accounts
SELECT c.customer_id,c.first_name,c.last_name,COUNT(*) account_count FROM customers c JOIN accounts a ON a.customer_id=c.customer_id GROUP BY c.customer_id,c.first_name,c.last_name HAVING COUNT(*)>1;
-- 5 Nested subquery: balances above average
SELECT account_number,balance FROM accounts WHERE balance>(SELECT AVG(balance) FROM accounts WHERE status='ACTIVE') ORDER BY balance DESC;
-- 6 Correlated subquery: branch-leading account balances
SELECT a.account_number,a.branch_id,a.balance FROM accounts a WHERE a.balance=(SELECT MAX(x.balance) FROM accounts x WHERE x.branch_id=a.branch_id);
-- 7 CASE: status presentation
SELECT account_number,balance,CASE status WHEN 'ACTIVE' THEN 'Available' WHEN 'FROZEN' THEN 'Restricted' ELSE 'Closed' END status_label FROM accounts;
-- 8 Date query: daily totals
SELECT * FROM vw_daily_transaction_totals WHERE transaction_day BETWEEN :date_from AND :date_to ORDER BY transaction_day DESC;
-- 9 Monthly totals
SELECT TRUNC(transaction_date,'MM') month,transaction_type,COUNT(*) count,SUM(amount) total FROM transactions GROUP BY TRUNC(transaction_date,'MM'),transaction_type ORDER BY month DESC;
-- 10 Deposit versus withdrawal
SELECT TRUNC(transaction_date,'MM') month,SUM(CASE WHEN transaction_type='DEPOSIT' THEN amount ELSE 0 END) deposits,SUM(CASE WHEN transaction_type='WITHDRAWAL' THEN amount ELSE 0 END) withdrawals FROM transactions GROUP BY TRUNC(transaction_date,'MM');
-- 11 Pending loans
SELECT * FROM vw_pending_loan_applications ORDER BY application_date;
-- 12 Loans by status
SELECT status,COUNT(*) loan_count,NVL(SUM(approved_amount),0) approved_total FROM loans GROUP BY status;
-- 13 Most active accounts
SELECT * FROM vw_account_transaction_summary ORDER BY transaction_count DESC FETCH FIRST 10 ROWS ONLY;
-- 14 Employee/processor activity
SELECT u.username,e.first_name||' '||e.last_name employee_name,COUNT(t.transaction_id) processed_count,NVL(SUM(t.amount),0) volume FROM users u JOIN employees e ON e.employee_id=u.employee_id LEFT JOIN transactions t ON t.processed_by=u.user_id GROUP BY u.username,e.first_name,e.last_name ORDER BY processed_count DESC;
-- 15 Large transactions compared with overall average
SELECT reference_no,transaction_type,amount,transaction_date FROM transactions WHERE amount>(SELECT AVG(amount)*2 FROM transactions) ORDER BY amount DESC;

-- Phase 2: compensating entries and statement rows (read-only diagnostics)
SELECT tr.original_transaction_id,tr.reversal_transaction_id,tr.reason,tr.reversed_at
FROM transaction_reversals tr ORDER BY tr.reversed_at DESC;

SELECT * FROM vw_account_statement WHERE account_id=:account_id
ORDER BY transaction_date,transaction_id;
-- 16 Customer outstanding loans
SELECT c.customer_id,c.first_name||' '||c.last_name customer_name,NVL(SUM(l.outstanding_balance),0) outstanding FROM customers c LEFT JOIN loans l ON l.customer_id=c.customer_id AND l.status='ACTIVE' GROUP BY c.customer_id,c.first_name,c.last_name;
