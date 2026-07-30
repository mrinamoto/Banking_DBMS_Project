-- Fictional demonstration data. Application users are intentionally created separately
-- with server/scripts/generate-demo-hash.js so no reusable password is stored in source.
INSERT INTO branches(branch_code,branch_name,city,address,phone,swift_code) VALUES('DHK-001','Dhanmondi Branch','Dhaka','Road 27, Dhanmondi','02-55501001','SBMSBDDH001');
INSERT INTO branches(branch_code,branch_name,city,address,phone,swift_code) VALUES('CTG-001','Agrabad Branch','Chattogram','Commercial Area, Agrabad','02-55501002','SBMSBDDH002');
INSERT INTO account_types(type_name,description,min_balance,annual_interest_rate) VALUES('Savings','Personal savings account',1000,3.50);
INSERT INTO account_types(type_name,description,min_balance,annual_interest_rate) VALUES('Current','Everyday current account',5000,0);
INSERT INTO loan_types(type_name,min_amount,max_amount,annual_interest_rate,min_term_months,max_term_months) VALUES('Personal Loan',50000,1000000,11.50,6,60);
INSERT INTO loan_types(type_name,min_amount,max_amount,annual_interest_rate,min_term_months,max_term_months) VALUES('Home Loan',500000,10000000,8.75,12,240);
INSERT INTO customers(first_name,last_name,date_of_birth,gender,phone,email,national_id,address,occupation,annual_income) VALUES('Nadia','Rahman',DATE '1994-05-14','F','01710000001','nadia.rahman@example.test','NID-DEMO-001','Dhanmondi, Dhaka','Engineer',900000);
INSERT INTO customers(first_name,last_name,date_of_birth,gender,phone,email,national_id,address,occupation,annual_income) VALUES('Arif','Hasan',DATE '1989-11-02','M','01710000002','arif.hasan@example.test','NID-DEMO-002','Agrabad, Chattogram','Teacher',720000);
INSERT INTO customer_kyc(customer_id,status) SELECT customer_id,'PENDING' FROM customers WHERE national_id IN ('NID-DEMO-001','NID-DEMO-002');
INSERT INTO employees(branch_id,employee_code,first_name,last_name,national_id,job_title,email,phone,salary) SELECT branch_id,'EMP-001','Samira','Khan','EMP-NID-001','Branch Manager','samira.khan@example.test','01810000001',85000 FROM branches WHERE branch_code='DHK-001';
INSERT INTO employees(branch_id,employee_code,first_name,last_name,national_id,job_title,email,phone,salary) SELECT branch_id,'EMP-002','Rafi','Ahmed','EMP-NID-002','Bank Officer','rafi.ahmed@example.test','01810000002',52000 FROM branches WHERE branch_code='DHK-001';
DECLARE v_number VARCHAR2(24); v_customer NUMBER; v_branch NUMBER; v_type NUMBER; BEGIN
  SELECT account_type_id INTO v_type FROM account_types WHERE type_name='Savings';
  SELECT customer_id INTO v_customer FROM customers WHERE national_id='NID-DEMO-001'; SELECT branch_id INTO v_branch FROM branches WHERE branch_code='DHK-001';
  pkg_banking_operations.open_account(v_customer,v_branch,v_type,25000,NULL,v_number);
  SELECT customer_id INTO v_customer FROM customers WHERE national_id='NID-DEMO-002'; SELECT branch_id INTO v_branch FROM branches WHERE branch_code='CTG-001';
  pkg_banking_operations.open_account(v_customer,v_branch,v_type,18000,NULL,v_number);
END;
/
COMMIT;
