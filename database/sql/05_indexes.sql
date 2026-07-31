CREATE INDEX idx_accounts_customer ON accounts(customer_id, status);
CREATE INDEX idx_accounts_branch ON accounts(branch_id, status);
CREATE INDEX idx_employees_branch ON employees(branch_id, status);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, transaction_date DESC);
CREATE INDEX idx_transactions_type_date ON transactions(transaction_type, transaction_date DESC);
CREATE INDEX idx_loans_customer_status ON loans(customer_id, status);
CREATE INDEX idx_loans_status_date ON loans(status, application_date);
CREATE INDEX idx_audit_date ON audit_log(action_date DESC);
CREATE INDEX idx_users_username_lower ON users(LOWER(username));
CREATE INDEX idx_users_role_active ON users(role, is_active, account_locked);
CREATE INDEX idx_users_employee ON users(employee_id);
CREATE INDEX idx_login_history_user_date ON login_history(user_id, occurred_at DESC);
CREATE INDEX idx_login_history_attempt_date ON login_history(attempted_username, occurred_at DESC);
CREATE INDEX idx_reversal_original ON transaction_reversals(original_transaction_id);
CREATE INDEX idx_reversal_date ON transaction_reversals(reversed_at DESC);
CREATE INDEX idx_beneficiary_customer_status ON beneficiaries(customer_id, status, updated_at DESC);
CREATE INDEX idx_beneficiary_source ON beneficiaries(source_account_id, status);
CREATE UNIQUE INDEX uk_beneficiary_active ON beneficiaries(
  CASE WHEN status='ACTIVE' THEN customer_id END,
  CASE WHEN status='ACTIVE' THEN source_account_id END,
  CASE WHEN status='ACTIVE' THEN beneficiary_account_id END
);
CREATE INDEX idx_kyc_customer_status ON customer_kyc(customer_id, status, updated_at DESC);
CREATE INDEX idx_kyc_status_date ON customer_kyc(status, submitted_at DESC);
CREATE INDEX idx_deposit_scheme_status ON deposit_schemes(status, scheme_type);
CREATE INDEX idx_certificate_customer_status ON deposit_certificates(customer_id, status, maturity_date);
CREATE INDEX idx_certificate_account ON deposit_certificates(account_id, status);
CREATE INDEX idx_certificate_maturity ON deposit_certificates(maturity_date, status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id,is_read,created_at DESC);
CREATE INDEX idx_service_requests_customer ON service_requests(customer_id,status,updated_at DESC);
CREATE INDEX idx_service_requests_branch ON service_requests(branch_id,status,updated_at DESC);
CREATE INDEX idx_service_requests_assignee ON service_requests(assigned_to,status,updated_at DESC);
