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
  ignore_expected('ALTER TABLE loan_types ADD (short_description VARCHAR2(200), detailed_description VARCHAR2(1000), minimum_annual_income NUMBER(15,2), processing_fee_percentage NUMBER(5,2) DEFAULT 0 NOT NULL, eligibility_summary VARCHAR2(500), required_document_summary VARCHAR2(500), interest_method VARCHAR2(20) DEFAULT ''REDUCING_BALANCE'' NOT NULL)');
  ignore_expected('ALTER TABLE loan_types ADD CONSTRAINT ck_loan_type_income CHECK (minimum_annual_income IS NULL OR minimum_annual_income >= 0)');
  ignore_expected('ALTER TABLE loan_types ADD CONSTRAINT ck_loan_type_fee CHECK (processing_fee_percentage BETWEEN 0 AND 100)');
  ignore_expected('ALTER TABLE loan_types ADD CONSTRAINT ck_loan_type_method CHECK (interest_method IN (''REDUCING_BALANCE'',''FLAT_RATE''))');
  ignore_expected('ALTER TABLE users ADD (staff_code VARCHAR2(20))');
  UPDATE employees SET employee_code='M-ID-001' WHERE employee_code='EMP-001' AND NOT EXISTS (SELECT 1 FROM employees WHERE employee_code='M-ID-001');
  UPDATE employees SET employee_code='E-ID-001' WHERE employee_code='EMP-002' AND NOT EXISTS (SELECT 1 FROM employees WHERE employee_code='E-ID-001');
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
SELECT name,type,line,position,text FROM user_errors ORDER BY name,sequence;
