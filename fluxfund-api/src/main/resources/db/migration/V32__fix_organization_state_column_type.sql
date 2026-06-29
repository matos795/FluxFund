ALTER TABLE organization
    ALTER COLUMN state TYPE VARCHAR(2)
    USING TRIM(state);