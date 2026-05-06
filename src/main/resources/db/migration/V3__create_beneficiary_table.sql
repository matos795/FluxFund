CREATE TABLE beneficiary (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,

    document VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),

    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_beneficiary_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT uq_beneficiary_name_per_organization
        UNIQUE (organization_id, name)
);