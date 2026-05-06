CREATE TABLE account (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,

    bank_code VARCHAR(10),
    bank_name VARCHAR(255),
    agency VARCHAR(20),
    account_number VARCHAR(50),

    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,

    initial_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    initial_balance_date DATE,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_account_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT uq_account_per_organization
        UNIQUE (organization_id, bank_code, agency, account_number),

    CONSTRAINT uq_account_name_per_organization
    UNIQUE (organization_id, name)
);

CREATE TABLE category (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    parent_id UUID NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_category_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_category_parent
        FOREIGN KEY (parent_id)
        REFERENCES category(id),

    CONSTRAINT uq_category_name_per_organization
        UNIQUE (organization_id, name, type)
);

CREATE TABLE fund (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    initial_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    initial_balance_date DATE,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_fund_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT uq_fund_name_per_organization
        UNIQUE (organization_id, name)
);