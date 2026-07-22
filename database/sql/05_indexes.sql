CREATE INDEX idx_accounts_customer ON accounts(customer_id, status);
CREATE INDEX idx_accounts_branch ON accounts(branch_id, status);
CREATE INDEX idx_employees_branch ON employees(branch_id, status);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, transaction_date DESC);
CREATE INDEX idx_transactions_type_date ON transactions(transaction_type, transaction_date DESC);
CREATE INDEX idx_loans_customer_status ON loans(customer_id, status);
CREATE INDEX idx_loans_status_date ON loans(status, application_date);
CREATE INDEX idx_audit_date ON audit_log(action_date DESC);
