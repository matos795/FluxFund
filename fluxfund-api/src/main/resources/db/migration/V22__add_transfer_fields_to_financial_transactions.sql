ALTER TABLE financial_transactions
    ADD COLUMN transfer_direction VARCHAR(20);

ALTER TABLE financial_transactions
    ADD COLUMN transfer_group_id UUID;

ALTER TABLE financial_transactions
    ADD COLUMN transfer_counterparty_account_id UUID;

ALTER TABLE financial_transactions
    ADD CONSTRAINT fk_financial_transactions_transfer_counterparty_account
        FOREIGN KEY (transfer_counterparty_account_id)
        REFERENCES accounts(id);

CREATE INDEX idx_financial_transactions_transfer_group_id
    ON financial_transactions(transfer_group_id);

CREATE INDEX idx_financial_transactions_transfer_counterparty_account_id
    ON financial_transactions(transfer_counterparty_account_id);