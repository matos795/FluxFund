CREATE TABLE bank_transaction (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    account_id UUID NOT NULL,

    external_id VARCHAR(255),
    transaction_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    description TEXT NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'IMPORTED',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bank_transaction_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_bank_transaction_account
        FOREIGN KEY (account_id)
        REFERENCES account(id),

    CONSTRAINT uq_bank_transaction_import
        UNIQUE (organization_id, account_id, external_id)
);

CREATE TABLE financial_transaction (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,

    bank_transaction_id UUID NULL,
    account_id UUID NOT NULL,
    category_id UUID NULL,

    type VARCHAR(50) NOT NULL,

    issue_date DATE,
    due_date DATE,
    settlement_date DATE,

    expected_amount NUMERIC(15,2) NOT NULL,
    settled_amount NUMERIC(15,2),

    interest_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,

    description TEXT NOT NULL,
    document_number VARCHAR(255),

    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_financial_transaction_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_financial_transaction_bank_transaction
        FOREIGN KEY (bank_transaction_id)
        REFERENCES bank_transaction(id),

    CONSTRAINT fk_financial_transaction_account
        FOREIGN KEY (account_id)
        REFERENCES account(id),

    CONSTRAINT fk_financial_transaction_category
        FOREIGN KEY (category_id)
        REFERENCES category(id),

    CONSTRAINT uq_financial_transaction_bank_transaction
        UNIQUE (bank_transaction_id)
);

CREATE TABLE transaction_allocation (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,

    financial_transaction_id UUID NOT NULL,
    fund_id UUID NOT NULL,
    beneficiary_id UUID NULL,

    amount NUMERIC(15,2) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_transaction_allocation_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_transaction_allocation_transaction
        FOREIGN KEY (financial_transaction_id)
        REFERENCES financial_transaction(id),

    CONSTRAINT fk_transaction_allocation_fund
        FOREIGN KEY (fund_id)
        REFERENCES fund(id),

    CONSTRAINT fk_transaction_allocation_beneficiary
        FOREIGN KEY (beneficiary_id)
        REFERENCES beneficiary(id)
);

CREATE TABLE attachment (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,

    financial_transaction_id UUID NOT NULL,

    type VARCHAR(50) NOT NULL,

    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    file_size BIGINT,
    storage_key VARCHAR(500) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_attachment_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_attachment_financial_transaction
        FOREIGN KEY (financial_transaction_id)
        REFERENCES financial_transaction(id)
);