ALTER TABLE app_user
ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE organization_user
ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE organization_user
ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE organization_user
ADD COLUMN updated_at TIMESTAMP;

CREATE INDEX idx_organization_user_user_active
    ON organization_user (user_id, active);

CREATE INDEX idx_organization_user_organization_active
    ON organization_user (organization_id, active);