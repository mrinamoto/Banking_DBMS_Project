-- Run as the schema owner after creating these optional Oracle roles.
-- CREATE ROLE bank_read_role; CREATE ROLE bank_staff_role; CREATE ROLE bank_admin_role;
GRANT SELECT ON vw_customer_account_summary TO bank_read_role;
GRANT SELECT ON vw_loan_summary TO bank_read_role;
GRANT EXECUTE ON pkg_banking_operations TO bank_staff_role;
GRANT EXECUTE ON pkg_loan_operations TO bank_staff_role;
GRANT SELECT, INSERT, UPDATE ON branches TO bank_admin_role;
GRANT SELECT ON audit_log TO bank_admin_role;
