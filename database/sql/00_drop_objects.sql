-- ============================================================================
-- DEVELOPMENT CLEANUP ONLY.
-- NEVER RUN AGAINST A SCHEMA CONTAINING IMPORTANT DATA.
-- This file is intentionally excluded from database/run_all.sql.
-- ============================================================================
SET SERVEROUTPUT ON

DECLARE
  PROCEDURE drop_if_present(
    p_object_type IN VARCHAR2,
    p_object_name IN VARCHAR2,
    p_suffix      IN VARCHAR2 DEFAULT NULL
  ) IS
  BEGIN
    EXECUTE IMMEDIATE
      'DROP ' || p_object_type || ' ' ||
      DBMS_ASSERT.SIMPLE_SQL_NAME(p_object_name) || NVL(p_suffix, '');
    DBMS_OUTPUT.PUT_LINE('Dropped ' || p_object_type || ' ' || p_object_name);
  EXCEPTION
    WHEN OTHERS THEN
      -- ORA-00942/04043/02289 mean that the requested object does not exist.
      IF SQLCODE NOT IN (-942, -4043, -2289) THEN
        RAISE;
      END IF;
  END drop_if_present;
BEGIN
  -- Standalone objects and packages are removed before their dependent tables.
  drop_if_present('VIEW', 'VW_PENDING_LOAN_APPLICATIONS');
  drop_if_present('VIEW', 'VW_DAILY_TRANSACTION_TOTALS');
  drop_if_present('VIEW', 'VW_LOAN_SUMMARY');
  drop_if_present('VIEW', 'VW_ACCOUNT_TRANSACTION_SUMMARY');
  drop_if_present('VIEW', 'VW_BRANCH_PERFORMANCE');
  drop_if_present('VIEW', 'VW_CUSTOMER_ACCOUNT_SUMMARY');

  drop_if_present('PROCEDURE', 'PR_TRANSFER');
  drop_if_present('PROCEDURE', 'PR_WITHDRAW');
  drop_if_present('PROCEDURE', 'PR_DEPOSIT');
  drop_if_present('PACKAGE', 'PKG_LOAN_OPERATIONS');
  drop_if_present('PACKAGE', 'PKG_BANKING_OPERATIONS');

  drop_if_present('FUNCTION', 'FN_GENERATE_LOAN_NUMBER');
  drop_if_present('FUNCTION', 'FN_AUDIT_ACTOR');
  drop_if_present('FUNCTION', 'FN_GENERATE_ACCOUNT_NUMBER');
  drop_if_present('FUNCTION', 'FN_CALCULATE_EMI');
  drop_if_present('FUNCTION', 'FN_TOTAL_CUSTOMER_BALANCE');
  drop_if_present('FUNCTION', 'FN_GET_ACCOUNT_BALANCE');

  -- Triggers are normally dropped with tables; explicit calls make intent clear.
  drop_if_present('TRIGGER', 'TRG_PROTECT_FINANCIAL_HISTORY');
  drop_if_present('TRIGGER', 'TRG_AUDIT_LOAN_STATUS');
  drop_if_present('TRIGGER', 'TRG_AUDIT_ACCOUNT_STATUS');
  drop_if_present('TRIGGER', 'TRG_AUDIT_CUSTOMER_UPDATE');

  drop_if_present('TABLE', 'LOAN_PAYMENTS', ' CASCADE CONSTRAINTS PURGE');
  drop_if_present('TABLE', 'FUND_TRANSFERS', ' CASCADE CONSTRAINTS PURGE');
  drop_if_present('TABLE', 'TRANSACTIONS', ' CASCADE CONSTRAINTS PURGE');
  drop_if_present('TABLE', 'LOANS', ' CASCADE CONSTRAINTS PURGE');
  drop_if_present('TABLE', 'LOAN_TYPES', ' CASCADE CONSTRAINTS PURGE');
  drop_if_present('TABLE', 'ACCOUNTS', ' CASCADE CONSTRAINTS PURGE');
  drop_if_present('TABLE', 'LOGIN_HISTORY', ' CASCADE CONSTRAINTS PURGE');
  drop_if_present('TABLE', 'USERS', ' CASCADE CONSTRAINTS PURGE');
  drop_if_present('TABLE', 'EMPLOYEES', ' CASCADE CONSTRAINTS PURGE');
  drop_if_present('TABLE', 'CUSTOMERS', ' CASCADE CONSTRAINTS PURGE');
  drop_if_present('TABLE', 'ACCOUNT_TYPES', ' CASCADE CONSTRAINTS PURGE');
  drop_if_present('TABLE', 'BRANCHES', ' CASCADE CONSTRAINTS PURGE');
  drop_if_present('TABLE', 'AUDIT_LOG', ' CASCADE CONSTRAINTS PURGE');
  drop_if_present('SEQUENCE', 'SEQ_BUSINESS_REFERENCE');
END;
/
