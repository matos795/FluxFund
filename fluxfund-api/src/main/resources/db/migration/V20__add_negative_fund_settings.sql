ALTER TABLE organization_settings
ADD COLUMN allow_negative_funds BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN suggest_default_fund_reallocation BOOLEAN NOT NULL DEFAULT FALSE;