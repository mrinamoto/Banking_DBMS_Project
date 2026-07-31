-- Read-only verification for the final BANK_APP schema.
-- Run after the reset or upgrade worksheet; run seed:viva-users before
-- expecting application users or staff-ID rows.

SELECT table_name
  FROM user_tables
 WHERE table_name IN (
   'USERS','LOGIN_HISTORY','BRANCHES','CUSTOMERS','EMPLOYEES','ACCOUNTS',
   'TRANSACTIONS','FUND_TRANSFERS','TRANSACTION_REVERSALS','LOANS',
   'LOAN_PAYMENTS','BENEFICIARIES','CUSTOMER_KYC','DEPOSIT_SCHEMES',
   'DEPOSIT_CERTIFICATES','NOTIFICATIONS','SERVICE_REQUESTS'
 )
 ORDER BY table_name;

SELECT object_name, object_type, status
  FROM user_objects
 WHERE object_name IN (
   'PKG_BANKING_OPERATIONS','PKG_LOAN_OPERATIONS',
   'VW_ACCOUNT_STATEMENT','VW_DEPOSIT_CERTIFICATE_REMINDERS'
 )
 ORDER BY object_type, object_name;

SELECT object_name, object_type, status
  FROM user_objects
 WHERE status <> 'VALID'
 ORDER BY object_type, object_name;

SELECT name, type, line, position, text
  FROM user_errors
 ORDER BY name, sequence;

SELECT employee_code, first_name || ' ' || last_name AS employee_name,
       status
  FROM employees
 WHERE employee_code IN (
   'M-ID-001','E-ID-001','E-ID-002','E-ID-003','E-ID-004',
   'E-ID-005','E-ID-006','E-ID-007','E-ID-008'
 )
 ORDER BY employee_code;

SELECT username, staff_code, role, is_active, must_change_password,
       account_locked
  FROM users
 WHERE staff_code IN (
   'A-ID-001','A-ID-002','A-ID-003','A-ID-004','M-ID-001',
   'E-ID-001','E-ID-002','E-ID-003','E-ID-004','E-ID-005',
   'E-ID-006','E-ID-007','E-ID-008'
 )
 ORDER BY staff_code;

SELECT COUNT(*) AS branch_count FROM branches;
SELECT COUNT(*) AS customer_count FROM customers;
SELECT COUNT(*) AS account_count FROM accounts;
SELECT COUNT(*) AS transaction_count FROM transactions;
SELECT COUNT(*) AS transfer_count FROM fund_transfers;
SELECT COUNT(*) AS loan_count FROM loans;
SELECT COUNT(*) AS loan_product_count FROM loan_types WHERE status = 'ACTIVE';
SELECT COUNT(*) AS deposit_scheme_count FROM deposit_schemes WHERE status = 'ACTIVE';
SELECT COUNT(*) AS notification_count FROM notifications;
SELECT COUNT(*) AS service_request_count FROM service_requests;

SELECT type_name, status, interest_method
  FROM loan_types
 ORDER BY loan_type_id;

SELECT scheme_code, scheme_type, annual_profit_rate,
       calculation_method, status
  FROM deposit_schemes
 ORDER BY scheme_code;
