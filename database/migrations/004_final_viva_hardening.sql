-- Non-destructive Final Viva Hardening upgrade.
-- Adds stable staff IDs and case-insensitive lookup without changing passwords or ledger rows.
SET SERVEROUTPUT ON
DECLARE
  PROCEDURE ignore_expected(p_sql VARCHAR2) IS
  BEGIN
    EXECUTE IMMEDIATE p_sql;
  EXCEPTION WHEN OTHERS THEN
    IF SQLCODE NOT IN (-955, -1430, -2260, -2275, -1408) THEN RAISE; END IF;
  END;
BEGIN
  ignore_expected('ALTER TABLE loan_types ADD (short_description VARCHAR2(200))');
  ignore_expected('ALTER TABLE loan_types ADD (detailed_description VARCHAR2(1000))');
  ignore_expected('ALTER TABLE loan_types ADD (minimum_annual_income NUMBER(15,2))');
  ignore_expected('ALTER TABLE loan_types ADD (processing_fee_percentage NUMBER(5,2) DEFAULT 0 NOT NULL)');
  ignore_expected('ALTER TABLE loan_types ADD (eligibility_summary VARCHAR2(500))');
  ignore_expected('ALTER TABLE loan_types ADD (required_document_summary VARCHAR2(500))');
  ignore_expected('ALTER TABLE loan_types ADD (interest_method VARCHAR2(20) DEFAULT ''REDUCING_BALANCE'' NOT NULL)');
  ignore_expected('ALTER TABLE loan_types ADD CONSTRAINT ck_loan_type_income CHECK (minimum_annual_income IS NULL OR minimum_annual_income >= 0)');
  ignore_expected('ALTER TABLE loan_types ADD CONSTRAINT ck_loan_type_fee CHECK (processing_fee_percentage BETWEEN 0 AND 100)');
  ignore_expected('ALTER TABLE loan_types ADD CONSTRAINT ck_loan_type_method CHECK (interest_method IN (''REDUCING_BALANCE'',''FLAT_RATE''))');
  ignore_expected('ALTER TABLE users ADD (staff_code VARCHAR2(20))');
  UPDATE users u
     SET staff_code = CASE
       WHEN u.role='ADMIN' THEN 'A-ID-'||LPAD(u.user_id,3,'0')
       ELSE (SELECT e.employee_code FROM employees e WHERE e.employee_id=u.employee_id)
     END
   WHERE u.staff_code IS NULL AND u.role <> 'CUSTOMER';
  ignore_expected('ALTER TABLE users DROP CONSTRAINT ck_user_principal');
  ignore_expected('ALTER TABLE users ADD CONSTRAINT ck_user_principal CHECK ((role = ''CUSTOMER'' AND customer_id IS NOT NULL AND employee_id IS NULL AND staff_code IS NULL) OR (role IN (''MANAGER'',''EMPLOYEE'') AND employee_id IS NOT NULL AND customer_id IS NULL AND staff_code IS NOT NULL) OR (role = ''ADMIN'' AND customer_id IS NULL AND employee_id IS NULL AND staff_code IS NOT NULL))');
  ignore_expected('ALTER TABLE users ADD CONSTRAINT uk_users_staff_code UNIQUE(staff_code)');
  ignore_expected('CREATE UNIQUE INDEX uk_users_staff_code_lower ON users(LOWER(staff_code))');
  ignore_expected('CREATE INDEX idx_users_staff_code_lower ON users(LOWER(staff_code))');
  COMMIT;
  DBMS_OUTPUT.PUT_LINE('Final Viva Hardening staff identity upgrade complete.');
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
SELECT name,type,line,position,text FROM user_errors ORDER BY name,sequence;
