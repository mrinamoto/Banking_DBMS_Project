----------------------------------------------------
-- TEST : UPDATE BALANCE TRIGGER
----------------------------------------------------

UPDATE ACCOUNTS
SET BALANCE = BALANCE + 100
WHERE ACCOUNT_NUMBER='100000000001';

COMMIT;

SELECT ACCOUNT_NUMBER,
       BALANCE,
       LAST_TRANSACTION_DATE
FROM ACCOUNTS
WHERE ACCOUNT_NUMBER='100000000001';

----------------------------------------------------
-- TEST : NEGATIVE BALANCE
----------------------------------------------------

UPDATE ACCOUNTS
SET BALANCE=-100
WHERE ACCOUNT_NUMBER='100000000001';

----------------------------------------------------
-- TEST : NEW CUSTOMER
----------------------------------------------------

SET SERVEROUTPUT ON;

INSERT INTO CUSTOMERS(FIRST_NAME,LAST_NAME,DATE_OF_BIRTH,GENDER,PHONE,EMAIL,NATIONAL_ID,ADDRESS,ANNUAL_INCOME)
VALUES('Demo','Customer',DATE '2000-01-01','Male','01799999999','demo@test.com','1234567899999','Dhaka',500000);

COMMIT;

----------------------------------------------------
-- TEST : DELETE CUSTOMER
----------------------------------------------------

DELETE FROM CUSTOMERS
WHERE CUSTOMER_ID=
(
SELECT MIN(CUSTOMER_ID)
FROM CUSTOMERS
);