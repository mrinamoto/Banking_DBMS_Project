----------------------------------------------------
-- TEST : DEPOSIT
----------------------------------------------------

SELECT ACCOUNT_NUMBER,
       BALANCE
FROM ACCOUNTS;

BEGIN
    PR_DEPOSIT('100000000001',5000);
END;
/

SELECT ACCOUNT_NUMBER,
       BALANCE
FROM ACCOUNTS;

----------------------------------------------------
-- TEST : WITHDRAW
----------------------------------------------------

BEGIN
    PR_WITHDRAW('100000000001',2000);
END;
/

SELECT ACCOUNT_NUMBER,
       BALANCE
FROM ACCOUNTS;

----------------------------------------------------
-- TEST : TRANSFER
----------------------------------------------------

SELECT ACCOUNT_NUMBER,
       BALANCE
FROM ACCOUNTS
ORDER BY ACCOUNT_NUMBER;

BEGIN
    PR_TRANSFER(
        '100000000001',
        '100000000002',
        1000
    );
END;
/

SELECT ACCOUNT_NUMBER,
       BALANCE
FROM ACCOUNTS
ORDER BY ACCOUNT_NUMBER;

SELECT *
FROM TRANSACTIONS
ORDER BY TRANSACTION_ID DESC;