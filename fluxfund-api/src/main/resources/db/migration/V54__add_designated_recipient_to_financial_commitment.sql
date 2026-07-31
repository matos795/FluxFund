/*
 * Permite vincular um compromisso a receber
 * a um destinatário específico.
 *
 * Exemplo:
 *
 * party / beneficiary_id:
 * João Doador
 *
 * designated_recipient_id:
 * Missionário Carlos
 *
 * A coluna é opcional porque também existem
 * doações gerais, sem destinação individual.
 */

ALTER TABLE support_agreement
    ADD COLUMN designated_recipient_id UUID;

ALTER TABLE support_agreement
    ADD CONSTRAINT fk_support_agreement_designated_recipient
    FOREIGN KEY (designated_recipient_id)
    REFERENCES beneficiary(id);

/*
 * Somente compromissos a receber podem possuir
 * um destinatário designado.
 *
 * Em compromissos a pagar, o próprio party já
 * representa quem receberá o pagamento.
 */
ALTER TABLE support_agreement
    ADD CONSTRAINT ck_support_agreement_designated_recipient_direction
    CHECK (
        designated_recipient_id IS NULL
        OR direction = 'RECEIVABLE'
    );

CREATE INDEX idx_support_agreement_designated_recipient
    ON support_agreement (
        organization_id,
        designated_recipient_id,
        active
    );

COMMENT ON COLUMN
    support_agreement.designated_recipient_id
IS
    'Destinatário indicado para um compromisso a receber';