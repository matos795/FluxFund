ALTER TABLE credit_card_statement_payment
    ADD COLUMN applied_amount NUMERIC(15, 2),
    ADD COLUMN advance_credit_amount NUMERIC(15, 2);

UPDATE credit_card_statement_payment
SET
    applied_amount = amount,
    advance_credit_amount = 0;

ALTER TABLE credit_card_statement_payment
    ALTER COLUMN applied_amount SET NOT NULL,
    ALTER COLUMN advance_credit_amount SET NOT NULL;

ALTER TABLE credit_card_statement_payment
    ADD CONSTRAINT chk_credit_card_statement_payment_applied_amount
        CHECK (applied_amount >= 0),

    ADD CONSTRAINT chk_credit_card_statement_payment_advance_credit_amount
        CHECK (advance_credit_amount >= 0),

    ADD CONSTRAINT chk_credit_card_statement_payment_breakdown
        CHECK (
            amount =
            applied_amount + advance_credit_amount
        );