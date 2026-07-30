CREATE OR REPLACE VIEW vw_customer_account_summary AS
SELECT c.customer_id,c.first_name||' '||c.last_name customer_name,a.account_id,a.account_number,
       t.type_name,b.branch_name,a.balance,a.currency,a.status,a.open_date
FROM customers c JOIN accounts a ON a.customer_id=c.customer_id
JOIN account_types t ON t.account_type_id=a.account_type_id JOIN branches b ON b.branch_id=a.branch_id;

CREATE OR REPLACE VIEW vw_branch_performance AS
SELECT b.branch_id,b.branch_code,b.branch_name,
       COUNT(DISTINCT a.account_id) total_accounts,COUNT(DISTINCT a.customer_id) total_customers,
       NVL(SUM(CASE WHEN a.status<>'CLOSED' THEN a.balance ELSE 0 END),0) total_balance
FROM branches b LEFT JOIN accounts a ON a.branch_id=b.branch_id GROUP BY b.branch_id,b.branch_code,b.branch_name;

CREATE OR REPLACE VIEW vw_account_transaction_summary AS
SELECT a.account_id,a.account_number,COUNT(t.transaction_id) transaction_count,
       NVL(SUM(CASE WHEN t.transaction_type IN('DEPOSIT','TRANSFER_CREDIT','LOAN_DISBURSEMENT') THEN t.amount ELSE 0 END),0) total_credit,
       NVL(SUM(CASE WHEN t.transaction_type IN('WITHDRAWAL','TRANSFER_DEBIT','LOAN_PAYMENT') THEN t.amount ELSE 0 END),0) total_debit
FROM accounts a LEFT JOIN transactions t ON t.account_id=a.account_id GROUP BY a.account_id,a.account_number;

CREATE OR REPLACE VIEW vw_loan_summary AS
SELECT l.loan_id,l.loan_number,c.first_name||' '||c.last_name customer_name,lt.type_name,
       l.requested_amount,l.approved_amount,l.monthly_installment,l.outstanding_balance,l.status,l.application_date
FROM loans l JOIN customers c ON c.customer_id=l.customer_id JOIN loan_types lt ON lt.loan_type_id=l.loan_type_id;

CREATE OR REPLACE VIEW vw_daily_transaction_totals AS
SELECT TRUNC(transaction_date) transaction_day,transaction_type,COUNT(*) transaction_count,SUM(amount) total_amount
FROM transactions WHERE status='SUCCESS' GROUP BY TRUNC(transaction_date),transaction_type;

CREATE OR REPLACE VIEW vw_pending_loan_applications AS
SELECT l.loan_id,l.loan_number,l.customer_id,c.first_name||' '||c.last_name customer_name,
       lt.type_name,l.requested_amount,l.term_months,l.application_date,a.branch_id
FROM loans l JOIN customers c ON c.customer_id=l.customer_id JOIN loan_types lt ON lt.loan_type_id=l.loan_type_id
JOIN accounts a ON a.account_id=l.disbursement_account_id WHERE l.status='PENDING';

CREATE OR REPLACE VIEW vw_account_statement AS
SELECT t.transaction_id,t.account_id,t.reference_no,t.transaction_type,t.amount,t.previous_balance,t.new_balance running_balance,
       t.status,t.transaction_date,
       CASE WHEN t.transaction_type IN ('DEPOSIT','TRANSFER_CREDIT','LOAN_DISBURSEMENT','REVERSAL_CREDIT') THEN t.amount ELSE 0 END credit,
       CASE WHEN t.transaction_type IN ('WITHDRAWAL','TRANSFER_DEBIT','LOAN_PAYMENT','REVERSAL_DEBIT') THEN t.amount ELSE 0 END debit
FROM transactions t;

CREATE OR REPLACE VIEW vw_deposit_certificate_reminders AS
SELECT d.certificate_id,d.certificate_number,d.customer_id,d.account_id,d.maturity_date,
       d.expected_maturity_amount,d.status,s.scheme_name,
       CASE WHEN d.status='MATURED' OR d.maturity_date < TRUNC(SYSDATE) THEN 'ALREADY_MATURED'
            WHEN d.maturity_date <= TRUNC(SYSDATE)+7 THEN 'WITHIN_7_DAYS'
            WHEN EXTRACT(MONTH FROM d.maturity_date)=EXTRACT(MONTH FROM SYSDATE)
             AND EXTRACT(YEAR FROM d.maturity_date)=EXTRACT(YEAR FROM SYSDATE) THEN 'THIS_MONTH'
            ELSE 'FUTURE' END reminder_category
FROM deposit_certificates d JOIN deposit_schemes s ON s.scheme_id=d.scheme_id
WHERE d.status IN ('QUOTATION','ACTIVE','MATURED');
