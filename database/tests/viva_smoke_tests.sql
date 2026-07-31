-- Read-only Phase 2 viva smoke checks. Run after the safe upgrade/fresh install.
SELECT staff_code,role,employee_id FROM users WHERE staff_code IN ('A-ID-001','A-ID-002','A-ID-003','A-ID-004','M-ID-001','E-ID-001','E-ID-002','E-ID-003','E-ID-004','E-ID-005','E-ID-006','E-ID-007','E-ID-008') ORDER BY staff_code;
SELECT e.employee_code,e.first_name||' '||e.last_name employee_name,e.branch_id,b.status branch_status FROM employees e JOIN branches b ON b.branch_id=e.branch_id WHERE e.employee_code LIKE 'M-ID-%' OR e.employee_code LIKE 'E-ID-%' ORDER BY e.employee_code;
SELECT COUNT(*) customer_count FROM customers;
SELECT COUNT(*) account_count FROM accounts;
SELECT COUNT(*) transaction_count FROM transactions;
SELECT COUNT(*) transfer_count FROM fund_transfers;
SELECT COUNT(*) loan_count FROM loans;
SELECT COUNT(*) loan_product_count FROM loan_types WHERE status='ACTIVE';
SELECT COUNT(*) deposit_scheme_count FROM deposit_schemes WHERE status='ACTIVE';
SELECT COUNT(*) notification_count FROM notifications;
SELECT COUNT(*) service_request_count FROM service_requests;
SELECT COUNT(*) unbalanced_transfer_pairs FROM fund_transfers f JOIN transactions d ON d.transaction_id=f.debit_transaction_id JOIN transactions c ON c.transaction_id=f.credit_transaction_id WHERE d.amount<>c.amount OR d.transaction_type<>'TRANSFER_DEBIT' OR c.transaction_type<>'TRANSFER_CREDIT';
SELECT object_type,status,COUNT(*) object_count FROM user_objects WHERE status<>'VALID' GROUP BY object_type,status;
SELECT name,type,line,position,text FROM user_errors ORDER BY name,sequence;
