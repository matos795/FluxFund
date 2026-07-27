CREATE TABLE platform_organization_onboarding (
    id UUID PRIMARY KEY,

    organization_id UUID NOT NULL,

    status VARCHAR(40) NOT NULL
        DEFAULT 'PREPARING',

    plan_name VARCHAR(100),

    monthly_fee NUMERIC(19, 2),

    setup_fee NUMERIC(19, 2),

    contract_start_date DATE,

    billing_due_day SMALLINT,

    contract_signed BOOLEAN NOT NULL
        DEFAULT FALSE,

    categories_reviewed BOOLEAN NOT NULL
        DEFAULT FALSE,

    documentation_rules_reviewed BOOLEAN NOT NULL
        DEFAULT FALSE,

    initial_import_validated BOOLEAN NOT NULL
        DEFAULT FALSE,

    test_report_validated BOOLEAN NOT NULL
        DEFAULT FALSE,

    users_trained BOOLEAN NOT NULL
        DEFAULT FALSE,

    initial_backup_confirmed BOOLEAN NOT NULL
        DEFAULT FALSE,

    go_live_approved BOOLEAN NOT NULL
        DEFAULT FALSE,

    internal_notes TEXT,

    launched_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ,

    CONSTRAINT uk_platform_onboarding_organization
        UNIQUE (organization_id),

    CONSTRAINT fk_platform_onboarding_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT ck_platform_onboarding_monthly_fee
        CHECK (
            monthly_fee IS NULL
            OR monthly_fee >= 0
        ),

    CONSTRAINT ck_platform_onboarding_setup_fee
        CHECK (
            setup_fee IS NULL
            OR setup_fee >= 0
        ),

    CONSTRAINT ck_platform_onboarding_billing_due_day
        CHECK (
            billing_due_day IS NULL
            OR billing_due_day BETWEEN 1 AND 28
        )
);

CREATE INDEX idx_platform_onboarding_status
    ON platform_organization_onboarding(status);