ALTER TABLE financial_commitment
    ADD CONSTRAINT ck_financial_commitment_direction
    CHECK (
        direction IN (
            'RECEIVABLE',
            'PAYABLE'
        )
    );

ALTER TABLE financial_commitment
    ADD CONSTRAINT ck_financial_commitment_type
    CHECK (
        commitment_type IN (
            'DONATION',
            'CUSTOMER_PAYMENT',
            'SPONSORSHIP',
            'MEMBER_CONTRIBUTION',
            'SUPPLIER_PAYMENT',
            'SALARY',
            'SERVICE_PAYMENT',
            'REIMBURSEMENT',
            'OTHER'
        )
    );

ALTER TABLE financial_commitment
    ADD CONSTRAINT ck_financial_commitment_recurrence
    CHECK (
        recurrence IN (
            'ONE_TIME',
            'MONTHLY'
        )
    );

ALTER TABLE financial_commitment
    ADD CONSTRAINT ck_financial_commitment_amount
    CHECK (
        amount > 0
    );

ALTER TABLE financial_commitment
    ADD CONSTRAINT ck_financial_commitment_dates
    CHECK (
        end_date IS NULL
        OR end_date >= start_date
    );

ALTER TABLE financial_commitment
    ADD CONSTRAINT ck_financial_commitment_due_day
    CHECK (
        due_day IS NULL
        OR due_day BETWEEN 1 AND 31
    );

/*
 * Um compromisso pontual representa
 * exatamente uma data.
 */
ALTER TABLE financial_commitment
    ADD CONSTRAINT ck_financial_commitment_one_time
    CHECK (
        recurrence <> 'ONE_TIME'
        OR (
            end_date = start_date
            AND due_day IS NULL
        )
    );

/*
 * Somente receitas podem ser destinadas
 * a outra pessoa.
 */
ALTER TABLE financial_commitment
    ADD CONSTRAINT ck_financial_commitment_designated_direction
    CHECK (
        designated_recipient_party_id IS NULL
        OR direction = 'RECEIVABLE'
    );

ALTER TABLE financial_commitment
    ADD CONSTRAINT ck_financial_commitment_distinct_parties
    CHECK (
        designated_recipient_party_id IS NULL
        OR designated_recipient_party_id <> party_id
    );

/*
 * Protege a compatibilidade entre a
 * direção e o tipo do compromisso.
 */
ALTER TABLE financial_commitment
    ADD CONSTRAINT ck_financial_commitment_type_direction
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
                'SUPPLIER_PAYMENT',
                'SALARY',
                'SERVICE_PAYMENT',
                'REIMBURSEMENT',
                'OTHER'
            )
        )
    );