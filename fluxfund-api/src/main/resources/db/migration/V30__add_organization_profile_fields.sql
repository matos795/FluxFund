ALTER TABLE organization
    ADD COLUMN legal_name VARCHAR(255),
    ADD COLUMN cnpj VARCHAR(14),
    ADD COLUMN contact_email VARCHAR(255),
    ADD COLUMN contact_phone VARCHAR(30),

    ADD COLUMN address_line VARCHAR(255),
    ADD COLUMN address_number VARCHAR(30),
    ADD COLUMN address_complement VARCHAR(120),
    ADD COLUMN neighborhood VARCHAR(120),
    ADD COLUMN city VARCHAR(120),
    ADD COLUMN state CHAR(2),
    ADD COLUMN zip_code VARCHAR(8),

    ADD COLUMN reviewer_name VARCHAR(120),
    ADD COLUMN reviewer_title VARCHAR(120),
    ADD COLUMN approver_name VARCHAR(120),
    ADD COLUMN approver_title VARCHAR(120);

CREATE UNIQUE INDEX uq_organization_cnpj
    ON organization (cnpj)
    WHERE cnpj IS NOT NULL;