ALTER TABLE financial_transaction
    ADD COLUMN technical_movement BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN technical_movement_type VARCHAR(60);

ALTER TABLE financial_transaction
    ADD CONSTRAINT ck_financial_transaction_technical_movement
    CHECK (
        (
            technical_movement = FALSE
            AND technical_movement_type IS NULL
        )
        OR
        (
            technical_movement = TRUE
            AND technical_movement_type IS NOT NULL
        )
    );