ALTER TABLE financial_transaction
ADD COLUMN created_by UUID,
ADD COLUMN updated_by UUID,
ADD COLUMN canceled_by UUID,
ADD COLUMN canceled_at TIMESTAMP;

ALTER TABLE transaction_allocation
ADD COLUMN created_by UUID,
ADD COLUMN updated_by UUID;

ALTER TABLE attachment
ADD COLUMN uploaded_by UUID;

ALTER TABLE support_agreement
ADD COLUMN created_by UUID,
ADD COLUMN updated_by UUID,
ADD COLUMN activated_by UUID,
ADD COLUMN deactivated_by UUID,
ADD COLUMN deactivated_at TIMESTAMP;

ALTER TABLE organization_settings
ADD COLUMN updated_by UUID;