CREATE TABLE organization_settings (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    default_fund_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,

    CONSTRAINT fk_organization_settings_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_organization_settings_default_fund
        FOREIGN KEY (default_fund_id)
        REFERENCES fund(id),

    CONSTRAINT uk_organization_settings_organization
        UNIQUE (organization_id)
);