SET SERVEROUTPUT ON
SET VERIFY OFF
-- Run only after database/run_all.sql in a disposable project schema.
-- The outer savepoint guarantees that all test rows and balance changes are rolled back.
DECLARE
  v_total NUMBER:=0;
  v_passed NUMBER:=0;
  v_failed NUMBER:=0;
  v_branch NUMBER;
  v_type NUMBER;
  v_loan_type NUMBER;
  v_manager NUMBER;
  v_customer1 NUMBER;
  v_customer2 NUMBER;
  v_account1_id NUMBER;
  v_account2_id NUMBER;
  v_account1 VARCHAR2(24);
  v_account2 VARCHAR2(24);
  v_reference VARCHAR2(80);
  v_before1 NUMBER;
  v_before2 NUMBER;
  v_after1 NUMBER;
  v_after2 NUMBER;
  v_count NUMBER;
  v_loan NUMBER;
  v_loan_number VARCHAR2(30);
  v_outstanding NUMBER;

  PROCEDURE pass(p_name VARCHAR2) IS
  BEGIN v_total:=v_total+1;v_passed:=v_passed+1;DBMS_OUTPUT.PUT_LINE('PASS: '||p_name);END;
  PROCEDURE fail(p_name VARCHAR2,p_message VARCHAR2) IS
  BEGIN v_total:=v_total+1;v_failed:=v_failed+1;DBMS_OUTPUT.PUT_LINE('FAIL: '||p_name||' - '||p_message);END;
  PROCEDURE unexpected(p_name VARCHAR2) IS
  BEGIN fail(p_name,'unexpected SQLCODE '||SQLCODE||': '||SQLERRM);END;
BEGIN
  SAVEPOINT acceptance_suite;
  SELECT branch_id INTO v_branch FROM branches WHERE status='ACTIVE' FETCH FIRST 1 ROW ONLY;
  SELECT account_type_id INTO v_type FROM account_types WHERE status='ACTIVE' ORDER BY min_balance FETCH FIRST 1 ROW ONLY;
  SELECT loan_type_id INTO v_loan_type FROM loan_types WHERE status='ACTIVE' FETCH FIRST 1 ROW ONLY;
  SELECT employee_id INTO v_manager FROM employees WHERE status='ACTIVE' FETCH FIRST 1 ROW ONLY;

  INSERT INTO customers(first_name,last_name,date_of_birth,gender,phone,email,national_id,address)
  VALUES('Acceptance','One',DATE '1990-01-01','O','01999000101','acceptance.one@example.test','ACCEPT-NID-01','Test address')
  RETURNING customer_id INTO v_customer1;
  INSERT INTO customers(first_name,last_name,date_of_birth,gender,phone,email,national_id,address)
  VALUES('Acceptance','Two',DATE '1991-01-01','O','01999000102','acceptance.two@example.test','ACCEPT-NID-02','Test address')
  RETURNING customer_id INTO v_customer2;

  -- 1 Valid account opening
  BEGIN
    pkg_banking_operations.open_account(v_customer1,v_branch,v_type,100000,NULL,v_account1);
    SELECT account_id INTO v_account1_id FROM accounts WHERE account_number=v_account1;
    pass('01 valid account opening');
  EXCEPTION WHEN OTHERS THEN unexpected('01 valid account opening'); END;
  BEGIN
    pkg_banking_operations.open_account(v_customer2,v_branch,v_type,100000,NULL,v_account2);
    SELECT account_id INTO v_account2_id FROM accounts WHERE account_number=v_account2;
  EXCEPTION WHEN OTHERS THEN RAISE; END;

  -- 2 Initial deposit below minimum
  BEGIN
    DECLARE v_bad VARCHAR2(24); v_min NUMBER; BEGIN
      SELECT min_balance INTO v_min FROM account_types WHERE account_type_id=v_type;
      pkg_banking_operations.open_account(v_customer1,v_branch,v_type,v_min-0.01,NULL,v_bad);
      fail('02 initial deposit below minimum','operation was accepted');
    EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20014 THEN pass('02 initial deposit below minimum'); ELSE unexpected('02 initial deposit below minimum'); END IF; END;
  END;

  -- 3 Valid deposit
  BEGIN
    SAVEPOINT t03;v_before1:=fn_get_account_balance(v_account1);
    pkg_banking_operations.deposit(v_account1,500,NULL,v_reference);
    IF fn_get_account_balance(v_account1)=v_before1+500 THEN pass('03 valid deposit'); ELSE fail('03 valid deposit','balance mismatch'); END IF;
    ROLLBACK TO t03;
  EXCEPTION WHEN OTHERS THEN unexpected('03 valid deposit');ROLLBACK TO t03; END;

  -- 4 and 5 exact invalid deposit codes and unchanged balance
  BEGIN v_before1:=fn_get_account_balance(v_account1);pkg_banking_operations.deposit(v_account1,0,NULL,v_reference);fail('04 zero deposit','accepted');
  EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20010 AND fn_get_account_balance(v_account1)=v_before1 THEN pass('04 zero deposit'); ELSE unexpected('04 zero deposit'); END IF; END;
  BEGIN v_before1:=fn_get_account_balance(v_account1);pkg_banking_operations.deposit(v_account1,-1,NULL,v_reference);fail('05 negative deposit','accepted');
  EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20010 AND fn_get_account_balance(v_account1)=v_before1 THEN pass('05 negative deposit'); ELSE unexpected('05 negative deposit'); END IF; END;

  -- 6 Valid withdrawal
  BEGIN SAVEPOINT t06;v_before1:=fn_get_account_balance(v_account1);pkg_banking_operations.withdraw(v_account1,100,NULL,v_reference);
    IF fn_get_account_balance(v_account1)=v_before1-100 THEN pass('06 valid withdrawal'); ELSE fail('06 valid withdrawal','balance mismatch'); END IF;ROLLBACK TO t06;
  EXCEPTION WHEN OTHERS THEN unexpected('06 valid withdrawal');ROLLBACK TO t06; END;

  -- 7 Insufficient withdrawal
  BEGIN v_before1:=fn_get_account_balance(v_account1);pkg_banking_operations.withdraw(v_account1,v_before1+1,NULL,v_reference);fail('07 insufficient withdrawal','accepted');
  EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20018 AND fn_get_account_balance(v_account1)=v_before1 THEN pass('07 insufficient withdrawal'); ELSE unexpected('07 insufficient withdrawal'); END IF; END;

  -- 8 Frozen account operation
  BEGIN SAVEPOINT t08;UPDATE accounts SET status='FROZEN' WHERE account_id=v_account1_id;v_before1:=fn_get_account_balance(v_account1);pkg_banking_operations.deposit(v_account1,10,NULL,v_reference);fail('08 frozen account operation','accepted');
  EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20015 AND fn_get_account_balance(v_account1)=v_before1 THEN pass('08 frozen account operation'); ELSE unexpected('08 frozen account operation'); END IF;ROLLBACK TO t08; END;

  -- 9 Valid transfer
  BEGIN SAVEPOINT t09;v_before1:=fn_get_account_balance(v_account1);v_before2:=fn_get_account_balance(v_account2);pkg_banking_operations.transfer_funds(v_account1,v_account2,250,NULL,NULL,v_reference);
    IF fn_get_account_balance(v_account1)=v_before1-250 AND fn_get_account_balance(v_account2)=v_before2+250 THEN pass('09 valid transfer'); ELSE fail('09 valid transfer','balance mismatch'); END IF;ROLLBACK TO t09;
  EXCEPTION WHEN OTHERS THEN unexpected('09 valid transfer');ROLLBACK TO t09; END;

  -- 10 Same-account transfer
  BEGIN v_before1:=fn_get_account_balance(v_account1);pkg_banking_operations.transfer_funds(v_account1,v_account1,10,NULL,NULL,v_reference);fail('10 same-account transfer','accepted');
  EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20020 AND fn_get_account_balance(v_account1)=v_before1 THEN pass('10 same-account transfer'); ELSE unexpected('10 same-account transfer'); END IF; END;

  -- 11 Invalid receiver
  BEGIN v_before1:=fn_get_account_balance(v_account1);pkg_banking_operations.transfer_funds(v_account1,'INVALID-ACCOUNT',10,NULL,NULL,v_reference);fail('11 invalid receiver','accepted');
  EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20024 AND fn_get_account_balance(v_account1)=v_before1 THEN pass('11 invalid receiver'); ELSE unexpected('11 invalid receiver'); END IF; END;

  -- 12 Insufficient transfer balance
  BEGIN v_before1:=fn_get_account_balance(v_account1);v_before2:=fn_get_account_balance(v_account2);pkg_banking_operations.transfer_funds(v_account1,v_account2,v_before1+1,NULL,NULL,v_reference);fail('12 insufficient transfer','accepted');
  EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20023 AND fn_get_account_balance(v_account1)=v_before1 AND fn_get_account_balance(v_account2)=v_before2 THEN pass('12 insufficient transfer'); ELSE unexpected('12 insufficient transfer'); END IF; END;

  -- 13 Customer ownership
  BEGIN v_before1:=fn_get_account_balance(v_account1);pkg_banking_operations.transfer_funds(v_account1,v_account2,10,NULL,v_customer2,v_reference);fail('13 customer transfer ownership','accepted');
  EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20022 AND fn_get_account_balance(v_account1)=v_before1 THEN pass('13 customer transfer ownership'); ELSE unexpected('13 customer transfer ownership'); END IF; END;

  -- 14 and 15 failed transfer leaves both accounts unchanged
  BEGIN v_before1:=fn_get_account_balance(v_account1);v_before2:=fn_get_account_balance(v_account2);
    BEGIN pkg_banking_operations.transfer_funds(v_account1,v_account2,v_before1+1,NULL,NULL,v_reference);EXCEPTION WHEN OTHERS THEN IF SQLCODE<>-20023 THEN RAISE; END IF;END;
    v_after1:=fn_get_account_balance(v_account1);v_after2:=fn_get_account_balance(v_account2);
    IF v_after1=v_before1 THEN pass('14 failed transfer sender unchanged'); ELSE fail('14 failed transfer sender unchanged','sender changed'); END IF;
    IF v_after2=v_before2 THEN pass('15 failed transfer receiver unchanged'); ELSE fail('15 failed transfer receiver unchanged','receiver changed'); END IF;
  EXCEPTION WHEN OTHERS THEN unexpected('14-15 failed transfer balances'); END;

  -- 16 Debit, credit, and transfer link creation
  BEGIN SAVEPOINT t16;pkg_banking_operations.transfer_funds(v_account1,v_account2,50,NULL,NULL,v_reference);
    SELECT COUNT(*) INTO v_count FROM transactions WHERE reference_no IN(v_reference||'-D',v_reference||'-C');
    IF v_count=2 THEN SELECT COUNT(*) INTO v_count FROM fund_transfers WHERE transfer_reference=v_reference;END IF;
    IF v_count=1 THEN pass('16 paired transfer ledger creation'); ELSE fail('16 paired transfer ledger creation','expected rows missing'); END IF;ROLLBACK TO t16;
  EXCEPTION WHEN OTHERS THEN unexpected('16 paired transfer ledger creation');ROLLBACK TO t16; END;

  -- 17 Zero-interest EMI
  BEGIN IF fn_calculate_emi(12000,0,12)=1000 THEN pass('17 zero-interest EMI'); ELSE fail('17 zero-interest EMI','incorrect result'); END IF;
  EXCEPTION WHEN OTHERS THEN unexpected('17 zero-interest EMI'); END;

  -- 18-20 loan application limits and valid application
  DECLARE v_min NUMBER;v_max NUMBER;v_term NUMBER; BEGIN SELECT min_amount,max_amount,min_term_months INTO v_min,v_max,v_term FROM loan_types WHERE loan_type_id=v_loan_type;
    BEGIN pkg_loan_operations.apply_for_loan(v_customer1,v_loan_type,v_account1_id,v_min-1,v_term,v_loan_number);fail('18 loan below minimum','accepted');EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20101 THEN pass('18 loan below minimum');ELSE unexpected('18 loan below minimum');END IF;END;
    BEGIN pkg_loan_operations.apply_for_loan(v_customer1,v_loan_type,v_account1_id,v_max+1,v_term,v_loan_number);fail('19 loan above maximum','accepted');EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20101 THEN pass('19 loan above maximum');ELSE unexpected('19 loan above maximum');END IF;END;
    BEGIN SAVEPOINT t20;pkg_loan_operations.apply_for_loan(v_customer1,v_loan_type,v_account1_id,v_min,v_term,v_loan_number);SELECT loan_id INTO v_loan FROM loans WHERE loan_number=v_loan_number;pass('20 valid loan application');ROLLBACK TO t20;EXCEPTION WHEN OTHERS THEN unexpected('20 valid loan application');ROLLBACK TO t20;END;
  END;

  -- 21-22 valid and duplicate approval
  DECLARE v_min NUMBER;v_term NUMBER; BEGIN SELECT min_amount,min_term_months INTO v_min,v_term FROM loan_types WHERE loan_type_id=v_loan_type;SAVEPOINT t21;pkg_loan_operations.apply_for_loan(v_customer1,v_loan_type,v_account1_id,v_min,v_term,v_loan_number);SELECT loan_id INTO v_loan FROM loans WHERE loan_number=v_loan_number;pkg_loan_operations.approve_loan(v_loan,v_min,v_manager,NULL,v_reference);SELECT COUNT(*) INTO v_count FROM loans WHERE loan_id=v_loan AND status='ACTIVE';IF v_count=1 THEN pass('21 valid loan approval');ELSE fail('21 valid loan approval','loan not active');END IF;
    BEGIN pkg_loan_operations.approve_loan(v_loan,v_min,v_manager,NULL,v_reference);fail('22 duplicate loan approval','accepted');EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20103 THEN pass('22 duplicate loan approval');ELSE unexpected('22 duplicate loan approval');END IF;END;ROLLBACK TO t21;
  EXCEPTION WHEN OTHERS THEN unexpected('21 valid loan approval');ROLLBACK TO t21;END;

  -- 23-24 rejection rules
  DECLARE v_min NUMBER;v_term NUMBER; BEGIN SELECT min_amount,min_term_months INTO v_min,v_term FROM loan_types WHERE loan_type_id=v_loan_type;SAVEPOINT t23;pkg_loan_operations.apply_for_loan(v_customer1,v_loan_type,v_account1_id,v_min,v_term,v_loan_number);SELECT loan_id INTO v_loan FROM loans WHERE loan_number=v_loan_number;
    BEGIN pkg_loan_operations.reject_loan(v_loan,NULL,v_manager);fail('23 rejection without reason','accepted');EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20106 THEN pass('23 rejection without reason');ELSE unexpected('23 rejection without reason');END IF;END;
    pkg_loan_operations.reject_loan(v_loan,'Criteria not met',v_manager);SELECT COUNT(*) INTO v_count FROM loans WHERE loan_id=v_loan AND status='REJECTED';IF v_count=1 THEN pass('24 valid loan rejection');ELSE fail('24 valid loan rejection','status mismatch');END IF;ROLLBACK TO t23;
  EXCEPTION WHEN OTHERS THEN unexpected('24 valid loan rejection');ROLLBACK TO t23;END;

  -- Create an active loan for payment tests 25-28 and ownership test 33.
  DECLARE v_min NUMBER;v_term NUMBER; BEGIN SELECT min_amount,min_term_months INTO v_min,v_term FROM loan_types WHERE loan_type_id=v_loan_type;pkg_loan_operations.apply_for_loan(v_customer1,v_loan_type,v_account1_id,v_min,v_term,v_loan_number);SELECT loan_id INTO v_loan FROM loans WHERE loan_number=v_loan_number;pkg_loan_operations.approve_loan(v_loan,v_min,v_manager,NULL,v_reference);SELECT outstanding_balance INTO v_outstanding FROM loans WHERE loan_id=v_loan;END;

  -- 25 valid payment
  BEGIN SAVEPOINT t25;v_before1:=fn_get_account_balance(v_account1);pkg_loan_operations.record_payment(v_loan,v_account1,10,NULL,v_reference);SELECT outstanding_balance INTO v_after1 FROM loans WHERE loan_id=v_loan;IF v_after1=v_outstanding-10 AND fn_get_account_balance(v_account1)=v_before1-10 THEN pass('25 valid loan payment');ELSE fail('25 valid loan payment','balances mismatch');END IF;ROLLBACK TO t25;EXCEPTION WHEN OTHERS THEN unexpected('25 valid loan payment');ROLLBACK TO t25;END;
  -- 26 negative payment
  BEGIN pkg_loan_operations.record_payment(v_loan,v_account1,-1,NULL,v_reference);fail('26 negative loan payment','accepted');EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20109 THEN pass('26 negative loan payment');ELSE unexpected('26 negative loan payment');END IF;END;
  -- 27 overpayment
  BEGIN pkg_loan_operations.record_payment(v_loan,v_account1,v_outstanding+1,NULL,v_reference);fail('27 loan overpayment','accepted');EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20111 THEN pass('27 loan overpayment');ELSE unexpected('27 loan overpayment');END IF;END;
  -- 28 completion
  BEGIN SAVEPOINT t28;pkg_banking_operations.deposit(v_account1,v_outstanding,NULL,v_reference);pkg_loan_operations.record_payment(v_loan,v_account1,v_outstanding,NULL,v_reference);SELECT COUNT(*) INTO v_count FROM loans WHERE loan_id=v_loan AND status='COMPLETED' AND outstanding_balance=0;IF v_count=1 THEN pass('28 loan completion');ELSE fail('28 loan completion','loan not completed');END IF;ROLLBACK TO t28;EXCEPTION WHEN OTHERS THEN unexpected('28 loan completion');ROLLBACK TO t28;END;

  -- 29 customer update audit
  BEGIN SAVEPOINT t29;SELECT COUNT(*) INTO v_count FROM audit_log WHERE table_name='CUSTOMERS' AND record_id=v_customer1;UPDATE customers SET phone='01999000111' WHERE customer_id=v_customer1;SELECT COUNT(*)-v_count INTO v_after1 FROM audit_log WHERE table_name='CUSTOMERS' AND record_id=v_customer1;IF v_after1=1 THEN pass('29 customer update audit');ELSE fail('29 customer update audit','audit row missing');END IF;ROLLBACK TO t29;EXCEPTION WHEN OTHERS THEN unexpected('29 customer update audit');ROLLBACK TO t29;END;
  -- 30 account status audit
  BEGIN SAVEPOINT t30;SELECT COUNT(*) INTO v_count FROM audit_log WHERE table_name='ACCOUNTS' AND record_id=v_account1_id;UPDATE accounts SET status='FROZEN' WHERE account_id=v_account1_id;SELECT COUNT(*)-v_count INTO v_after1 FROM audit_log WHERE table_name='ACCOUNTS' AND record_id=v_account1_id;IF v_after1=1 THEN pass('30 account status audit');ELSE fail('30 account status audit','audit row missing');END IF;ROLLBACK TO t30;EXCEPTION WHEN OTHERS THEN unexpected('30 account status audit');ROLLBACK TO t30;END;
  -- 31 loan status audit
  BEGIN SAVEPOINT t31;SELECT COUNT(*) INTO v_count FROM audit_log WHERE table_name='LOANS' AND record_id=v_loan;UPDATE loans SET status='COMPLETED',outstanding_balance=0 WHERE loan_id=v_loan;SELECT COUNT(*)-v_count INTO v_after1 FROM audit_log WHERE table_name='LOANS' AND record_id=v_loan;IF v_after1=1 THEN pass('31 loan status audit');ELSE fail('31 loan status audit','audit row missing');END IF;ROLLBACK TO t31;EXCEPTION WHEN OTHERS THEN unexpected('31 loan status audit');ROLLBACK TO t31;END;
  -- 32 immutable transaction history update and delete
  BEGIN SELECT transaction_id INTO v_count FROM transactions FETCH FIRST 1 ROW ONLY;BEGIN UPDATE transactions SET description='forbidden' WHERE transaction_id=v_count;fail('32a transaction update protection','accepted');EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20200 THEN pass('32a transaction update protection');ELSE unexpected('32a transaction update protection');END IF;END;BEGIN DELETE FROM transactions WHERE transaction_id=v_count;fail('32b transaction delete protection','accepted');EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20200 THEN pass('32b transaction delete protection');ELSE unexpected('32b transaction delete protection');END IF;END;EXCEPTION WHEN OTHERS THEN unexpected('32 transaction protection setup');END;
  -- 33 payment account ownership
  BEGIN pkg_loan_operations.record_payment(v_loan,v_account2,10,NULL,v_reference);fail('33 loan payment account ownership','accepted');EXCEPTION WHEN OTHERS THEN IF SQLCODE=-20115 THEN pass('33 loan payment account ownership');ELSE unexpected('33 loan payment account ownership');END IF;END;

  ROLLBACK TO acceptance_suite;
  DBMS_OUTPUT.PUT_LINE('========================================');
  DBMS_OUTPUT.PUT_LINE('TOTAL TESTS : '||v_total);
  DBMS_OUTPUT.PUT_LINE('PASSED      : '||v_passed);
  DBMS_OUTPUT.PUT_LINE('FAILED      : '||v_failed);
  IF v_failed=0 THEN DBMS_OUTPUT.PUT_LINE('FINAL RESULT: PASS'); ELSE DBMS_OUTPUT.PUT_LINE('FINAL RESULT: FAIL');RAISE_APPLICATION_ERROR(-20999,v_failed||' acceptance test(s) failed');END IF;
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK TO acceptance_suite;
    DBMS_OUTPUT.PUT_LINE('SUITE ABORTED: '||SQLCODE||' '||SQLERRM);
    RAISE;
END;
/
