/*
 * Vincula opcionalmente uma alocação a um
 * compromisso financeiro.
 *
 * A relação é:
 *
 * compromisso 1
 *     para
 * várias alocações
 *
 * Isso permite:
 *
 * - realização parcial;
 * - realização em mais de uma transação;
 * - divisão de uma transação entre compromissos.
 */

ALTER TABLE transaction_allocation
    ADD COLUMN financial_commitment_id UUID;

ALTER TABLE transaction_allocation
    ADD CONSTRAINT fk_transaction_allocation_financial_commitment
    FOREIGN KEY (financial_commitment_id)
    REFERENCES support_agreement(id);

/*
 * Usado para calcular quanto foi realizado
 * de cada compromisso em uma competência.
 */
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
    'Compromisso financeiro opcional realizado por esta alocação';