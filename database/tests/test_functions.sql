----------------------------------------------------
-- TEST : FUNCTIONS
----------------------------------------------------

PROMPT ==========================================
PROMPT Testing FN_GET_CUSTOMER_NAME
PROMPT ==========================================

SELECT CUSTOMER_ID,
       FIRST_NAME,
       LAST_NAME
FROM CUSTOMERS;

SELECT FN_GET_CUSTOMER_NAME(
(
SELECT MIN(CUSTOMER_ID)
FROM CUSTOMERS
))
FROM DUAL;

----------------------------------------------------

PROMPT ==========================================
PROMPT Testing FN_GET_ACCOUNT_BALANCE
PROMPT ==========================================

SELECT ACCOUNT_ID,
       ACCOUNT_NUMBER,
       BALANCE
FROM ACCOUNTS;

SELECT FN_GET_ACCOUNT_BALANCE(
(
SELECT MIN(ACCOUNT_ID)
FROM ACCOUNTS
))
FROM DUAL;

----------------------------------------------------

PROMPT ==========================================
PROMPT Testing FN_TOTAL_ACCOUNTS
PROMPT ==========================================

SELECT CUSTOMER_ID
FROM CUSTOMERS;

SELECT FN_TOTAL_ACCOUNTS(
(
SELECT MIN(CUSTOMER_ID)
FROM CUSTOMERS
))
FROM DUAL;