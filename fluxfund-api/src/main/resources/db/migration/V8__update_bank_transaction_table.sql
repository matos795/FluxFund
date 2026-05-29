ALTER TABLE bank_transaction
ADD COLUMN reconciled_at TIMESTAMP;

ALTER TABLE bank_transaction
ADD COLUMN raw_description TEXT;