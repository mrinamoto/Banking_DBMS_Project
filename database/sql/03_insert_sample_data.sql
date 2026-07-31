-- Deterministic fictional reference data for the Smart Banking Management System.
-- No application users, passwords, customers, accounts, or ledger rows are created here.

MERGE INTO bank_profile b
USING (SELECT 1 profile_id FROM dual) s
   ON (b.profile_id = s.profile_id)
WHEN MATCHED THEN UPDATE SET
  bank_name='Smart Bank Limited', short_name='Smart Bank',
  head_office_address='DEMO Head Office, Motijheel, Dhaka',
  support_phone='DEMO-09600-00000', support_email='support@example.test',
  website='https://smartbank.example.test', swift_code='DEMO-SBMS-000',
  currency='BDT', status='ACTIVE', updated_at=SYSTIMESTAMP
WHEN NOT MATCHED THEN INSERT(
  profile_id,bank_name,short_name,head_office_address,support_phone,
  support_email,website,swift_code,currency,status
) VALUES(
  1,'Smart Bank Limited','Smart Bank','DEMO Head Office, Motijheel, Dhaka',
  'DEMO-09600-00000','support@example.test','https://smartbank.example.test',
  'DEMO-SBMS-000','BDT','ACTIVE'
);

MERGE INTO branches b USING (SELECT 'HO-001' branch_code FROM dual) s ON (b.branch_code=s.branch_code)
WHEN MATCHED THEN UPDATE SET branch_name='Smart Bank Head Office',city='Dhaka',address='DEMO Head Office, Motijheel',phone='DEMO-02-0000',swift_code='DEMO-SBMS-HO',status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(branch_code,branch_name,city,address,phone,swift_code) VALUES('HO-001','Smart Bank Head Office','Dhaka','DEMO Head Office, Motijheel','DEMO-02-0000','DEMO-SBMS-HO');
MERGE INTO branches b USING (SELECT 'DHK-001' branch_code FROM dual) s ON (b.branch_code=s.branch_code)
WHEN MATCHED THEN UPDATE SET branch_name='Dhanmondi Main Branch',city='Dhaka',address='DEMO Campus Road, Dhanmondi',phone='DEMO-02-0001',swift_code='DEMO-SBMS-001',status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(branch_code,branch_name,city,address,phone,swift_code) VALUES('DHK-001','Dhanmondi Main Branch','Dhaka','DEMO Campus Road, Dhanmondi','DEMO-02-0001','DEMO-SBMS-001');
MERGE INTO branches b USING (SELECT 'UTT-001' branch_code FROM dual) s ON (b.branch_code=s.branch_code)
WHEN MATCHED THEN UPDATE SET branch_name='Uttara Branch',city='Dhaka',address='DEMO Sector 7, Uttara',phone='DEMO-02-0002',swift_code='DEMO-SBMS-002',status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(branch_code,branch_name,city,address,phone,swift_code) VALUES('UTT-001','Uttara Branch','Dhaka','DEMO Sector 7, Uttara','DEMO-02-0002','DEMO-SBMS-002');
MERGE INTO branches b USING (SELECT 'CTG-001' branch_code FROM dual) s ON (b.branch_code=s.branch_code)
WHEN MATCHED THEN UPDATE SET branch_name='Agrabad Branch',city='Chattogram',address='DEMO Commercial Area, Agrabad',phone='DEMO-02-0003',swift_code='DEMO-SBMS-003',status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(branch_code,branch_name,city,address,phone,swift_code) VALUES('CTG-001','Agrabad Branch','Chattogram','DEMO Commercial Area, Agrabad','DEMO-02-0003','DEMO-SBMS-003');
MERGE INTO branches b USING (SELECT 'CHP-001' branch_code FROM dual) s ON (b.branch_code=s.branch_code)
WHEN MATCHED THEN UPDATE SET branch_name='Chandpur Branch',city='Chandpur',address='DEMO River Road, Chandpur',phone='DEMO-02-0004',swift_code='DEMO-SBMS-004',status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(branch_code,branch_name,city,address,phone,swift_code) VALUES('CHP-001','Chandpur Branch','Chandpur','DEMO River Road, Chandpur','DEMO-02-0004','DEMO-SBMS-004');

MERGE INTO account_types t USING (SELECT 'Savings' type_name FROM dual) s ON (t.type_name=s.type_name)
WHEN MATCHED THEN UPDATE SET description='Personal savings account',min_balance=1000,annual_interest_rate=3.5,status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(type_name,description,min_balance,annual_interest_rate) VALUES('Savings','Personal savings account',1000,3.5);
MERGE INTO account_types t USING (SELECT 'Current' type_name FROM dual) s ON (t.type_name=s.type_name)
WHEN MATCHED THEN UPDATE SET description='Everyday current account',min_balance=5000,annual_interest_rate=0,status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(type_name,description,min_balance,annual_interest_rate) VALUES('Current','Everyday current account',5000,0);
MERGE INTO account_types t USING (SELECT 'Student' type_name FROM dual) s ON (t.type_name=s.type_name)
WHEN MATCHED THEN UPDATE SET description='Fictional student account',min_balance=500,annual_interest_rate=2.5,status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(type_name,description,min_balance,annual_interest_rate) VALUES('Student','Fictional student account',500,2.5);
MERGE INTO account_types t USING (SELECT 'Business' type_name FROM dual) s ON (t.type_name=s.type_name)
WHEN MATCHED THEN UPDATE SET description='Fictional small business account',min_balance=10000,annual_interest_rate=1.25,status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(type_name,description,min_balance,annual_interest_rate) VALUES('Business','Fictional small business account',10000,1.25);
MERGE INTO account_types t USING (SELECT 'Salary' type_name FROM dual) s ON (t.type_name=s.type_name)
WHEN MATCHED THEN UPDATE SET description='Fictional salary account',min_balance=1000,annual_interest_rate=2,status='ACTIVE'
WHEN NOT MATCHED THEN INSERT(type_name,description,min_balance,annual_interest_rate) VALUES('Salary','Fictional salary account',1000,2);

INSERT INTO deposit_schemes(scheme_code,scheme_name,scheme_type,minimum_amount,maximum_amount,minimum_months,maximum_months,annual_profit_rate,calculation_method,payment_frequency,tax_percentage,early_withdrawal_rate)
SELECT 'FD-SIMPLE','Classroom Fixed Deposit','FIXED_DEPOSIT',10000,5000000,3,36,8,'SIMPLE','AT_MATURITY',10,3 FROM dual WHERE NOT EXISTS (SELECT 1 FROM deposit_schemes WHERE scheme_code='FD-SIMPLE');
INSERT INTO deposit_schemes(scheme_code,scheme_name,scheme_type,minimum_amount,maximum_amount,minimum_months,maximum_months,annual_profit_rate,calculation_method,payment_frequency,tax_percentage,early_withdrawal_rate)
SELECT 'FD-COMPOUND','Monthly Compound Deposit','MONTHLY_PROFIT',10000,5000000,6,36,8.5,'MONTHLY_COMPOUND','AT_MATURITY',10,3 FROM dual WHERE NOT EXISTS (SELECT 1 FROM deposit_schemes WHERE scheme_code='FD-COMPOUND');
INSERT INTO deposit_schemes(scheme_code,scheme_name,scheme_type,minimum_amount,maximum_amount,minimum_months,maximum_months,annual_profit_rate,calculation_method,payment_frequency,tax_percentage,early_withdrawal_rate)
SELECT 'DPS-EDU','Educational DPS','DPS',500,100000,12,36,7.25,'MONTHLY_COMPOUND','RECURRING',5,2 FROM dual WHERE NOT EXISTS (SELECT 1 FROM deposit_schemes WHERE scheme_code='DPS-EDU');
INSERT INTO deposit_schemes(scheme_code,scheme_name,scheme_type,minimum_amount,maximum_amount,minimum_months,maximum_months,annual_profit_rate,calculation_method,payment_frequency,tax_percentage,early_withdrawal_rate,student_only)
SELECT 'STUDENT-SAVE','Student Savings Estimate','STUDENT_SAVINGS',1000,100000,3,24,6,'SIMPLE','AT_MATURITY',0,2,'Y' FROM dual WHERE NOT EXISTS (SELECT 1 FROM deposit_schemes WHERE scheme_code='STUDENT-SAVE');

COMMIT;
