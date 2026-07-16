ALTER TABLE credit_card_statement
    ADD COLUMN previous_balance_amount NUMERIC(15, 2)
        NOT NULL
        DEFAULT 0;

ALTER TABLE credit_card_statement
    ADD CONSTRAINT chk_credit_card_statement_previous_balance
        CHECK (previous_balance_amount >= 0);