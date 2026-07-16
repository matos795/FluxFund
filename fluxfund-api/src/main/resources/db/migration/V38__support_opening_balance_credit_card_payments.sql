ALTER TABLE credit_card_statement_payment
    ADD COLUMN opening_balance BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE credit_card_statement_payment
    ADD CONSTRAINT chk_credit_card_statement_payment_opening_balance
    CHECK (
        opening_balance = FALSE
        OR (
            payment_account_id IS NULL
            AND payment_transaction_id IS NULL
        )
    );