CREATE TABLE receipt (
    id UUID PRIMARY KEY,

    organization_id UUID NOT NULL,

    source_type VARCHAR(20) NOT NULL,

    financial_transaction_id UUID,

    transaction_allocation_id UUID,

    receipt_type VARCHAR(40) NOT NULL,

    status VARCHAR(20) NOT NULL
        DEFAULT 'DRAFT',

    sequence_year INTEGER,

    sequence_number BIGINT,

    issue_date DATE,

    payment_date DATE NOT NULL,

    amount NUMERIC(19, 2) NOT NULL,

    /*
     * Pessoa que pagou, nos recebimentos,
     * ou pessoa que recebeu, nos pagamentos.
     */
    counterparty_party_id UUID,

    counterparty_name VARCHAR(255)
        NOT NULL,

    counterparty_document VARCHAR(50),

    counterparty_address VARCHAR(500),

    /*
     * Destinatário indicado de uma receita.
     *
     * Exemplo:
     * doação de João destinada ao
     * Missionário Carlos.
     */
    beneficiary_party_id UUID,

    beneficiary_name VARCHAR(255),

    beneficiary_document VARCHAR(50),

    fund_id UUID,

    /*
     * Snapshot do nome do fundo.
     */
    fund_name VARCHAR(255),

    purpose_description VARCHAR(500)
        NOT NULL,

    place_city VARCHAR(255),

    place_state VARCHAR(2),

    signatory_name VARCHAR(255),

    signatory_title VARCHAR(255),

    notes VARCHAR(1000),

    /*
     * Snapshot da organização emissora.
     * Preenchido definitivamente
     * no momento da emissão.
     */
    issuer_name VARCHAR(255),

    issuer_legal_name VARCHAR(255),

    issuer_document VARCHAR(50),

    issuer_address VARCHAR(500),

    issuer_contact VARCHAR(255),

    pdf_storage_key VARCHAR(500),

    pdf_filename VARCHAR(255),

    pdf_size_bytes BIGINT,

    issued_at TIMESTAMP,

    canceled_at TIMESTAMP,

    cancellation_reason VARCHAR(500),

    replaces_receipt_id UUID,

    created_at TIMESTAMP NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMP,

    CONSTRAINT fk_receipt_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_receipt_transaction
        FOREIGN KEY (financial_transaction_id)
        REFERENCES financial_transaction(id),

    CONSTRAINT fk_receipt_allocation
        FOREIGN KEY (transaction_allocation_id)
        REFERENCES transaction_allocation(id),

    CONSTRAINT fk_receipt_counterparty
        FOREIGN KEY (counterparty_party_id)
        REFERENCES beneficiary(id),

    CONSTRAINT fk_receipt_beneficiary
        FOREIGN KEY (beneficiary_party_id)
        REFERENCES beneficiary(id),

    CONSTRAINT fk_receipt_fund
        FOREIGN KEY (fund_id)
        REFERENCES fund(id),

    CONSTRAINT fk_receipt_replaces
        FOREIGN KEY (replaces_receipt_id)
        REFERENCES receipt(id),

    CONSTRAINT ck_receipt_source_type
        CHECK (
            source_type IN (
                'MANUAL',
                'TRANSACTION',
                'ALLOCATION'
            )
        ),

    CONSTRAINT ck_receipt_source
        CHECK (
            (
                source_type = 'MANUAL'

                AND financial_transaction_id
                    IS NULL

                AND transaction_allocation_id
                    IS NULL
            )

            OR

            (
                source_type = 'TRANSACTION'

                AND financial_transaction_id
                    IS NOT NULL

                AND transaction_allocation_id
                    IS NULL
            )

            OR

            (
                source_type = 'ALLOCATION'

                AND financial_transaction_id
                    IS NOT NULL

                AND transaction_allocation_id
                    IS NOT NULL
            )
        ),

    CONSTRAINT ck_receipt_type
        CHECK (
            receipt_type IN (
                'DONATION',
                'MEMBER_CONTRIBUTION',
                'CUSTOMER_PAYMENT',
                'SPONSORSHIP',
                'OTHER_INCOME',

                'SUPPORT_PAYMENT',
                'SUPPLIER_PAYMENT',
                'SERVICE_PAYMENT',
                'REIMBURSEMENT',
                'OTHER_PAYMENT'
            )
        ),

    CONSTRAINT ck_receipt_status
        CHECK (
            status IN (
                'DRAFT',
                'ISSUED',
                'CANCELED'
            )
        ),

    CONSTRAINT ck_receipt_amount
        CHECK (
            amount > 0
        ),

    CONSTRAINT ck_receipt_sequence
        CHECK (
            (
                status = 'DRAFT'

                AND sequence_year IS NULL

                AND sequence_number IS NULL

                AND issue_date IS NULL

                AND issued_at IS NULL

                AND pdf_storage_key IS NULL
            )

            OR

            (
                status IN (
                    'ISSUED',
                    'CANCELED'
                )

                AND sequence_year IS NOT NULL

                AND sequence_number IS NOT NULL

                AND issue_date IS NOT NULL

                AND issued_at IS NOT NULL

                AND pdf_storage_key IS NOT NULL

                AND pdf_filename IS NOT NULL

                AND pdf_size_bytes IS NOT NULL
            )
        ),

    CONSTRAINT ck_receipt_cancellation
        CHECK (
            (
                status = 'CANCELED'

                AND canceled_at IS NOT NULL

                AND cancellation_reason
                    IS NOT NULL
            )

            OR

            (
                status <> 'CANCELED'

                AND canceled_at IS NULL

                AND cancellation_reason
                    IS NULL
            )
        )
);

CREATE UNIQUE INDEX
    uk_receipt_organization_number

    ON receipt (
        organization_id,
        sequence_year,
        sequence_number
    )

    WHERE sequence_number IS NOT NULL;

CREATE INDEX idx_receipt_organization_status
    ON receipt (
        organization_id,
        status,
        created_at
    );

CREATE INDEX idx_receipt_transaction
    ON receipt (
        organization_id,
        financial_transaction_id
    )
    WHERE financial_transaction_id
        IS NOT NULL;

CREATE INDEX idx_receipt_allocation
    ON receipt (
        organization_id,
        transaction_allocation_id
    )
    WHERE transaction_allocation_id
        IS NOT NULL;

CREATE INDEX idx_receipt_counterparty
    ON receipt (
        organization_id,
        counterparty_party_id
    )
    WHERE counterparty_party_id
        IS NOT NULL;

/*
 * Contador atômico por organização e ano.
 *
 * Será utilizado no próximo bloco,
 * quando o rascunho for emitido.
 */
CREATE TABLE receipt_counter (
    organization_id UUID NOT NULL,

    sequence_year INTEGER NOT NULL,

    last_number BIGINT NOT NULL
        DEFAULT 0,

    PRIMARY KEY (
        organization_id,
        sequence_year
    ),

    CONSTRAINT fk_receipt_counter_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT ck_receipt_counter_number
        CHECK (
            last_number >= 0
        )
);