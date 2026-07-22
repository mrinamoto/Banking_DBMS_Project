-- Compatibility wrappers for classroom demonstrations. New application code calls packages.
CREATE OR REPLACE PROCEDURE pr_deposit(p_account_number VARCHAR2,p_amount NUMBER,p_processed_by NUMBER,p_reference OUT VARCHAR2) AS
BEGIN pkg_banking_operations.deposit(p_account_number,p_amount,p_processed_by,p_reference); END;
/
CREATE OR REPLACE PROCEDURE pr_withdraw(p_account_number VARCHAR2,p_amount NUMBER,p_processed_by NUMBER,p_reference OUT VARCHAR2) AS
BEGIN pkg_banking_operations.withdraw(p_account_number,p_amount,p_processed_by,p_reference); END;
/
CREATE OR REPLACE PROCEDURE pr_transfer(p_from_account VARCHAR2,p_to_account VARCHAR2,p_amount NUMBER,p_processed_by NUMBER,p_owner_customer_id NUMBER,p_reference OUT VARCHAR2) AS
BEGIN pkg_banking_operations.transfer_funds(p_from_account,p_to_account,p_amount,p_processed_by,p_owner_customer_id,p_reference); END;
/
