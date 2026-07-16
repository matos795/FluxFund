ALTER TABLE credit_card_statement_payment
    ALTER COLUMN payment_account_id DROP NOT NULL,
    ALTER COLUMN payment_transaction_id DROP NOT NULL;

ALTER TABLE credit_card_statement_payment
    ADD COLUMN statement_external_id VARCHAR(255),
    ADD COLUMN statement_raw_description TEXT,
    ADD COLUMN statement_transaction_type VARCHAR(30);

CREATE UNIQUE INDEX uq_credit_card_statement_payment_external_id
    ON credit_card_statement_payment (
        organization_id,
        credit_card_statement_id,
        statement_external_id
    )
    WHERE statement_external_id IS NOT NULL;

ALTER TABLE credit_card_statement_payment
    ADD CONSTRAINT chk_credit_card_statement_payment_bank_link
    CHECK (
        (
            payment_account_id IS NULL
            AND payment_transaction_id IS NULL
        )
        OR
        (
            payment_account_id IS NOT NULL
            AND payment_transaction_id IS NOT NULL
        )
    );

ALTER TABLE credit_card_statement_payment
    ADD CONSTRAINT chk_credit_card_statement_payment_origin
    CHECK (
        statement_external_id IS NOT NULL
        OR payment_transaction_id IS NOT NULL
    );