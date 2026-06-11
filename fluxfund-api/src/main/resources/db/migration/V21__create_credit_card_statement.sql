CREATE TABLE credit_card_statement (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    credit_card_account_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,

    closing_date DATE,
    due_date DATE NOT NULL,
    payment_date DATE,

    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    payment_account_id UUID,
    payment_transaction_id UUID,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,

    CONSTRAINT fk_credit_card_statement_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_credit_card_statement_credit_card_account
        FOREIGN KEY (credit_card_account_id)
        REFERENCES account(id),

    CONSTRAINT fk_credit_card_statement_payment_account
        FOREIGN KEY (payment_account_id)
        REFERENCES account(id),

    CONSTRAINT fk_credit_card_statement_payment_transaction
        FOREIGN KEY (payment_transaction_id)
        REFERENCES financial_transaction(id)
);

ALTER TABLE financial_transaction
ADD COLUMN credit_card_statement_id UUID;

ALTER TABLE financial_transaction
ADD COLUMN installment_number INTEGER;

ALTER TABLE financial_transaction
ADD COLUMN installment_count INTEGER;

ALTER TABLE financial_transaction
ADD CONSTRAINT fk_financial_transaction_credit_card_statement
    FOREIGN KEY (credit_card_statement_id)
    REFERENCES credit_card_statement(id);

CREATE INDEX idx_credit_card_statement_organization
    ON credit_card_statement(organization_id);

CREATE INDEX idx_credit_card_statement_account
    ON credit_card_statement(credit_card_account_id);

CREATE INDEX idx_financial_transaction_credit_card_statement
    ON financial_transaction(credit_card_statement_id);