ALTER TABLE transaction_allocation
    ADD COLUMN source_party_id UUID;

ALTER TABLE transaction_allocation
    ADD CONSTRAINT fk_transaction_allocation_source_party
    FOREIGN KEY (source_party_id)
    REFERENCES beneficiary(id);

/*
 * Índice utilizado pelos futuros relatórios:
 *
 * - total recebido por contato;
 * - frequência de contribuições;
 * - previsto x recebido;
 * - última contribuição;
 * - recorrência mensal.
 */
CREATE INDEX idx_transaction_allocation_source_party
    ON transaction_allocation (
        organization_id,
        source_party_id
    );

/*
 * Também criamos um índice para o destinatário legado.
 *
 * Ele ajuda os relatórios atuais e prepara a futura
 * renomeação para recipient_party_id.
 */
CREATE INDEX IF NOT EXISTS
    idx_transaction_allocation_recipient_party
    ON transaction_allocation (
        organization_id,
        beneficiary_id
    );

COMMENT ON COLUMN
    transaction_allocation.source_party_id
IS
    'Contato financeiro que originou a receita';

COMMENT ON COLUMN
    transaction_allocation.beneficiary_id
IS
    'Contato destinatário/recebedor; nome legado preservado temporariamente';