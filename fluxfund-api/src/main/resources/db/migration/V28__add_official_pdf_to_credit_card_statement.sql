ALTER TABLE credit_card_statement
ADD COLUMN statement_pdf_original_filename VARCHAR(255),
ADD COLUMN statement_pdf_content_type VARCHAR(100),
ADD COLUMN statement_pdf_size_bytes BIGINT,
ADD COLUMN statement_pdf_storage_key VARCHAR(500),
ADD COLUMN statement_pdf_uploaded_at TIMESTAMP;

ALTER TABLE credit_card_statement
ADD CONSTRAINT chk_credit_card_statement_pdf_metadata
CHECK (
    (
        statement_pdf_storage_key IS NULL
        AND statement_pdf_original_filename IS NULL
        AND statement_pdf_content_type IS NULL
        AND statement_pdf_size_bytes IS NULL
        AND statement_pdf_uploaded_at IS NULL
    )
    OR
    (
        statement_pdf_storage_key IS NOT NULL
        AND statement_pdf_original_filename IS NOT NULL
        AND statement_pdf_content_type IS NOT NULL
        AND statement_pdf_size_bytes IS NOT NULL
        AND statement_pdf_uploaded_at IS NOT NULL
    )
);