ALTER TABLE organization
    ADD COLUMN logo_original_filename VARCHAR(255),
    ADD COLUMN logo_content_type VARCHAR(100),
    ADD COLUMN logo_size_bytes BIGINT,
    ADD COLUMN logo_storage_key VARCHAR(500),
    ADD COLUMN logo_uploaded_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE organization
    ADD CONSTRAINT chk_organization_logo_metadata
    CHECK (
        (
            logo_original_filename IS NULL
            AND logo_content_type IS NULL
            AND logo_size_bytes IS NULL
            AND logo_storage_key IS NULL
            AND logo_uploaded_at IS NULL
        )
        OR
        (
            logo_original_filename IS NOT NULL
            AND logo_content_type IS NOT NULL
            AND logo_size_bytes IS NOT NULL
            AND logo_storage_key IS NOT NULL
            AND logo_uploaded_at IS NOT NULL
        )
    );