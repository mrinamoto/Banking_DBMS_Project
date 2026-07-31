-- Canonical read-only verification template for the final BANK_APP schema.
-- Run after full_fresh_install.sql/full_reset_and_install.sql or full_upgrade.sql.

SELECT USER AS connected_user FROM dual;
SELECT table_name FROM user_tables WHERE table_name IN ('BANK_PROFILE','USERS','LOGIN_HISTORY','BRANCHES','CUSTOMERS','EMPLOYEES','ACCOUNTS','TRANSACTIONS','FUND_TRANSFERS','TRANSACTION_REVERSALS','LOANS','LOAN_PAYMENTS','BENEFICIARIES','CUSTOMER_KYC','USER_PREFERENCES','DEPOSIT_SCHEMES','DEPOSIT_CERTIFICATES','NOTIFICATIONS','SERVICE_REQUESTS') ORDER BY table_name;
SELECT column_name FROM user_tab_columns WHERE table_name='USERS' AND column_name IN ('STAFF_CODE','DISPLAY_NAME','EMPLOYEE_ID','CUSTOMER_ID') ORDER BY column_name;
SELECT constraint_name, constraint_type, table_name FROM user_constraints WHERE table_name IN ('BANK_PROFILE','USERS','EMPLOYEES','CUSTOMERS') ORDER BY table_name,constraint_name;
SELECT index_name, table_name FROM user_indexes WHERE table_name IN ('USERS','EMPLOYEES','CUSTOMERS') ORDER BY table_name,index_name;
SELECT object_name, object_type, status FROM user_objects WHERE object_name IN ('PKG_BANKING_OPERATIONS','PKG_LOAN_OPERATIONS','VW_ACCOUNT_STATEMENT','VW_DEPOSIT_CERTIFICATE_REMINDERS','FN_GET_ACCOUNT_BALANCE','FN_CALCULATE_EMI','PR_DEPOSIT','PR_WITHDRAW','PR_TRANSFER','TRG_VALIDATE_USER_STAFF_CODE') ORDER BY object_type,object_name;
SELECT object_name, object_type, status FROM user_objects WHERE status <> 'VALID' ORDER BY object_type,object_name;
SELECT name, type, line, position, text FROM user_errors ORDER BY name, sequence;
SELECT employee_code, first_name||' '||last_name employee_name, job_title, branch_id, status FROM employees WHERE employee_code IN ('A-ID-001','A-ID-002','A-ID-003','A-ID-004','M-ID-001','E-ID-001','E-ID-002','E-ID-003','E-ID-004','E-ID-005','E-ID-006','E-ID-007','E-ID-008') ORDER BY employee_code;
SELECT username, staff_code, role, employee_id, customer_id, is_active, must_change_password, account_locked FROM users WHERE staff_code IS NOT NULL ORDER BY staff_code;
SELECT COUNT(*) branch_count FROM branches;
SELECT COUNT(*) customer_count FROM customers WHERE national_id LIKE 'DEMO-NID-%';
SELECT COUNT(*) account_count FROM accounts;
SELECT COUNT(*) transaction_count FROM transactions;
SELECT COUNT(*) transfer_count FROM fund_transfers;
SELECT COUNT(*) loan_count FROM loans;
SELECT COUNT(*) active_loan_product_count FROM loan_types WHERE status='ACTIVE';
SELECT COUNT(*) active_deposit_scheme_count FROM deposit_schemes WHERE status='ACTIVE';
SELECT COUNT(*) notification_count FROM notifications;
SELECT COUNT(*) service_request_count FROM service_requests;
SELECT transfer_reference FROM fund_transfers WHERE debit_transaction_id IS NULL OR credit_transaction_id IS NULL;
