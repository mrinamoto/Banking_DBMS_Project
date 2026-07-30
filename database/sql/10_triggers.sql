CREATE OR REPLACE FUNCTION fn_audit_actor RETURN VARCHAR2 IS
BEGIN
  RETURN COALESCE(
    SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER'),
    SYS_CONTEXT('USERENV', 'SESSION_USER')
  );
END;
/

CREATE OR REPLACE TRIGGER trg_audit_customer_update
AFTER UPDATE ON customers
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,record_id,action_name,action_by,old_summary,new_summary)
  VALUES(
    'CUSTOMERS', :NEW.customer_id, 'UPDATE', fn_audit_actor(),
    'status='||:OLD.status||';phone='||:OLD.phone,
    'status='||:NEW.status||';phone='||:NEW.phone
  );
END;
/

CREATE OR REPLACE TRIGGER trg_audit_account_status
AFTER UPDATE OF status ON accounts
FOR EACH ROW
WHEN (OLD.status <> NEW.status)
BEGIN
  INSERT INTO audit_log(table_name,record_id,action_name,action_by,old_summary,new_summary)
  VALUES('ACCOUNTS',:NEW.account_id,'STATUS_CHANGE',fn_audit_actor(),'status='||:OLD.status,'status='||:NEW.status);
END;
/

CREATE OR REPLACE TRIGGER trg_audit_loan_status
AFTER UPDATE OF status ON loans
FOR EACH ROW
WHEN (OLD.status <> NEW.status)
BEGIN
  INSERT INTO audit_log(table_name,record_id,action_name,action_by,old_summary,new_summary)
  VALUES('LOANS',:NEW.loan_id,'STATUS_CHANGE',fn_audit_actor(),'status='||:OLD.status,'status='||:NEW.status);
END;
/

CREATE OR REPLACE TRIGGER trg_protect_financial_history
BEFORE UPDATE OR DELETE ON transactions
BEGIN
  RAISE_APPLICATION_ERROR(-20200,'Financial transaction history cannot be updated or deleted. Use a controlled reversal entry.');
END;
/

CREATE OR REPLACE TRIGGER trg_validate_user_staff_code
BEFORE INSERT OR UPDATE OF employee_id, staff_code, role ON users
FOR EACH ROW
DECLARE
  v_employee_code employees.employee_code%TYPE;
BEGIN
  IF :NEW.role IN ('MANAGER', 'EMPLOYEE') THEN
    SELECT employee_code INTO v_employee_code FROM employees WHERE employee_id = :NEW.employee_id;
    IF UPPER(TRIM(:NEW.staff_code)) <> UPPER(TRIM(v_employee_code)) THEN
      RAISE_APPLICATION_ERROR(-20310, 'Staff code must match the linked employee code.');
    END IF;
  ELSIF :NEW.role = 'CUSTOMER' AND :NEW.staff_code IS NOT NULL THEN
    RAISE_APPLICATION_ERROR(-20311, 'Customer users cannot have a staff code.');
  END IF;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE_APPLICATION_ERROR(-20312, 'Staff users must link to an existing employee.');
END;
/
