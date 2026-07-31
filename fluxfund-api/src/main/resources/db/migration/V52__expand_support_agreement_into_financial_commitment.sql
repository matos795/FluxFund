/*
 * Transforma a estrutura de compromissos de
 * sustento em uma base para compromissos
 * financeiros genéricos.
 *
 * A tabela e a coluna beneficiary_id são
 * preservadas temporariamente para não quebrar:
 *
 * - relatórios de sustento;
 * - sugestões atuais;
 * - frontend legado;
 * - Dossiê;
 * - consultas JPQL existentes.
 */

ALTER TABLE support_agreement
    ADD COLUMN direction VARCHAR(20);

ALTER TABLE support_agreement
    ADD COLUMN commitment_type VARCHAR(40);

ALTER TABLE support_agreement
    ADD COLUMN recurrence VARCHAR(20);

ALTER TABLE support_agreement
    ADD COLUMN due_day SMALLINT;

/*
 * Todos os registros existentes representam
 * compromissos mensais de sustento a pagar.
 */
UPDATE support_agreement
SET
    direction = 'PAYABLE',
    commitment_type = 'SUPPORT',
    recurrence = 'MONTHLY'
WHERE direction IS NULL
   OR commitment_type IS NULL
   OR recurrence IS NULL;

ALTER TABLE support_agreement
    ALTER COLUMN direction
    SET DEFAULT 'PAYABLE';

ALTER TABLE support_agreement
    ALTER COLUMN direction
    SET NOT NULL;

ALTER TABLE support_agreement
    ALTER COLUMN commitment_type
    SET DEFAULT 'SUPPORT';

ALTER TABLE support_agreement
    ALTER COLUMN commitment_type
    SET NOT NULL;

ALTER TABLE support_agreement
    ALTER COLUMN recurrence
    SET DEFAULT 'MONTHLY';

ALTER TABLE support_agreement
    ALTER COLUMN recurrence
    SET NOT NULL;

ALTER TABLE support_agreement
    ADD CONSTRAINT ck_support_agreement_direction
    CHECK (
        direction IN (
            'RECEIVABLE',
            'PAYABLE'
        )
    );

ALTER TABLE support_agreement
    ADD CONSTRAINT ck_support_agreement_commitment_type
    CHECK (
        commitment_type IN (
            'SUPPORT',
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

ALTER TABLE support_agreement
    ADD CONSTRAINT ck_support_agreement_recurrence
    CHECK (
        recurrence IN (
            'ONE_TIME',
            'MONTHLY'
        )
    );

ALTER TABLE support_agreement
    ADD CONSTRAINT ck_support_agreement_due_day
    CHECK (
        due_day IS NULL
        OR due_day BETWEEN 1 AND 31
    );

/*
 * Índice principal da futura tela de
 * compromissos financeiros.
 */
CREATE INDEX idx_support_agreement_commitment_filters
    ON support_agreement (
        organization_id,
        direction,
        commitment_type,
        active
    );

/*
 * Usado para buscar compromissos de um
 * contato e sugerir alocações.
 */
CREATE INDEX idx_support_agreement_party_direction
    ON support_agreement (
        organization_id,
        beneficiary_id,
        direction,
        active
    );

COMMENT ON COLUMN
    support_agreement.beneficiary_id
IS
    'Contato financeiro do compromisso; nome legado preservado temporariamente';

COMMENT ON COLUMN
    support_agreement.direction
IS
    'RECEIVABLE para valores a receber; PAYABLE para valores a pagar';

COMMENT ON COLUMN
    support_agreement.commitment_type
IS
    'Classificação funcional do compromisso financeiro';

COMMENT ON COLUMN
    support_agreement.recurrence
IS
    'ONE_TIME ou MONTHLY';

COMMENT ON COLUMN
    support_agreement.due_day
IS
    'Dia esperado para realização do compromisso, entre 1 e 31';