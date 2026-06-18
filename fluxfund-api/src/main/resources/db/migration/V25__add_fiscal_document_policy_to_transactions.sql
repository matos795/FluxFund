ALTER TABLE financial_transaction
    ADD COLUMN fiscal_document_policy VARCHAR(20) NOT NULL DEFAULT 'CATEGORY';

ALTER TABLE financial_transaction
    ADD COLUMN fiscal_document_note VARCHAR(500);

ALTER TABLE financial_transaction
    ADD CONSTRAINT ck_financial_transaction_fiscal_document_policy
    CHECK (fiscal_document_policy IN ('CATEGORY', 'REQUIRED', 'WAIVED', 'MISSING'));