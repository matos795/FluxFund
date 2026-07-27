ALTER TABLE platform_organization_onboarding
    ALTER COLUMN billing_due_day
    TYPE INTEGER
    USING billing_due_day::INTEGER;