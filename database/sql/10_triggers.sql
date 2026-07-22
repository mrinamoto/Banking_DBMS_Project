CREATE OR REPLACE TRIGGER trg_audit_customer_update AFTER UPDATE ON customers FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,record_id,action_name,old_summary,new_summary)
  VALUES('CUSTOMERS',:NEW.customer_id,'UPDATE','status='||:OLD.status||';phone='||:OLD.phone,'status='||:NEW.status||';phone='||:NEW.phone);
END;
/

CREATE OR REPLACE TRIGGER trg_audit_account_status AFTER UPDATE OF status ON accounts FOR EACH ROW
WHEN (OLD.status <> NEW.status)
BEGIN
  INSERT INTO audit_log(table_name,record_id,action_name,old_summary,new_summary)
  VALUES('ACCOUNTS',:NEW.account_id,'STATUS_CHANGE','status='||:OLD.status,'status='||:NEW.status);
END;
/

CREATE OR REPLACE TRIGGER trg_audit_loan_status AFTER UPDATE OF status ON loans FOR EACH ROW
WHEN (OLD.status <> NEW.status)
BEGIN
  INSERT INTO audit_log(table_name,record_id,action_name,old_summary,new_summary)
  VALUES('LOANS',:NEW.loan_id,'STATUS_CHANGE','status='||:OLD.status,'status='||:NEW.status);
END;
/

CREATE OR REPLACE TRIGGER trg_protect_financial_history BEFORE DELETE ON transactions
BEGIN RAISE_APPLICATION_ERROR(-20200,'Financial transaction history cannot be deleted.'); END;
/
