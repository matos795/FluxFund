CREATE TABLE fund_transfer (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    source_fund_id UUID NOT NULL,
    destination_fund_id UUID NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    transfer_date DATE NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_fund_transfer_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_fund_transfer_source_fund
        FOREIGN KEY (source_fund_id)
        REFERENCES fund(id),

    CONSTRAINT fk_fund_transfer_destination_fund
        FOREIGN KEY (destination_fund_id)
        REFERENCES fund(id),

    CONSTRAINT ck_fund_transfer_amount_positive
        CHECK (amount > 0),

    CONSTRAINT ck_fund_transfer_different_funds
        CHECK (source_fund_id <> destination_fund_id)
);

CREATE INDEX idx_fund_transfer_organization_date
    ON fund_transfer(organization_id, transfer_date);

CREATE INDEX idx_fund_transfer_source_fund
    ON fund_transfer(source_fund_id);

CREATE INDEX idx_fund_transfer_destination_fund
    ON fund_transfer(destination_fund_id);

CREATE INDEX idx_fund_transfer_status
    ON fund_transfer(status);