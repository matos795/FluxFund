ALTER TABLE organization
ADD COLUMN updated_at TIMESTAMP;

ALTER TABLE app_user
ADD COLUMN updated_at TIMESTAMP;

ALTER TABLE account
ADD COLUMN updated_at TIMESTAMP;

ALTER TABLE category
ADD COLUMN updated_at TIMESTAMP;

ALTER TABLE fund
ADD COLUMN updated_at TIMESTAMP;

ALTER TABLE beneficiary
ADD COLUMN updated_at TIMESTAMP;

ALTER TABLE bank_transaction
ADD COLUMN updated_at TIMESTAMP;

ALTER TABLE financial_transaction
ADD COLUMN updated_at TIMESTAMP;

ALTER TABLE transaction_allocation
ADD COLUMN updated_at TIMESTAMP;

ALTER TABLE attachment
ADD COLUMN updated_at TIMESTAMP;