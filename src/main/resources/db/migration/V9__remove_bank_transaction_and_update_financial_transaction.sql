ALTER TABLE financial_transaction
ADD COLUMN external_id VARCHAR(255);

ALTER TABLE financial_transaction
ADD COLUMN raw_description TEXT;

ALTER TABLE financial_transaction
ADD COLUMN imported_at TIMESTAMP;

ALTER TABLE financial_transaction
ADD COLUMN classified_at TIMESTAMP;

ALTER TABLE financial_transaction
ADD COLUMN source VARCHAR(50) NOT NULL DEFAULT 'MANUAL';

ALTER TABLE financial_transaction
DROP CONSTRAINT uq_financial_transaction_bank_transaction;

ALTER TABLE financial_transaction
DROP CONSTRAINT fk_financial_transaction_bank_transaction;

ALTER TABLE financial_transaction
DROP COLUMN bank_transaction_id;

DROP TABLE bank_transaction;