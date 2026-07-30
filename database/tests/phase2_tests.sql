-- Read-only Phase 2 object checks. Run after the Phase 2 migration.
SET SERVEROUTPUT ON
DECLARE
  v_count NUMBER;
  PROCEDURE require_table(p_name VARCHAR2) IS
  BEGIN
    SELECT COUNT(*) INTO v_count FROM user_tables WHERE table_name=UPPER(p_name);
    IF v_count=1 THEN DBMS_OUTPUT.PUT_LINE('PASS table '||p_name); ELSE RAISE_APPLICATION_ERROR(-20820,'Missing table '||p_name); END IF;
  END;
BEGIN
  require_table('TRANSACTION_REVERSALS'); require_table('USER_PREFERENCES'); require_table('BENEFICIARIES'); require_table('CUSTOMER_KYC');
  SELECT COUNT(*) INTO v_count FROM user_constraints WHERE table_name='TRANSACTIONS' AND constraint_name='CK_TRANSACTION_TYPE';
  IF v_count=1 THEN DBMS_OUTPUT.PUT_LINE('PASS reversal transaction types constraint'); ELSE RAISE_APPLICATION_ERROR(-20821,'Transaction type constraint missing'); END IF;
  SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name IN ('UK_BENEFICIARY_ACTIVE','IDX_KYC_CUSTOMER_STATUS','IDX_REVERSAL_ORIGINAL');
  IF v_count=3 THEN DBMS_OUTPUT.PUT_LINE('PASS Phase 2 indexes'); ELSE RAISE_APPLICATION_ERROR(-20822,'Phase 2 indexes missing'); END IF;
  SELECT COUNT(*) INTO v_count FROM user_objects WHERE object_name='PKG_BANKING_OPERATIONS' AND object_type='PACKAGE' AND status='VALID';
  IF v_count=1 THEN DBMS_OUTPUT.PUT_LINE('PASS banking package specification valid'); ELSE DBMS_OUTPUT.PUT_LINE('WARN banking package must be checked in USER_ERRORS'); END IF;
  DBMS_OUTPUT.PUT_LINE('Phase 2 schema checks completed. No data was changed.');
END;
/
SELECT object_name,object_type,status FROM user_objects WHERE status <> 'VALID' ORDER BY object_type,object_name;
SELECT name,type,line,position,text FROM user_errors ORDER BY name,sequence;
