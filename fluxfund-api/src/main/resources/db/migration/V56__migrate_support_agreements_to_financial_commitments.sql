/*
 * Unifica os compromissos de sustento
 * dentro da tabela financial_commitment.
 *
 * Os IDs originais são preservados.
 *
 * support_agreement permanecerá
 * temporariamente até todos os serviços,
 * relatórios e telas usarem a tabela nova.
 */

/*
 * As constraints criadas na V53 ainda
 * não conhecem o tipo SUPPORT.
 */
ALTER TABLE financial_commitment
    DROP CONSTRAINT
        ck_financial_commitment_type;

ALTER TABLE financial_commitment
    DROP CONSTRAINT
        ck_financial_commitment_type_direction;

/*
 * SUPPORT passa a fazer parte dos tipos
 * válidos da tabela genérica.
 */
ALTER TABLE financial_commitment
    ADD CONSTRAINT
        ck_financial_commitment_type
    CHECK (
        commitment_type IN (
            'DONATION',
            'CUSTOMER_PAYMENT',
            'SPONSORSHIP',
            'MEMBER_CONTRIBUTION',

            'SUPPORT',
            'SUPPLIER_PAYMENT',
            'SALARY',
            'SERVICE_PAYMENT',
            'REIMBURSEMENT',

            'OTHER'
        )
    );

/*
 * SUPPORT pertence exclusivamente à
 * direção PAYABLE.
 */
ALTER TABLE financial_commitment
    ADD CONSTRAINT
        ck_financial_commitment_type_direction
    CHECK (
        (
            direction = 'RECEIVABLE'

            AND commitment_type IN (
                'DONATION',
                'CUSTOMER_PAYMENT',
                'SPONSORSHIP',
                'MEMBER_CONTRIBUTION',
                'OTHER'
            )
        )

        OR

        (
            direction = 'PAYABLE'

            AND commitment_type IN (
                'SUPPORT',
                'SUPPLIER_PAYMENT',
                'SALARY',
                'SERVICE_PAYMENT',
                'REIMBURSEMENT',
                'OTHER'
            )
        )
    );

/*
 * Cada registro antigo de sustento vira
 * um FinancialCommitment.
 *
 * O mesmo UUID é utilizado para garantir:
 *
 * - rastreabilidade;
 * - preservação histórica;
 * - facilidade para comparar os dados;
 * - ausência de IDs artificiais de migração.
 */
INSERT INTO financial_commitment (
    id,
    organization_id,
    party_id,
    designated_recipient_party_id,
    fund_id,
    direction,
    commitment_type,
    recurrence,
    amount,
    due_day,
    start_date,
    end_date,
    active,
    description,
    created_at,
    updated_at
)
SELECT
    support.id,
    support.organization_id,
    support.beneficiary_id,
    NULL,
    support.fund_id,
    'PAYABLE',
    'SUPPORT',
    'MONTHLY',
    support.amount,
    NULL,
    support.start_date,
    support.end_date,
    support.active,
    support.description,
    support.created_at,
    support.updated_at

FROM support_agreement support

WHERE NOT EXISTS (
    SELECT 1

    FROM financial_commitment commitment

    WHERE commitment.id =
        support.id
);