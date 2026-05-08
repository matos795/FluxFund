ALTER TABLE fund
ADD CONSTRAINT uk_fund_organization_name
UNIQUE (organization_id, name);

ALTER TABLE beneficiary
ADD CONSTRAINT uk_beneficiary_organization_name
UNIQUE (organization_id, name);

ALTER TABLE beneficiary
ADD CONSTRAINT uk_beneficiary_organization_document
UNIQUE (organization_id, document);