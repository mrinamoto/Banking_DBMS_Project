SET SERVEROUTPUT ON
DECLARE
  v_account accounts.account_number%TYPE;
  v_reference VARCHAR2(80);
  v_before NUMBER;
BEGIN
  SELECT account_number,balance INTO v_account,v_before FROM accounts WHERE status='ACTIVE' FETCH FIRST 1 ROW ONLY;
  SAVEPOINT procedure_test;
  pr_deposit(v_account,50,NULL,v_reference);
  pr_withdraw(v_account,25,NULL,v_reference);
  IF fn_get_account_balance(v_account)<>v_before+25 THEN RAISE_APPLICATION_ERROR(-20990,'Procedure wrapper result is incorrect'); END IF;
  ROLLBACK TO procedure_test;
  DBMS_OUTPUT.PUT_LINE('PASS: current procedure signatures; test rolled back');
END;
/
