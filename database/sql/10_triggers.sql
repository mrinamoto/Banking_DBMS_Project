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
