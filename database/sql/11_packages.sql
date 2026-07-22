CREATE OR REPLACE PACKAGE pkg_banking_operations AS
  PROCEDURE open_account(p_customer_id NUMBER, p_branch_id NUMBER, p_account_type_id NUMBER, p_initial_deposit NUMBER, p_processed_by NUMBER, p_account_number OUT VARCHAR2);
  PROCEDURE deposit(p_account_number VARCHAR2, p_amount NUMBER, p_processed_by NUMBER, p_reference OUT VARCHAR2);
  PROCEDURE withdraw(p_account_number VARCHAR2, p_amount NUMBER, p_processed_by NUMBER, p_reference OUT VARCHAR2);
  PROCEDURE transfer_funds(p_from_account VARCHAR2, p_to_account VARCHAR2, p_amount NUMBER, p_processed_by NUMBER, p_owner_customer_id NUMBER, p_reference OUT VARCHAR2);
  PROCEDURE change_status(p_account_id NUMBER, p_status VARCHAR2);
  FUNCTION get_available_balance(p_account_number VARCHAR2) RETURN NUMBER;
END pkg_banking_operations;
/

CREATE OR REPLACE PACKAGE BODY pkg_banking_operations AS
  FUNCTION reference(p_prefix VARCHAR2) RETURN VARCHAR2 IS
  BEGIN RETURN p_prefix || TO_CHAR(SYSTIMESTAMP,'YYYYMMDDHH24MISSFF3') || LPAD(seq_business_reference.NEXTVAL,6,'0'); END;

  PROCEDURE assert_amount(p_amount NUMBER) IS
  BEGIN IF p_amount IS NULL OR p_amount <= 0 THEN RAISE_APPLICATION_ERROR(-20010,'Amount must be greater than zero.'); END IF; END;

  PROCEDURE open_account(p_customer_id NUMBER, p_branch_id NUMBER, p_account_type_id NUMBER, p_initial_deposit NUMBER, p_processed_by NUMBER, p_account_number OUT VARCHAR2) IS
    v_min NUMBER(15,2); v_customer NUMBER; v_branch NUMBER; v_type NUMBER; v_account_id NUMBER;
  BEGIN
    SELECT COUNT(*) INTO v_customer FROM customers WHERE customer_id=p_customer_id AND status='ACTIVE';
    SELECT COUNT(*) INTO v_branch FROM branches WHERE branch_id=p_branch_id AND status='ACTIVE';
    SELECT COUNT(*), MAX(min_balance) INTO v_type,v_min FROM account_types WHERE account_type_id=p_account_type_id AND status='ACTIVE';
    IF v_customer=0 THEN RAISE_APPLICATION_ERROR(-20011,'Active customer not found.'); END IF;
    IF v_branch=0 THEN RAISE_APPLICATION_ERROR(-20012,'Active branch not found.'); END IF;
    IF v_type=0 THEN RAISE_APPLICATION_ERROR(-20013,'Active account type not found.'); END IF;
    IF NVL(p_initial_deposit,0) < v_min THEN RAISE_APPLICATION_ERROR(-20014,'Initial deposit is below the minimum balance.'); END IF;
    p_account_number := fn_generate_account_number();
    INSERT INTO accounts(account_number,customer_id,branch_id,account_type_id,balance) VALUES(p_account_number,p_customer_id,p_branch_id,p_account_type_id,NVL(p_initial_deposit,0)) RETURNING account_id INTO v_account_id;
    IF NVL(p_initial_deposit,0)>0 THEN
      INSERT INTO transactions(account_id,transaction_type,amount,previous_balance,new_balance,reference_no,description,processed_by)
      VALUES(v_account_id, 'DEPOSIT', p_initial_deposit, 0, p_initial_deposit, reference('DEP'),'Initial deposit',p_processed_by);
    END IF;
  END;

  PROCEDURE deposit(p_account_number VARCHAR2, p_amount NUMBER, p_processed_by NUMBER, p_reference OUT VARCHAR2) IS
    v_id NUMBER; v_old NUMBER(15,2); v_status VARCHAR2(12);
  BEGIN
    SAVEPOINT deposit_start;
    assert_amount(p_amount);
    SELECT account_id,balance,status INTO v_id,v_old,v_status FROM accounts WHERE account_number=p_account_number FOR UPDATE;
    IF v_status <> 'ACTIVE' THEN RAISE_APPLICATION_ERROR(-20015,'Account is not active.'); END IF;
    p_reference:=reference('DEP');
    UPDATE accounts SET balance=v_old+p_amount,last_transaction_date=SYSTIMESTAMP WHERE account_id=v_id;
    INSERT INTO transactions(account_id,transaction_type,amount,previous_balance,new_balance,reference_no,description,processed_by)
    VALUES(v_id,'DEPOSIT',p_amount,v_old,v_old+p_amount,p_reference,'Cash deposit',p_processed_by);
  EXCEPTION WHEN NO_DATA_FOUND THEN ROLLBACK TO deposit_start; RAISE_APPLICATION_ERROR(-20016,'Account not found.'); WHEN OTHERS THEN ROLLBACK TO deposit_start; RAISE;
  END;

  PROCEDURE withdraw(p_account_number VARCHAR2, p_amount NUMBER, p_processed_by NUMBER, p_reference OUT VARCHAR2) IS
    v_id NUMBER; v_old NUMBER(15,2); v_min NUMBER(15,2); v_status VARCHAR2(12);
  BEGIN
    SAVEPOINT withdrawal_start;
    assert_amount(p_amount);
    SELECT a.account_id,a.balance,a.status,t.min_balance INTO v_id,v_old,v_status,v_min FROM accounts a JOIN account_types t ON t.account_type_id=a.account_type_id WHERE a.account_number=p_account_number FOR UPDATE OF a.balance;
    IF v_status <> 'ACTIVE' THEN RAISE_APPLICATION_ERROR(-20017,'Account is not active.'); END IF;
    IF v_old-p_amount < v_min THEN RAISE_APPLICATION_ERROR(-20018,'Insufficient available balance after minimum balance.'); END IF;
    p_reference:=reference('WDL'); UPDATE accounts SET balance=v_old-p_amount,last_transaction_date=SYSTIMESTAMP WHERE account_id=v_id;
    INSERT INTO transactions(account_id,transaction_type,amount,previous_balance,new_balance,reference_no,description,processed_by)
    VALUES(v_id,'WITHDRAWAL',p_amount,v_old,v_old-p_amount,p_reference,'Cash withdrawal',p_processed_by);
  EXCEPTION WHEN NO_DATA_FOUND THEN ROLLBACK TO withdrawal_start; RAISE_APPLICATION_ERROR(-20019,'Account not found.'); WHEN OTHERS THEN ROLLBACK TO withdrawal_start; RAISE;
  END;

  PROCEDURE transfer_funds(p_from_account VARCHAR2, p_to_account VARCHAR2, p_amount NUMBER, p_processed_by NUMBER, p_owner_customer_id NUMBER, p_reference OUT VARCHAR2) IS
    v_from_id NUMBER; v_to_id NUMBER; v_from_old NUMBER(15,2); v_to_old NUMBER(15,2); v_min NUMBER(15,2); v_from_status VARCHAR2(12); v_to_status VARCHAR2(12); v_owner NUMBER; v_debit NUMBER; v_credit NUMBER;
  BEGIN
    SAVEPOINT transfer_start;
    assert_amount(p_amount);
    IF p_from_account=p_to_account THEN RAISE_APPLICATION_ERROR(-20020,'Source and destination must differ.'); END IF;
    -- Lock in account-id order to reduce deadlock risk between concurrent transfers.
    SELECT account_id INTO v_from_id FROM accounts WHERE account_number=p_from_account;
    SELECT account_id INTO v_to_id FROM accounts WHERE account_number=p_to_account;
    FOR r IN (SELECT account_id FROM accounts WHERE account_id IN(v_from_id,v_to_id) ORDER BY account_id FOR UPDATE) LOOP NULL; END LOOP;
    SELECT a.balance,a.status,a.customer_id,t.min_balance INTO v_from_old,v_from_status,v_owner,v_min FROM accounts a JOIN account_types t ON t.account_type_id=a.account_type_id WHERE a.account_id=v_from_id;
    SELECT balance,status INTO v_to_old,v_to_status FROM accounts WHERE account_id=v_to_id;
    IF v_from_status<>'ACTIVE' OR v_to_status<>'ACTIVE' THEN RAISE_APPLICATION_ERROR(-20021,'Both accounts must be active.'); END IF;
    IF p_owner_customer_id IS NOT NULL AND v_owner<>p_owner_customer_id THEN RAISE_APPLICATION_ERROR(-20022,'Source account is not owned by this customer.'); END IF;
    IF v_from_old-p_amount<v_min THEN RAISE_APPLICATION_ERROR(-20023,'Insufficient available balance after minimum balance.'); END IF;
    p_reference:=reference('TRF');
    UPDATE accounts SET balance=v_from_old-p_amount,last_transaction_date=SYSTIMESTAMP WHERE account_id=v_from_id;
    UPDATE accounts SET balance=v_to_old+p_amount,last_transaction_date=SYSTIMESTAMP WHERE account_id=v_to_id;
    INSERT INTO transactions(account_id,related_account_id,transaction_type,amount,previous_balance,new_balance,reference_no,description,processed_by)
    VALUES(v_from_id,v_to_id,'TRANSFER_DEBIT',p_amount,v_from_old,v_from_old-p_amount,p_reference||'-D','Fund transfer debit',p_processed_by) RETURNING transaction_id INTO v_debit;
    INSERT INTO transactions(account_id,related_account_id,transaction_type,amount,previous_balance,new_balance,reference_no,description,processed_by)
    VALUES(v_to_id,v_from_id,'TRANSFER_CREDIT',p_amount,v_to_old,v_to_old+p_amount,p_reference||'-C','Fund transfer credit',p_processed_by) RETURNING transaction_id INTO v_credit;
    INSERT INTO fund_transfers(transfer_reference,from_account_id,to_account_id,amount,debit_transaction_id,credit_transaction_id,initiated_by)
    VALUES(p_reference,v_from_id,v_to_id,p_amount,v_debit,v_credit,p_processed_by);
  EXCEPTION WHEN NO_DATA_FOUND THEN ROLLBACK TO transfer_start; RAISE_APPLICATION_ERROR(-20024,'One or both accounts were not found.'); WHEN OTHERS THEN ROLLBACK TO transfer_start; RAISE;
  END;

  PROCEDURE change_status(p_account_id NUMBER,p_status VARCHAR2) IS v_balance NUMBER;
  BEGIN
    IF p_status NOT IN ('ACTIVE','FROZEN','CLOSED') THEN RAISE_APPLICATION_ERROR(-20025,'Invalid account status.'); END IF;
    SELECT balance INTO v_balance FROM accounts WHERE account_id=p_account_id FOR UPDATE;
    IF p_status='CLOSED' AND v_balance<>0 THEN RAISE_APPLICATION_ERROR(-20026,'A non-zero account cannot be closed.'); END IF;
    UPDATE accounts SET status=p_status,close_date=CASE WHEN p_status='CLOSED' THEN SYSDATE ELSE NULL END WHERE account_id=p_account_id;
  EXCEPTION WHEN NO_DATA_FOUND THEN RAISE_APPLICATION_ERROR(-20027,'Account not found.'); END;

  FUNCTION get_available_balance(p_account_number VARCHAR2) RETURN NUMBER IS v_balance NUMBER; v_min NUMBER;
  BEGIN SELECT a.balance,t.min_balance INTO v_balance,v_min FROM accounts a JOIN account_types t ON t.account_type_id=a.account_type_id WHERE a.account_number=p_account_number AND a.status='ACTIVE'; RETURN GREATEST(v_balance-v_min,0);
  EXCEPTION WHEN NO_DATA_FOUND THEN RAISE_APPLICATION_ERROR(-20028,'Active account not found.'); END;
END pkg_banking_operations;
/

CREATE OR REPLACE PACKAGE pkg_loan_operations AS
  PROCEDURE apply_for_loan(p_customer_id NUMBER,p_loan_type_id NUMBER,p_account_id NUMBER,p_amount NUMBER,p_term_months NUMBER,p_loan_number OUT VARCHAR2);
  PROCEDURE approve_loan(p_loan_id NUMBER,p_approved_amount NUMBER,p_reviewer_employee_id NUMBER,p_processed_by NUMBER,p_reference OUT VARCHAR2);
  PROCEDURE reject_loan(p_loan_id NUMBER,p_reason VARCHAR2,p_reviewer_employee_id NUMBER);
  PROCEDURE record_payment(p_loan_id NUMBER,p_account_number VARCHAR2,p_amount NUMBER,p_received_by NUMBER,p_reference OUT VARCHAR2);
  FUNCTION remaining_installments(p_loan_id NUMBER) RETURN NUMBER;
END pkg_loan_operations;
/

CREATE OR REPLACE PACKAGE BODY pkg_loan_operations AS
  PROCEDURE apply_for_loan(p_customer_id NUMBER,p_loan_type_id NUMBER,p_account_id NUMBER,p_amount NUMBER,p_term_months NUMBER,p_loan_number OUT VARCHAR2) IS v_min NUMBER;v_max NUMBER;v_rate NUMBER;v_tmin NUMBER;v_tmax NUMBER;v_owner NUMBER;
  BEGIN SELECT min_amount,max_amount,annual_interest_rate,min_term_months,max_term_months INTO v_min,v_max,v_rate,v_tmin,v_tmax FROM loan_types WHERE loan_type_id=p_loan_type_id AND status='ACTIVE'; SELECT customer_id INTO v_owner FROM accounts WHERE account_id=p_account_id AND status='ACTIVE';
    IF v_owner<>p_customer_id THEN RAISE_APPLICATION_ERROR(-20100,'Disbursement account is not owned by customer.'); END IF;
    IF p_amount NOT BETWEEN v_min AND v_max OR p_term_months NOT BETWEEN v_tmin AND v_tmax THEN RAISE_APPLICATION_ERROR(-20101,'Amount or term is outside loan type limits.'); END IF;
    p_loan_number:=fn_generate_loan_number(); INSERT INTO loans(loan_number,customer_id,loan_type_id,disbursement_account_id,requested_amount,interest_rate,term_months) VALUES(p_loan_number,p_customer_id,p_loan_type_id,p_account_id,p_amount,v_rate,p_term_months);
  EXCEPTION WHEN NO_DATA_FOUND THEN RAISE_APPLICATION_ERROR(-20102,'Loan type or account not found.'); END;
  PROCEDURE approve_loan(p_loan_id NUMBER,p_approved_amount NUMBER,p_reviewer_employee_id NUMBER,p_processed_by NUMBER,p_reference OUT VARCHAR2) IS v_status VARCHAR2(20);v_requested NUMBER;v_account NUMBER;v_old NUMBER;v_emi NUMBER;v_total NUMBER;v_term NUMBER;
  BEGIN SAVEPOINT loan_approval; SELECT status,requested_amount,disbursement_account_id,term_months INTO v_status,v_requested,v_account,v_term FROM loans WHERE loan_id=p_loan_id FOR UPDATE; IF v_status<>'PENDING' THEN RAISE_APPLICATION_ERROR(-20103,'Loan has already been decided.'); END IF; IF p_approved_amount<=0 OR p_approved_amount>v_requested THEN RAISE_APPLICATION_ERROR(-20104,'Approved amount is invalid.'); END IF;
    SELECT balance INTO v_old FROM accounts WHERE account_id=v_account AND status='ACTIVE' FOR UPDATE; SELECT fn_calculate_emi(p_approved_amount,interest_rate,term_months) INTO v_emi FROM loans WHERE loan_id=p_loan_id; v_total:=ROUND(v_emi*v_term,2); p_reference:='LND'||TO_CHAR(SYSTIMESTAMP,'YYYYMMDDHH24MISSFF3')||seq_business_reference.NEXTVAL;
    UPDATE accounts SET balance=v_old+p_approved_amount,last_transaction_date=SYSTIMESTAMP WHERE account_id=v_account;
    INSERT INTO transactions(account_id,transaction_type,amount,previous_balance,new_balance,reference_no,description,processed_by) VALUES(v_account,'LOAN_DISBURSEMENT',p_approved_amount,v_old,v_old+p_approved_amount,p_reference,'Loan disbursement',p_processed_by);
    UPDATE loans SET approved_amount=p_approved_amount,monthly_installment=v_emi,total_repayable=v_total,outstanding_balance=v_total,status='ACTIVE',reviewed_by=p_reviewer_employee_id,reviewed_at=SYSTIMESTAMP,start_date=SYSDATE,end_date=ADD_MONTHS(SYSDATE,term_months) WHERE loan_id=p_loan_id;
  EXCEPTION WHEN NO_DATA_FOUND THEN ROLLBACK TO loan_approval; RAISE_APPLICATION_ERROR(-20105,'Pending loan or active account not found.'); WHEN OTHERS THEN ROLLBACK TO loan_approval; RAISE; END;
  PROCEDURE reject_loan(p_loan_id NUMBER,p_reason VARCHAR2,p_reviewer_employee_id NUMBER) IS v_status VARCHAR2(20); BEGIN IF TRIM(p_reason) IS NULL THEN RAISE_APPLICATION_ERROR(-20106,'Rejection reason is required.'); END IF; SELECT status INTO v_status FROM loans WHERE loan_id=p_loan_id FOR UPDATE; IF v_status<>'PENDING' THEN RAISE_APPLICATION_ERROR(-20107,'Loan has already been decided.'); END IF; UPDATE loans SET status='REJECTED',rejection_reason=TRIM(p_reason),reviewed_by=p_reviewer_employee_id,reviewed_at=SYSTIMESTAMP WHERE loan_id=p_loan_id; EXCEPTION WHEN NO_DATA_FOUND THEN RAISE_APPLICATION_ERROR(-20108,'Loan not found.'); END;
  PROCEDURE record_payment(p_loan_id NUMBER,p_account_number VARCHAR2,p_amount NUMBER,p_received_by NUMBER,p_reference OUT VARCHAR2) IS
    v_out NUMBER;
    v_status VARCHAR2(20);
    v_account NUMBER;
    v_old NUMBER;
    v_tx NUMBER;
    v_new NUMBER;
    v_loan_customer NUMBER;
    v_account_customer NUMBER;
  BEGIN
    SAVEPOINT loan_payment;
    IF p_amount IS NULL OR p_amount<=0 THEN RAISE_APPLICATION_ERROR(-20109,'Payment must be positive.'); END IF;
    SELECT outstanding_balance,status,customer_id
      INTO v_out,v_status,v_loan_customer
      FROM loans WHERE loan_id=p_loan_id FOR UPDATE;
    IF v_status<>'ACTIVE' THEN RAISE_APPLICATION_ERROR(-20110,'Only active loans accept payment.'); END IF;
    IF p_amount>v_out THEN RAISE_APPLICATION_ERROR(-20111,'Payment exceeds outstanding balance.'); END IF;
    SELECT account_id,balance,customer_id
      INTO v_account,v_old,v_account_customer
      FROM accounts WHERE account_number=p_account_number AND status='ACTIVE' FOR UPDATE;
    IF v_account_customer<>v_loan_customer THEN RAISE_APPLICATION_ERROR(-20115,'Payment account does not belong to the loan customer.'); END IF;
    IF p_amount>v_old THEN RAISE_APPLICATION_ERROR(-20112,'Insufficient account balance.'); END IF;
    v_new:=v_out-p_amount;
    p_reference:='LNP'||TO_CHAR(SYSTIMESTAMP,'YYYYMMDDHH24MISSFF3')||seq_business_reference.NEXTVAL;
    UPDATE accounts SET balance=v_old-p_amount,last_transaction_date=SYSTIMESTAMP WHERE account_id=v_account;
    INSERT INTO transactions(account_id,transaction_type,amount,previous_balance,new_balance,reference_no,description,processed_by)
    VALUES(v_account,'LOAN_PAYMENT',p_amount,v_old,v_old-p_amount,p_reference,'Loan payment',p_received_by)
    RETURNING transaction_id INTO v_tx;
    INSERT INTO loan_payments(loan_id,account_id,transaction_id,amount,previous_outstanding,new_outstanding,received_by)
    VALUES(p_loan_id,v_account,v_tx,p_amount,v_out,v_new,p_received_by);
    UPDATE loans SET outstanding_balance=v_new,status=CASE WHEN v_new=0 THEN 'COMPLETED' ELSE 'ACTIVE' END WHERE loan_id=p_loan_id;
  EXCEPTION WHEN NO_DATA_FOUND THEN ROLLBACK TO loan_payment; RAISE_APPLICATION_ERROR(-20113,'Loan or account not found.'); WHEN OTHERS THEN ROLLBACK TO loan_payment; RAISE; END;
  FUNCTION remaining_installments(p_loan_id NUMBER) RETURN NUMBER IS v_out NUMBER;v_emi NUMBER; BEGIN SELECT outstanding_balance,monthly_installment INTO v_out,v_emi FROM loans WHERE loan_id=p_loan_id; RETURN CASE WHEN v_out=0 THEN 0 ELSE CEIL(v_out/v_emi) END; EXCEPTION WHEN NO_DATA_FOUND THEN RAISE_APPLICATION_ERROR(-20114,'Loan not found.'); END;
END pkg_loan_operations;
/
