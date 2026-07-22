SET SERVEROUTPUT ON
DECLARE
  v_account accounts.account_number%TYPE;
  v_reference VARCHAR2(80);
  v_before NUMBER;
BEGIN
  SELECT account_number,balance INTO v_account,v_before FROM accounts WHERE status='ACTIVE' FETCH FIRST 1 ROW ONLY;
  SAVEPOINT package_test;
  pkg_banking_operations.deposit(v_account,100,NULL,v_reference);
  IF fn_get_account_balance(v_account)<>v_before+100 THEN RAISE_APPLICATION_ERROR(-20990,'Package deposit failed'); END IF;
  ROLLBACK TO package_test;
  DBMS_OUTPUT.PUT_LINE('PASS: PKG_BANKING_OPERATIONS deposit; test rolled back');
END;
/
