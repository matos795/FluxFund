/*
 * Evolui o cadastro legado de favorecidos para representar
 * contatos financeiros, preservando a tabela, os UUIDs
 * e todas as chaves estrangeiras atuais.
 */

ALTER TABLE beneficiary
    ADD COLUMN party_type VARCHAR(30),
    ADD COLUMN legal_name VARCHAR(255),
    ADD COLUMN contact_person VARCHAR(255),
    ADD COLUMN address_line VARCHAR(255),
    ADD COLUMN address_number VARCHAR(50),
    ADD COLUMN address_complement VARCHAR(255),
    ADD COLUMN neighborhood VARCHAR(255),
    ADD COLUMN city VARCHAR(255),
    ADD COLUMN state VARCHAR(2),
    ADD COLUMN zip_code VARCHAR(8),
    ADD COLUMN notes TEXT;

/*
 * Beneficiários antigos não possuíam natureza de pessoa.
 *
 * Documentos com 14 dígitos são inicialmente tratados
 * como pessoa jurídica. Os demais começam como pessoa física
 * e poderão ser revisados posteriormente.
 */
UPDATE beneficiary
SET party_type =
    CASE
        WHEN document IS NOT NULL
         AND length(
                regexp_replace(
                    document,
                    '[^0-9]',
                    '',
                    'g'
                )
             ) = 14
        THEN 'LEGAL_ENTITY'

        ELSE 'INDIVIDUAL'
    END
WHERE party_type IS NULL;

ALTER TABLE beneficiary
    ALTER COLUMN party_type
        SET DEFAULT 'INDIVIDUAL';

ALTER TABLE beneficiary
    ALTER COLUMN party_type
        SET NOT NULL;

ALTER TABLE beneficiary
    ADD CONSTRAINT ck_beneficiary_party_type
    CHECK (
        party_type IN (
            'INDIVIDUAL',
            'LEGAL_ENTITY'
        )
    );

/*
 * Contatos financeiros podem ter nomes iguais.
 *
 * Exemplo:
 * dois contatos diferentes chamados José da Silva.
 *
 * O documento, quando preenchido, continua único
 * dentro da organização.
 */
ALTER TABLE beneficiary
    DROP CONSTRAINT IF EXISTS
        uq_beneficiary_name_per_organization;

ALTER TABLE beneficiary
    DROP CONSTRAINT IF EXISTS
        uk_beneficiary_organization_name;

/*
 * Papéis financeiros ficam em uma coleção separada.
 *
 * Um contato poderá ser:
 * - origem de receita;
 * - recebedor de pagamento;
 * - ambos.
 */
CREATE TABLE beneficiary_role (
    beneficiary_id UUID NOT NULL,
    role VARCHAR(40) NOT NULL,

    CONSTRAINT pk_beneficiary_role
        PRIMARY KEY (
            beneficiary_id,
            role
        ),

    CONSTRAINT fk_beneficiary_role_beneficiary
        FOREIGN KEY (beneficiary_id)
        REFERENCES beneficiary(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_beneficiary_role
        CHECK (
            role IN (
                'INCOME_SOURCE',
                'PAYMENT_RECIPIENT'
            )
        )
);

INSERT INTO beneficiary_role (
    beneficiary_id,
    role
)
SELECT
    id,
    'PAYMENT_RECIPIENT'
FROM beneficiary;

CREATE INDEX idx_beneficiary_organization_active_name
    ON beneficiary (
        organization_id,
        active,
        name
    );

CREATE INDEX idx_beneficiary_party_type
    ON beneficiary (
        organization_id,
        party_type
    );

CREATE INDEX idx_beneficiary_role_role
    ON beneficiary_role (
        role,
        beneficiary_id
    );
