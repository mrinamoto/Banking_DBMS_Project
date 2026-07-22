SET SERVEROUTPUT ON
DECLARE
  v_account accounts.account_number%TYPE;
  v_customer accounts.customer_id%TYPE;
  v_balance NUMBER;
BEGIN
  SELECT account_number,customer_id INTO v_account,v_customer FROM accounts FETCH FIRST 1 ROW ONLY;
  v_balance:=fn_get_account_balance(v_account);
  IF v_balance<0 THEN RAISE_APPLICATION_ERROR(-20990,'Balance function returned invalid value'); END IF;
  IF fn_total_customer_balance(v_customer)<v_balance THEN RAISE_APPLICATION_ERROR(-20991,'Customer total is below account balance'); END IF;
  IF fn_calculate_emi(12000,0,12)<>1000 THEN RAISE_APPLICATION_ERROR(-20992,'Zero-interest EMI is incorrect'); END IF;
  DBMS_OUTPUT.PUT_LINE('PASS: current balance, customer total, and EMI functions');
END;
/
