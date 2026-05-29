ALTER TABLE attachment
RENAME COLUMN file_name TO original_filename;

ALTER TABLE attachment
RENAME COLUMN file_size TO size_bytes;

ALTER TABLE attachment
ADD COLUMN uploaded_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE INDEX idx_attachment_transaction
ON attachment (organization_id, financial_transaction_id);