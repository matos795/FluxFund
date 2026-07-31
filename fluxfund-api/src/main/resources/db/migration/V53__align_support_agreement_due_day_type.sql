ALTER TABLE support_agreement
    ALTER COLUMN due_day TYPE INTEGER
    USING due_day::INTEGER;