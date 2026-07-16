ALTER TABLE financial_transaction
    ADD CONSTRAINT chk_financial_transaction_transfer_direction
    CHECK (
        type <> 'TRANSFER'
        OR transfer_direction IS NOT NULL
    );