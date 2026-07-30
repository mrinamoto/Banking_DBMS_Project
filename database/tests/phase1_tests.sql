-- Read-only Phase 1 schema checks. Run after run_all.sql or the migration.
SET SERVEROUTPUT ON
DECLARE
  v_count NUMBER;
  PROCEDURE check_column(p_table VARCHAR2, p_column VARCHAR2) IS
  BEGIN
    SELECT COUNT(*) INTO v_count FROM user_tab_columns WHERE table_name=UPPER(p_table) AND column_name=UPPER(p_column);
    IF v_count=1 THEN DBMS_OUTPUT.PUT_LINE('PASS column '||p_table||'.'||p_column); ELSE RAISE_APPLICATION_ERROR(-20801,'Missing column '||p_table||'.'||p_column); END IF;
  END;
BEGIN
  check_column('USERS','MUST_CHANGE_PASSWORD');
  check_column('USERS','ACCOUNT_LOCKED');
  check_column('USERS','LOCKED_AT');
  check_column('USERS','PASSWORD_CHANGED_AT');
  check_column('USERS','UPDATED_AT');
  check_column('LOGIN_HISTORY','LOGIN_HISTORY_ID');
  check_column('LOGIN_HISTORY','SUCCESS_FLAG');
  SELECT COUNT(*) INTO v_count FROM user_constraints WHERE table_name='USERS' AND constraint_type='U' AND constraint_name='UK_USER_EMPLOYEE';
  IF v_count=1 THEN DBMS_OUTPUT.PUT_LINE('PASS one employee login constraint'); ELSE RAISE_APPLICATION_ERROR(-20802,'UK_USER_EMPLOYEE missing'); END IF;
  SELECT COUNT(*) INTO v_count FROM user_constraints WHERE table_name='USERS' AND constraint_type='U' AND constraint_name='UK_USERS_USERNAME';
  IF v_count=1 THEN DBMS_OUTPUT.PUT_LINE('PASS duplicate username constraint'); ELSE RAISE_APPLICATION_ERROR(-20804,'UK_USERS_USERNAME missing'); END IF;
  SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name IN ('IDX_USERS_USERNAME_LOWER','IDX_USERS_ROLE_ACTIVE','IDX_LOGIN_HISTORY_USER_DATE');
  IF v_count=3 THEN DBMS_OUTPUT.PUT_LINE('PASS Phase 1 indexes'); ELSE RAISE_APPLICATION_ERROR(-20803,'Phase 1 indexes missing'); END IF;
  DBMS_OUTPUT.PUT_LINE('Phase 1 schema checks passed. No data was changed.');
END;
/
SELECT object_name,object_type,status FROM user_objects WHERE status <> 'VALID' ORDER BY object_type,object_name;
SELECT name,type,line,position,text FROM user_errors ORDER BY name,sequence;
