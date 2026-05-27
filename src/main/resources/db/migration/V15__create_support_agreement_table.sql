CREATE TABLE support_agreement (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    beneficiary_id UUID NOT NULL,
    fund_id UUID NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,

    CONSTRAINT fk_support_agreement_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_support_agreement_beneficiary
        FOREIGN KEY (beneficiary_id)
        REFERENCES beneficiary(id),

    CONSTRAINT fk_support_agreement_fund
        FOREIGN KEY (fund_id)
        REFERENCES fund(id)
);

CREATE INDEX idx_support_agreement_organization
    ON support_agreement (organization_id);

CREATE INDEX idx_support_agreement_beneficiary
    ON support_agreement (beneficiary_id);

CREATE INDEX idx_support_agreement_fund
    ON support_agreement (fund_id);

CREATE INDEX idx_support_agreement_active
    ON support_agreement (organization_id, active);