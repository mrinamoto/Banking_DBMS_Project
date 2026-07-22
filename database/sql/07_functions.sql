CREATE OR REPLACE FUNCTION fn_get_account_balance(p_account_number IN VARCHAR2) RETURN NUMBER IS
  v_balance accounts.balance%TYPE;
BEGIN
  SELECT balance INTO v_balance FROM accounts WHERE account_number = p_account_number;
  RETURN v_balance;
EXCEPTION WHEN NO_DATA_FOUND THEN RAISE_APPLICATION_ERROR(-20001, 'Account not found.');
END;
/

CREATE OR REPLACE FUNCTION fn_total_customer_balance(p_customer_id IN NUMBER) RETURN NUMBER IS
  v_total NUMBER(15,2);
BEGIN
  SELECT NVL(SUM(balance), 0) INTO v_total FROM accounts WHERE customer_id = p_customer_id AND status <> 'CLOSED';
  RETURN v_total;
END;
/

CREATE OR REPLACE FUNCTION fn_calculate_emi(p_principal IN NUMBER, p_annual_rate IN NUMBER, p_months IN NUMBER) RETURN NUMBER IS
  v_rate NUMBER;
BEGIN
  IF p_principal <= 0 OR p_annual_rate < 0 OR p_months <= 0 THEN RAISE_APPLICATION_ERROR(-20002, 'Invalid EMI inputs.'); END IF;
  IF p_annual_rate = 0 THEN RETURN ROUND(p_principal / p_months, 2); END IF;
  v_rate := p_annual_rate / 1200;
  RETURN ROUND(p_principal * v_rate * POWER(1 + v_rate, p_months) / (POWER(1 + v_rate, p_months) - 1), 2);
END;
/

CREATE OR REPLACE FUNCTION fn_generate_account_number RETURN VARCHAR2 IS
BEGIN
  RETURN '10' || TO_CHAR(SYSDATE, 'YYMMDD') || LPAD(seq_business_reference.NEXTVAL, 8, '0');
END;
/

CREATE OR REPLACE FUNCTION fn_generate_loan_number RETURN VARCHAR2 IS
BEGIN
  RETURN 'LN' || TO_CHAR(SYSDATE, 'YYMMDD') || LPAD(seq_business_reference.NEXTVAL, 8, '0');
END;
/
