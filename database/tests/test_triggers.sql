SET SERVEROUTPUT ON
DECLARE
  v_customer NUMBER;
  v_before NUMBER;
BEGIN
  SELECT customer_id INTO v_customer FROM customers FETCH FIRST 1 ROW ONLY;
  SELECT COUNT(*) INTO v_before FROM audit_log WHERE table_name='CUSTOMERS' AND record_id=v_customer;
  SAVEPOINT trigger_test;
  UPDATE customers SET updated_at=SYSTIMESTAMP WHERE customer_id=v_customer;
  DECLARE v_after NUMBER; BEGIN
    SELECT COUNT(*) INTO v_after FROM audit_log WHERE table_name='CUSTOMERS' AND record_id=v_customer;
    IF v_after<>v_before+1 THEN RAISE_APPLICATION_ERROR(-20990,'Customer audit trigger did not create one row'); END IF;
  END;
  ROLLBACK TO trigger_test;
  DBMS_OUTPUT.PUT_LINE('PASS: customer audit trigger; test rolled back');
END;
/
