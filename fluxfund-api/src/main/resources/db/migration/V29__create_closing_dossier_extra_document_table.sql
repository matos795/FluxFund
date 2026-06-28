CREATE TABLE closing_dossier_extra_document (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,

    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,

    document_type VARCHAR(60) NOT NULL,
    title VARCHAR(180) NOT NULL,

    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,

    CONSTRAINT fk_closing_dossier_extra_document_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT chk_closing_dossier_extra_document_period
        CHECK (period_start_date <= period_end_date),

    CONSTRAINT chk_closing_dossier_extra_document_sort_order
        CHECK (sort_order >= 0)
);

CREATE INDEX idx_closing_dossier_extra_document_org_period
    ON closing_dossier_extra_document (
        organization_id,
        period_start_date,
        period_end_date,
        sort_order
    );

CREATE INDEX idx_closing_dossier_extra_document_org_uploaded_at
    ON closing_dossier_extra_document (
        organization_id,
        uploaded_at DESC
    );