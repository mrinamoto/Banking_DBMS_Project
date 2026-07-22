SET SERVEROUTPUT ON
-- Run in a disposable project schema after run_all.sql. Every test block rolls back.
DECLARE v_ref VARCHAR2(80); v_before NUMBER; v_after NUMBER; v_from VARCHAR2(24); v_to VARCHAR2(24);
BEGIN
  SELECT MIN(account_number),MAX(account_number) INTO v_from,v_to FROM accounts;
  SAVEPOINT test_start;
  v_before:=fn_get_account_balance(v_from);
  pkg_banking_operations.deposit(v_from,100,NULL,v_ref);
  v_after:=fn_get_account_balance(v_from);
  IF v_after<>v_before+100 THEN RAISE_APPLICATION_ERROR(-20990,'Deposit assertion failed'); END IF;
  DBMS_OUTPUT.PUT_LINE('PASS DB-TXN-001 valid deposit and ledger reference '||v_ref);
  ROLLBACK TO test_start;
  BEGIN pkg_banking_operations.deposit(v_from,0,NULL,v_ref); DBMS_OUTPUT.PUT_LINE('FAIL DB-TXN-002 zero deposit accepted');
  EXCEPTION WHEN OTHERS THEN DBMS_OUTPUT.PUT_LINE('PASS DB-TXN-002 zero deposit rejected'); END;
  BEGIN pkg_banking_operations.transfer_funds(v_from,v_from,10,NULL,NULL,v_ref); DBMS_OUTPUT.PUT_LINE('FAIL DB-TXN-003 same-account transfer accepted');
  EXCEPTION WHEN OTHERS THEN DBMS_OUTPUT.PUT_LINE('PASS DB-TXN-003 same-account transfer rejected'); END;
  SAVEPOINT transfer_test; v_before:=fn_get_account_balance(v_from);
  BEGIN pkg_banking_operations.transfer_funds(v_from,'NOT-AN-ACCOUNT',10,NULL,NULL,v_ref); EXCEPTION WHEN OTHERS THEN NULL; END;
  v_after:=fn_get_account_balance(v_from);
  IF v_after<>v_before THEN RAISE_APPLICATION_ERROR(-20991,'Transfer rollback assertion failed'); END IF;
  DBMS_OUTPUT.PUT_LINE('PASS DB-TXN-004 failed transfer preserved source balance');
  ROLLBACK TO transfer_test;
END;
/

DECLARE v_value NUMBER;
BEGIN
  v_value:=fn_calculate_emi(12000,0,12);
  IF v_value<>1000 THEN RAISE_APPLICATION_ERROR(-20992,'Zero-rate EMI failed'); END IF;
  DBMS_OUTPUT.PUT_LINE('PASS DB-LOAN-001 zero-interest EMI');
END;
/
