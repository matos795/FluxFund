CREATE TABLE bank_statement_document (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    account_id UUID NOT NULL,

    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,

    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,

    CONSTRAINT fk_bank_statement_document_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_bank_statement_document_account
        FOREIGN KEY (account_id)
        REFERENCES account(id),

    CONSTRAINT chk_bank_statement_document_period
        CHECK (period_start_date <= period_end_date)
);

CREATE INDEX idx_bank_statement_document_org_account_period
    ON bank_statement_document (
        organization_id,
        account_id,
        period_start_date,
        period_end_date
    );

CREATE INDEX idx_bank_statement_document_org_uploaded_at
    ON bank_statement_document (organization_id, uploaded_at DESC);