CREATE TABLE credit_card_statement_payment (
    id UUID PRIMARY KEY,

    organization_id UUID NOT NULL,
    credit_card_statement_id UUID NOT NULL,

    payment_account_id UUID NOT NULL,
    payment_transaction_id UUID NOT NULL,

    payment_date DATE NOT NULL,

    amount NUMERIC(15, 2) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,

    CONSTRAINT fk_credit_card_statement_payment_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_credit_card_statement_payment_statement
        FOREIGN KEY (credit_card_statement_id)
        REFERENCES credit_card_statement(id),

    CONSTRAINT fk_credit_card_statement_payment_account
        FOREIGN KEY (payment_account_id)
        REFERENCES account(id),

    CONSTRAINT fk_credit_card_statement_payment_transaction
        FOREIGN KEY (payment_transaction_id)
        REFERENCES financial_transaction(id),

    CONSTRAINT chk_credit_card_statement_payment_amount
        CHECK (amount > 0),

    CONSTRAINT uq_credit_card_statement_payment_transaction
        UNIQUE (payment_transaction_id)
);

CREATE INDEX idx_credit_card_statement_payment_organization
    ON credit_card_statement_payment(organization_id);

CREATE INDEX idx_credit_card_statement_payment_statement
    ON credit_card_statement_payment(credit_card_statement_id);

CREATE INDEX idx_credit_card_statement_payment_date
    ON credit_card_statement_payment(payment_date);