-- DANGER: development cleanup only. Never run against a schema containing valuable data.
-- This file is intentionally NOT called by run_all.sql.
BEGIN
  FOR object_name IN (
    SELECT table_name name FROM user_tables WHERE table_name IN
      ('LOAN_PAYMENTS','FUND_TRANSFERS','TRANSACTIONS','LOANS','LOAN_TYPES','ACCOUNTS','USERS','EMPLOYEES','CUSTOMERS','ACCOUNT_TYPES','BRANCHES','AUDIT_LOG')
  ) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || DBMS_ASSERT.SIMPLE_SQL_NAME(object_name.name) || ' CASCADE CONSTRAINTS PURGE';
  END LOOP;
EXCEPTION WHEN OTHERS THEN RAISE;
END;
/
