ALTER TABLE financial_transaction
    ADD COLUMN transfer_direction VARCHAR(20);

ALTER TABLE financial_transaction
    ADD COLUMN transfer_group_id UUID;

ALTER TABLE financial_transaction
    ADD COLUMN transfer_counterparty_account_id UUID;

ALTER TABLE financial_transaction
    ADD CONSTRAINT fk_financial_transaction_transfer_counterparty_account
        FOREIGN KEY (transfer_counterparty_account_id)
        REFERENCES account(id);

CREATE INDEX idx_financial_transaction_transfer_group_id
    ON financial_transaction(transfer_group_id);

CREATE INDEX idx_financial_transaction_transfer_counterparty_account_id
    ON financial_transaction(transfer_counterparty_account_id);