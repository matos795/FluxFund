/*
 * Compromissos financeiros genéricos.
 *
 * Esta tabela não substitui support_agreement.
 *
 * support_agreement continua responsável
 * pelos compromissos específicos de sustento.
 */
CREATE TABLE financial_commitment (
    id UUID PRIMARY KEY,

    organization_id UUID NOT NULL,

    party_id UUID NOT NULL,

    designated_recipient_party_id UUID,

    fund_id UUID NOT NULL,

    direction VARCHAR(20) NOT NULL,

    commitment_type VARCHAR(40) NOT NULL,

    recurrence VARCHAR(20) NOT NULL,

    amount NUMERIC(19, 2) NOT NULL,

    due_day INTEGER,

    start_date DATE NOT NULL,

    end_date DATE,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    description VARCHAR(255),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP,

    CONSTRAINT fk_financial_commitment_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_financial_commitment_party
        FOREIGN KEY (party_id)
        REFERENCES beneficiary(id),

    CONSTRAINT fk_financial_commitment_designated_recipient
        FOREIGN KEY (designated_recipient_party_id)
        REFERENCES beneficiary(id),

    CONSTRAINT fk_financial_commitment_fund
        FOREIGN KEY (fund_id)
        REFERENCES fund(id)
);