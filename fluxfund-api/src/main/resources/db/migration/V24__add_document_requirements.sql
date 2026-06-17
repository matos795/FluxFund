ALTER TABLE category
    ADD COLUMN requires_fiscal_document BOOLEAN;

ALTER TABLE category
    ADD COLUMN requires_payment_proof BOOLEAN;

UPDATE category
SET
    requires_fiscal_document = CASE
        WHEN type = 'EXPENSE' THEN true
        ELSE false
    END,
    requires_payment_proof = false;

ALTER TABLE category
    ALTER COLUMN requires_fiscal_document SET NOT NULL;

ALTER TABLE category
    ALTER COLUMN requires_payment_proof SET NOT NULL;

ALTER TABLE category
    ALTER COLUMN requires_fiscal_document SET DEFAULT false;

ALTER TABLE category
    ALTER COLUMN requires_payment_proof SET DEFAULT false;

ALTER TABLE organization_settings
    ADD COLUMN require_fiscal_document_for_expenses BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE organization_settings
    ADD COLUMN require_proof_for_incomes BOOLEAN NOT NULL DEFAULT false;