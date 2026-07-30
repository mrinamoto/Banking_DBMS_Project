-- Read-only Phase 3 object and constraint checks. Run after the Phase 3 upgrade.
SET SERVEROUTPUT ON
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_tables WHERE table_name IN ('DEPOSIT_SCHEMES','DEPOSIT_CERTIFICATES');
  IF v_count <> 2 THEN RAISE_APPLICATION_ERROR(-20931,'Phase 3 deposit tables are missing'); END IF;
  SELECT COUNT(*) INTO v_count FROM user_views WHERE view_name='VW_DEPOSIT_CERTIFICATE_REMINDERS';
  IF v_count <> 1 THEN RAISE_APPLICATION_ERROR(-20932,'Deposit reminder view is missing'); END IF;
  SELECT COUNT(*) INTO v_count FROM user_constraints WHERE constraint_name IN ('CK_DEPOSIT_SCHEME_TYPE','CK_DEPOSIT_SCHEME_METHOD','CK_CERTIFICATE_STATUS');
  IF v_count < 3 THEN RAISE_APPLICATION_ERROR(-20933,'Phase 3 checks are missing'); END IF;
  DBMS_OUTPUT.PUT_LINE('Phase 3 read-only object checks passed.');
END;
/
SELECT name,type,line,position,text FROM user_errors ORDER BY name,sequence;
