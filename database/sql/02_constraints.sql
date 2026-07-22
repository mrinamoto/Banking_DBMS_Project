-- Constraints are declared beside their columns in 01_create_tables.sql so beginners can
-- understand each rule in context. These additional rules require separate ALTER statements.
ALTER TABLE loans ADD CONSTRAINT ck_loan_totals CHECK (
  (status IN ('PENDING','REJECTED') AND outstanding_balance IS NULL)
  OR (status IN ('APPROVED','ACTIVE','COMPLETED') AND total_repayable > 0 AND outstanding_balance >= 0)
);

ALTER TABLE fund_transfers ADD CONSTRAINT uk_transfer_debit UNIQUE (debit_transaction_id);
ALTER TABLE fund_transfers ADD CONSTRAINT uk_transfer_credit UNIQUE (credit_transaction_id);
ALTER TABLE loan_payments ADD CONSTRAINT uk_payment_transaction UNIQUE (transaction_id);
