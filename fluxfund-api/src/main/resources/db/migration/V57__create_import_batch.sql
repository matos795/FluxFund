CREATE TABLE import_batch (

    id UUID PRIMARY KEY,

    organization_id UUID NOT NULL,

    account_id UUID NOT NULL,

    source_type VARCHAR(20) NOT NULL,

    import_profile VARCHAR(60),

    original_filename VARCHAR(255) NOT NULL,

    status VARCHAR(20) NOT NULL
        DEFAULT 'ACTIVE',

    imported_count INTEGER NOT NULL
        DEFAULT 0,

    ignored_duplicates_count INTEGER NOT NULL
        DEFAULT 0,

    failed_count INTEGER NOT NULL
        DEFAULT 0,

    imported_at TIMESTAMP NOT NULL,

    undone_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMP,

    CONSTRAINT fk_import_batch_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_import_batch_account
        FOREIGN KEY (account_id)
        REFERENCES account(id),

    CONSTRAINT ck_import_batch_source_type
        CHECK (
            source_type IN (
                'OFX',
                'CSV'
            )
        ),

    CONSTRAINT ck_import_batch_status
        CHECK (
            status IN (
                'ACTIVE',
                'UNDONE'
            )
        )
);


ALTER TABLE financial_transaction

ADD COLUMN import_batch_id UUID;


ALTER TABLE financial_transaction

ADD CONSTRAINT fk_financial_transaction_import_batch

FOREIGN KEY (import_batch_id)

REFERENCES import_batch(id);


CREATE INDEX idx_financial_transaction_import_batch

ON financial_transaction(import_batch_id);


CREATE INDEX idx_import_batch_organization_imported_at

ON import_batch(
    organization_id,
    imported_at DESC
);