----------------------------------------------------
-- TEST : PACKAGE
----------------------------------------------------

BEGIN
    BANKING_PKG.DEPOSIT(
        '100000000001',
        500
    );
END;
/

BEGIN
    BANKING_PKG.WITHDRAW(
        '100000000001',
        200
    );
END;
/

SELECT BANKING_PKG.GET_BALANCE(
'100000000001'
)
FROM DUAL;