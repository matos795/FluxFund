/*
 * Vínculo opcional entre uma alocação
 * e um compromisso financeiro genérico.
 *
 * Alocações antigas permanecem com NULL
 * até a reconciliação histórica.
 */
ALTER TABLE transaction_allocation
    ADD COLUMN financial_commitment_id UUID;

ALTER TABLE transaction_allocation
    ADD CONSTRAINT fk_transaction_allocation_financial_commitment
    FOREIGN KEY (financial_commitment_id)
    REFERENCES financial_commitment(id);

CREATE INDEX idx_allocation_commitment_reference_month
    ON transaction_allocation (
        organization_id,
        financial_commitment_id,
        reference_month
    )
    WHERE financial_commitment_id IS NOT NULL;

COMMENT ON COLUMN
    transaction_allocation.financial_commitment_id
IS
    'Compromisso financeiro genérico realizado por esta alocação';