CREATE INDEX idx_financial_commitment_filters
    ON financial_commitment (
        organization_id,
        direction,
        active,
        start_date,
        end_date
    );

CREATE INDEX idx_financial_commitment_party
    ON financial_commitment (
        organization_id,
        party_id,
        direction,
        active
    );

CREATE INDEX idx_financial_commitment_designated_recipient
    ON financial_commitment (
        organization_id,
        designated_recipient_party_id,
        active
    )
    WHERE designated_recipient_party_id IS NOT NULL;

CREATE INDEX idx_financial_commitment_fund
    ON financial_commitment (
        organization_id,
        fund_id,
        direction,
        active
    );

CREATE INDEX idx_financial_commitment_type
    ON financial_commitment (
        organization_id,
        commitment_type,
        active
    );

COMMENT ON TABLE financial_commitment IS
    'Compromissos financeiros genéricos a receber ou a pagar';

COMMENT ON COLUMN financial_commitment.party_id IS
    'Origem esperada em RECEIVABLE ou recebedor esperado em PAYABLE';

COMMENT ON COLUMN financial_commitment.designated_recipient_party_id IS
    'Destinatário indicado de um compromisso a receber';

COMMENT ON COLUMN financial_commitment.fund_id IS
    'Fundo previsto no compromisso';