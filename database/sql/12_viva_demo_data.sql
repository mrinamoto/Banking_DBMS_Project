-- Deterministic fictional university demonstration data.
-- No users or passwords are created here; run the runtime seed for staff logins.

MERGE INTO branches b USING (SELECT 'DHK-001' code FROM dual) s ON (b.branch_code=s.code)
WHEN MATCHED THEN UPDATE SET branch_name='Dhanmondi Main Branch',city='Dhaka',address='DEMO Campus Road, Dhanmondi',phone='DEMO-02-0001',swift_code='DEMO-SBMS-001',status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(branch_code,branch_name,city,address,phone,swift_code) VALUES('DHK-001','Dhanmondi Main Branch','Dhaka','DEMO Campus Road, Dhanmondi','DEMO-02-0001','DEMO-SBMS-001');
MERGE INTO branches b USING (SELECT 'UTT-001' code FROM dual) s ON (b.branch_code=s.code)
WHEN NOT MATCHED THEN INSERT(branch_code,branch_name,city,address,phone,swift_code) VALUES('UTT-001','Uttara Branch','Dhaka','DEMO Sector 7, Uttara','DEMO-02-0002','DEMO-SBMS-002');
MERGE INTO branches b USING (SELECT 'CTG-001' code FROM dual) s ON (b.branch_code=s.code)
WHEN MATCHED THEN UPDATE SET branch_name='Agrabad Branch',city='Chattogram',address='DEMO Commercial Area, Agrabad',phone='DEMO-02-0003',status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(branch_code,branch_name,city,address,phone,swift_code) VALUES('CTG-001','Agrabad Branch','Chattogram','DEMO Commercial Area, Agrabad','DEMO-02-0003','DEMO-SBMS-003');
MERGE INTO branches b USING (SELECT 'CHP-001' code FROM dual) s ON (b.branch_code=s.code)
WHEN NOT MATCHED THEN INSERT(branch_code,branch_name,city,address,phone,swift_code) VALUES('CHP-001','Chandpur Branch','Chandpur','DEMO River Road, Chandpur','DEMO-02-0004','DEMO-SBMS-004');

INSERT INTO account_types(type_name,description,min_balance,annual_interest_rate)
SELECT 'Student','Fictional student account',500,2.50 FROM dual WHERE NOT EXISTS (SELECT 1 FROM account_types WHERE type_name='Student');
INSERT INTO account_types(type_name,description,min_balance,annual_interest_rate)
SELECT 'Business','Fictional small business account',10000,1.25 FROM dual WHERE NOT EXISTS (SELECT 1 FROM account_types WHERE type_name='Business');

MERGE INTO loan_types t USING (SELECT 'Personal Loan' type_name FROM dual) s ON (t.type_name=s.type_name)
WHEN MATCHED THEN UPDATE SET short_description='Flexible personal finance',detailed_description='Educational reducing-balance product for household needs.',minimum_annual_income=300000,processing_fee_percentage=1,eligibility_summary='Stable income and verified KYC',required_document_summary='DEMO identity and income evidence',interest_method='REDUCING_BALANCE',min_amount=50000,max_amount=1000000,annual_interest_rate=11.5,min_term_months=6,max_term_months=60,status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(type_name,short_description,detailed_description,minimum_annual_income,processing_fee_percentage,eligibility_summary,required_document_summary,interest_method,min_amount,max_amount,annual_interest_rate,min_term_months,max_term_months) VALUES('Personal Loan','Flexible personal finance','Educational reducing-balance product for household needs.',300000,1,'Stable income and verified KYC','DEMO identity and income evidence','REDUCING_BALANCE',50000,1000000,11.5,6,60);
MERGE INTO loan_types t USING (SELECT 'Home Loan' type_name FROM dual) s ON (t.type_name=s.type_name)
WHEN MATCHED THEN UPDATE SET short_description='Home purchase finance',detailed_description='Educational long-term product for an eligible home purchase.',minimum_annual_income=600000,processing_fee_percentage=.5,eligibility_summary='Stable income, address and KYC',required_document_summary='DEMO identity, income and property evidence',interest_method='REDUCING_BALANCE',min_amount=500000,max_amount=10000000,annual_interest_rate=8.75,min_term_months=12,max_term_months=240,status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(type_name,short_description,detailed_description,minimum_annual_income,processing_fee_percentage,eligibility_summary,required_document_summary,interest_method,min_amount,max_amount,annual_interest_rate,min_term_months,max_term_months) VALUES('Home Loan','Home purchase finance','Educational long-term product for an eligible home purchase.',600000,.5,'Stable income, address and KYC','DEMO identity, income and property evidence','REDUCING_BALANCE',500000,10000000,8.75,12,240);
INSERT INTO loan_types(type_name,short_description,detailed_description,minimum_annual_income,processing_fee_percentage,eligibility_summary,required_document_summary,interest_method,min_amount,max_amount,annual_interest_rate,min_term_months,max_term_months)
SELECT 'Education Loan','Study support','Educational financing for tuition and learning expenses.',240000,0.25,'Admission evidence and stable sponsor income','DEMO identity, admission and income evidence','REDUCING_BALANCE',25000,1500000,9.25,6,84 FROM dual WHERE NOT EXISTS (SELECT 1 FROM loan_types WHERE type_name='Education Loan');
INSERT INTO loan_types(type_name,short_description,detailed_description,minimum_annual_income,processing_fee_percentage,eligibility_summary,required_document_summary,interest_method,min_amount,max_amount,annual_interest_rate,min_term_months,max_term_months)
SELECT 'Small Business Loan','Startup and working capital','Educational working-capital finance for small enterprises.',360000,1.25,'Operating history and verified cash flow','DEMO identity, trade evidence and cash-flow summary','REDUCING_BALANCE',100000,2500000,12.25,6,72 FROM dual WHERE NOT EXISTS (SELECT 1 FROM loan_types WHERE type_name='Small Business Loan');
INSERT INTO loan_types(type_name,short_description,detailed_description,minimum_annual_income,processing_fee_percentage,eligibility_summary,required_document_summary,interest_method,min_amount,max_amount,annual_interest_rate,min_term_months,max_term_months)
SELECT 'Vehicle Loan','Vehicle purchase finance','Educational vehicle finance with reducing-balance interest.',420000,0.75,'Stable income and verified vehicle quotation','DEMO identity, income and quotation evidence','REDUCING_BALANCE',150000,4000000,10.75,12,84 FROM dual WHERE NOT EXISTS (SELECT 1 FROM loan_types WHERE type_name='Vehicle Loan');
INSERT INTO loan_types(type_name,short_description,detailed_description,minimum_annual_income,processing_fee_percentage,eligibility_summary,required_document_summary,interest_method,min_amount,max_amount,annual_interest_rate,min_term_months,max_term_months)
SELECT 'Emergency Loan','Short-term emergency support','Educational short-term support subject to review.',180000,1.5,'Verified customer and urgent need evidence','DEMO identity and supporting explanation','FLAT_RATE',25000,300000,13.5,3,24 FROM dual WHERE NOT EXISTS (SELECT 1 FROM loan_types WHERE type_name='Emergency Loan');

INSERT INTO deposit_schemes(scheme_code,scheme_name,scheme_type,minimum_amount,maximum_amount,minimum_months,maximum_months,annual_profit_rate,calculation_method,payment_frequency,tax_percentage,early_withdrawal_rate)
SELECT 'FD-PREMIUM','Premium Classroom Deposit','FIXED_DEPOSIT',50000,10000000,6,60,9,'SIMPLE','AT_MATURITY',10,4 FROM dual WHERE NOT EXISTS (SELECT 1 FROM deposit_schemes WHERE scheme_code='FD-PREMIUM');
INSERT INTO deposit_schemes(scheme_code,scheme_name,scheme_type,minimum_amount,maximum_amount,minimum_months,maximum_months,annual_profit_rate,calculation_method,payment_frequency,tax_percentage,early_withdrawal_rate)
SELECT 'DPS-FLEX','Flexible Classroom DPS','DPS',1000,200000,12,60,7.75,'MONTHLY_COMPOUND','RECURRING',5,2 FROM dual WHERE NOT EXISTS (SELECT 1 FROM deposit_schemes WHERE scheme_code='DPS-FLEX');

UPDATE employees SET first_name='Mayen',last_name='Majumder',job_title='Project Supervisor / Branch Manager',email='mayen.majumder@example.test',phone='DEMO-018-0001',salary=90000,branch_id=(SELECT branch_id FROM branches WHERE branch_code='DHK-001') WHERE employee_code='M-ID-001';
UPDATE employees SET first_name='Mashrur',last_name='Hasan',job_title='Senior Banking Officer',email='mashrur.hasan@example.test',phone='DEMO-018-0002',salary=55000,branch_id=(SELECT branch_id FROM branches WHERE branch_code='DHK-001') WHERE employee_code='E-ID-001';
INSERT INTO employees(branch_id,employee_code,first_name,last_name,national_id,job_title,email,phone,salary) SELECT (SELECT branch_id FROM branches WHERE branch_code=CASE MOD(2,4) WHEN 0 THEN 'DHK-001' WHEN 1 THEN 'UTT-001' WHEN 2 THEN 'CTG-001' ELSE 'CHP-001' END),'E-ID-002','Risha','Khan','DEMO-EMP-NID-002','Customer Officer','risha.khan@example.test','DEMO-018-0003',52000 FROM dual WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_code='E-ID-002');
INSERT INTO employees(branch_id,employee_code,first_name,last_name,national_id,job_title,email,phone,salary) SELECT (SELECT branch_id FROM branches WHERE branch_code='CTG-001'),'E-ID-003','Samin','Hasan','DEMO-EMP-NID-003','Credit Officer','samin.hasan@example.test','DEMO-018-0004',56000 FROM dual WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_code='E-ID-003');
INSERT INTO employees(branch_id,employee_code,first_name,last_name,national_id,job_title,email,phone,salary) SELECT (SELECT branch_id FROM branches WHERE branch_code='CHP-001'),'E-ID-004','Abrar','Karib','DEMO-EMP-NID-004','Service Officer','abrar.karib@example.test','DEMO-018-0005',51000 FROM dual WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_code='E-ID-004');
INSERT INTO employees(branch_id,employee_code,first_name,last_name,national_id,job_title,email,phone,salary) SELECT (SELECT branch_id FROM branches WHERE branch_code='DHK-001'),'E-ID-005','Rakib','Hasan','DEMO-EMP-NID-005','Operations Officer','rakib.hasan@example.test','DEMO-018-0006',53000 FROM dual WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_code='E-ID-005');
INSERT INTO employees(branch_id,employee_code,first_name,last_name,national_id,job_title,email,phone,salary) SELECT (SELECT branch_id FROM branches WHERE branch_code='UTT-001'),'E-ID-006','Prapto','Sorkar','DEMO-EMP-NID-006','Account Officer','prapto.sorkar@example.test','DEMO-018-0007',50000 FROM dual WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_code='E-ID-006');
INSERT INTO employees(branch_id,employee_code,first_name,last_name,national_id,job_title,email,phone,salary) SELECT (SELECT branch_id FROM branches WHERE branch_code='CTG-001'),'E-ID-007','Sayba','Tasnim','DEMO-EMP-NID-007','Loan Officer','sayba.tasnim@example.test','DEMO-018-0008',54000 FROM dual WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_code='E-ID-007');
INSERT INTO employees(branch_id,employee_code,first_name,last_name,national_id,job_title,email,phone,salary) SELECT (SELECT branch_id FROM branches WHERE branch_code='CHP-001'),'E-ID-008','Tasnia','Suborno','DEMO-EMP-NID-008','Customer Support Officer','tasnia.suborno@example.test','DEMO-018-0009',50000 FROM dual WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_code='E-ID-008');

DECLARE
  TYPE t_name_list IS TABLE OF VARCHAR2(80); names t_name_list := t_name_list('Nusrat Jahan','Shamim Hasan','Geko Topadar','Chypher Hasan','Ryna Jahan','Jet Bagom','Chember Rahman','Astra Tabbassum','Raze Akter','Skye Tasnim','Clove Hasan','Tasfia Neon','Abul Phenix','Sage Mostofa','Mohammad Yoru','Jahanggir Harbor','Alongir Tejo','Luna Kabir','Orion Sultana','Nova Rahman');
  v_first VARCHAR2(50); v_last VARCHAR2(50); v_space PLS_INTEGER;
BEGIN
  FOR i IN 1..names.COUNT LOOP
    v_space := INSTR(names(i),' '); v_first := SUBSTR(names(i),1,v_space-1); v_last := SUBSTR(names(i),v_space+1);
    INSERT INTO customers(first_name,last_name,date_of_birth,gender,phone,email,national_id,address,occupation,annual_income)
    SELECT v_first,v_last,ADD_MONTHS(DATE '1985-01-01',i*7),'O','DEMO-CUST-'||LPAD(i,4,'0'),LOWER(REPLACE(names(i),' ','-'))||'@example.test','DEMO-NID-'||LPAD(i,4,'0'),'DEMO Address '||LPAD(i,2,'0'),'Demo Occupation '||LPAD(i,2,'0'),300000+i*25000 FROM dual
    WHERE NOT EXISTS (SELECT 1 FROM customers WHERE national_id='DEMO-NID-'||LPAD(i,4,'0'));
  END LOOP;
END;
/

INSERT INTO customer_kyc(customer_id,status,document_type,document_reference)
SELECT c.customer_id,CASE WHEN MOD(c.customer_id,4)=0 THEN 'VERIFIED' ELSE 'PENDING' END,'NID','DEMO-KYC-'||c.national_id FROM customers c WHERE c.national_id LIKE 'DEMO-NID-%' AND NOT EXISTS (SELECT 1 FROM customer_kyc k WHERE k.customer_id=c.customer_id);

DECLARE
  v_number VARCHAR2(24); v_type NUMBER; v_branch NUMBER; v_amount NUMBER; v_existing_account_count NUMBER;
BEGIN
  SELECT account_type_id INTO v_type FROM account_types WHERE type_name='Savings';
  FOR c IN (SELECT c.customer_id,ROW_NUMBER() OVER (ORDER BY c.customer_id) rn FROM customers c WHERE c.national_id LIKE 'DEMO-NID-%') LOOP
    SELECT COUNT(*) INTO v_existing_account_count FROM accounts a WHERE a.customer_id=c.customer_id;
    IF v_existing_account_count = 0 THEN
      SELECT branch_id INTO v_branch FROM branches WHERE branch_code=CASE MOD(c.rn-1,4) WHEN 0 THEN 'DHK-001' WHEN 1 THEN 'UTT-001' WHEN 2 THEN 'CTG-001' ELSE 'CHP-001' END;
      v_amount := 18000 + c.rn*250;
      pkg_banking_operations.open_account(c.customer_id,v_branch,v_type,v_amount,NULL,v_number);
    END IF;
  END LOOP;
END;
/

DECLARE v_ref VARCHAR2(100); v_count NUMBER := 0;
BEGIN
  FOR a IN (SELECT account_number FROM (SELECT account_number,ROW_NUMBER() OVER (ORDER BY account_id) rn FROM accounts) WHERE rn <= 22) LOOP
    pkg_banking_operations.deposit(a.account_number,750,NULL,v_ref); v_count := v_count+1;
  END LOOP;
  FOR a IN (SELECT account_number FROM (SELECT account_number,ROW_NUMBER() OVER (ORDER BY account_id) rn FROM accounts) WHERE rn <= 10) LOOP
    pkg_banking_operations.withdraw(a.account_number,250,NULL,v_ref); v_count := v_count+1;
  END LOOP;
END;
/

DECLARE v_ref VARCHAR2(100); v_owner NUMBER;
BEGIN
  FOR pair IN (SELECT from_account,to_account,owner_customer_id FROM (
    SELECT a.account_number from_account,LEAD(a.account_number) OVER (ORDER BY a.account_id) to_account,a.customer_id owner_customer_id,ROW_NUMBER() OVER (ORDER BY a.account_id) rn FROM accounts a) WHERE rn <= 10 AND to_account IS NOT NULL) LOOP
    pkg_banking_operations.transfer_funds(pair.from_account,pair.to_account,300,NULL,pair.owner_customer_id,v_ref);
  END LOOP;
END;
/

DECLARE v_number VARCHAR2(40); v_type NUMBER; v_emp NUMBER; v_count NUMBER := 0;
BEGIN
  SELECT employee_id INTO v_emp FROM employees WHERE employee_code='M-ID-001';
  FOR a IN (SELECT account_id,customer_id,account_number,ROW_NUMBER() OVER (ORDER BY account_id) rn FROM accounts WHERE ROWNUM <= 10) LOOP
    SELECT loan_type_id INTO v_type FROM (SELECT loan_type_id,ROW_NUMBER() OVER (ORDER BY loan_type_id) rn FROM loan_types WHERE status='ACTIVE') WHERE rn=1+MOD(a.rn-1,6);
    pkg_loan_operations.apply_for_loan(a.customer_id,v_type,a.account_id,50000+MOD(a.rn,5)*10000,12,v_number);
  END LOOP;
  FOR l IN (SELECT loan_id,requested_amount FROM (SELECT loan_id,requested_amount,ROW_NUMBER() OVER (ORDER BY loan_id) rn FROM loans WHERE status='PENDING') WHERE rn <= 4) LOOP
    pkg_loan_operations.approve_loan(l.loan_id,l.requested_amount,v_emp,NULL,v_number);
  END LOOP;
  FOR l IN (SELECT loan_id FROM (SELECT loan_id,ROW_NUMBER() OVER (ORDER BY loan_id) rn FROM loans WHERE status='PENDING') WHERE rn <= 2) LOOP
    pkg_loan_operations.reject_loan(l.loan_id,'Demo affordability review',v_emp);
  END LOOP;
  FOR l IN (SELECT loan_id,account_number FROM (SELECT l.loan_id,a.account_number,ROW_NUMBER() OVER (ORDER BY l.loan_id) rn FROM loans l JOIN accounts a ON a.account_id=l.disbursement_account_id WHERE l.status='ACTIVE') WHERE rn <= 2) LOOP
    pkg_loan_operations.record_payment(l.loan_id,l.account_number,1000,NULL,v_number);
  END LOOP;
END;
/

INSERT INTO beneficiaries(customer_id,source_account_id,beneficiary_account_id,nickname)
SELECT a.customer_id,a.account_id,b.account_id,'Demo beneficiary '||a.customer_id FROM accounts a JOIN accounts b ON b.account_id=a.account_id+1 WHERE a.customer_id IN (SELECT customer_id FROM customers WHERE national_id LIKE 'DEMO-NID-%') AND a.account_id<>b.account_id AND NOT EXISTS (SELECT 1 FROM beneficiaries x WHERE x.customer_id=a.customer_id AND x.source_account_id=a.account_id AND x.beneficiary_account_id=b.account_id);

INSERT INTO deposit_certificates(certificate_number,customer_id,account_id,scheme_id,principal_amount,annual_profit_rate,duration_months,calculation_method,tax_percentage,expected_gross_profit,expected_tax,expected_net_profit,expected_maturity_amount,opening_date,maturity_date,status)
SELECT 'DEMO-QUOTE-'||LPAD(c.customer_id,6,'0'),c.customer_id,a.account_id,s.scheme_id,25000,s.annual_profit_rate,12,s.calculation_method,s.tax_percentage,ROUND(25000*s.annual_profit_rate/100,2),ROUND(25000*s.annual_profit_rate/100*s.tax_percentage/100,2),ROUND(25000*s.annual_profit_rate/100*(1-s.tax_percentage/100),2),ROUND(25000+25000*s.annual_profit_rate/100*(1-s.tax_percentage/100),2),TRUNC(SYSDATE),ADD_MONTHS(TRUNC(SYSDATE),12),'QUOTATION' FROM customers c JOIN accounts a ON a.customer_id=c.customer_id CROSS JOIN (SELECT * FROM deposit_schemes WHERE scheme_code='FD-SIMPLE') s WHERE c.national_id LIKE 'DEMO-NID-%' AND ROWNUM <= 8 AND NOT EXISTS (SELECT 1 FROM deposit_certificates d WHERE d.certificate_number='DEMO-QUOTE-'||LPAD(c.customer_id,6,'0'));

INSERT INTO service_requests(request_number,customer_id,branch_id,request_type,subject,description)
SELECT 'DEMO-SR-'||LPAD(c.customer_id,6,'0'),c.customer_id,a.branch_id,CASE MOD(c.customer_id,6) WHEN 0 THEN 'ACCOUNT_FREEZE' WHEN 1 THEN 'STATEMENT' WHEN 2 THEN 'PROFILE_HELP' WHEN 3 THEN 'BENEFICIARY_HELP' WHEN 4 THEN 'LOAN_INFORMATION' ELSE 'GENERAL_SUPPORT' END,'Demo service request','Fictional university demonstration request.' FROM customers c JOIN accounts a ON a.customer_id=c.customer_id WHERE c.national_id LIKE 'DEMO-NID-%' AND ROWNUM <= 10 AND NOT EXISTS (SELECT 1 FROM service_requests r WHERE r.request_number='DEMO-SR-'||LPAD(c.customer_id,6,'0'));
INSERT INTO audit_log(table_name,record_id,action_name,action_by,new_summary) SELECT 'DEMO_DATA',c.customer_id,'VIVA_SEED','SYSTEM','Fictional university demonstration data' FROM customers c WHERE c.national_id LIKE 'DEMO-NID-%' AND ROWNUM <= 5;
COMMIT;
