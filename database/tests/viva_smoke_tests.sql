-- Read-only viva smoke checks. Run after staff seed and demo installation.
SELECT COUNT(*) staff_user_count FROM users WHERE staff_code IN ('A-ID-001','A-ID-002','A-ID-003','A-ID-004','M-ID-001','E-ID-001','E-ID-002','E-ID-003','E-ID-004','E-ID-005','E-ID-006','E-ID-007','E-ID-008') AND employee_id IS NOT NULL AND customer_id IS NULL;
SELECT role,COUNT(*) role_count FROM users WHERE staff_code IS NOT NULL GROUP BY role ORDER BY role;
SELECT COUNT(*) linked_staff_count FROM employees e WHERE e.employee_code IN ('A-ID-001','A-ID-002','A-ID-003','A-ID-004','M-ID-001','E-ID-001','E-ID-002','E-ID-003','E-ID-004','E-ID-005','E-ID-006','E-ID-007','E-ID-008') AND e.status='ACTIVE';
SELECT u.staff_code,e.employee_code,u.employee_id,e.employee_id FROM users u JOIN employees e ON e.employee_id=u.employee_id WHERE u.staff_code IS NOT NULL AND (u.staff_code<>e.employee_code OR u.role NOT IN ('ADMIN','MANAGER','EMPLOYEE'));
SELECT branch_code,branch_name,city,status FROM branches WHERE branch_code IN ('HO-001','DHK-001','UTT-001','CTG-001','CHP-001') ORDER BY branch_code;
SELECT COUNT(*) customer_count FROM customers WHERE national_id LIKE 'DEMO-NID-%';
SELECT COUNT(*) missing_named_customers FROM (SELECT 'DEMO-NID-'||LPAD(LEVEL,4,'0') national_id FROM dual CONNECT BY LEVEL <= 25) expected WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.national_id=expected.national_id);
SELECT COUNT(*) account_count FROM accounts;
SELECT COUNT(*) transaction_count FROM transactions;
SELECT COUNT(*) transfer_count FROM fund_transfers;
SELECT COUNT(*) unbalanced_transfer_pairs FROM fund_transfers f JOIN transactions d ON d.transaction_id=f.debit_transaction_id JOIN transactions c ON c.transaction_id=f.credit_transaction_id WHERE d.amount<>c.amount OR d.transaction_type<>'TRANSFER_DEBIT' OR c.transaction_type<>'TRANSFER_CREDIT';
SELECT COUNT(*) loan_count FROM loans;
SELECT COUNT(*) loan_product_count FROM loan_types WHERE status='ACTIVE';
SELECT COUNT(*) deposit_scheme_count FROM deposit_schemes WHERE status='ACTIVE';
SELECT COUNT(*) notification_count FROM notifications;
SELECT COUNT(*) service_request_count FROM service_requests;
SELECT object_name,object_type,status FROM user_objects WHERE status<>'VALID' ORDER BY object_type,object_name;
SELECT name,type,line,position,text FROM user_errors ORDER BY name,sequence;
