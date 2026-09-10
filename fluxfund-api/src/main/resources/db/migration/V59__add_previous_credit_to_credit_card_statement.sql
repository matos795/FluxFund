ALTER TABLE credit_card_statement
    ADD COLUMN previous_credit_amount NUMERIC(15, 2)
        NOT NULL
        DEFAULT 0;

ALTER TABLE credit_card_statement
    ADD CONSTRAINT chk_credit_card_statement_previous_credit
        CHECK (previous_credit_amount >= 0);