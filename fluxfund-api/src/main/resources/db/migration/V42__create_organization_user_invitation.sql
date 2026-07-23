CREATE TABLE organization_user_invitation (
    id UUID PRIMARY KEY,

    organization_id UUID NOT NULL,
    invited_by_user_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,

    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,

    accepted_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,

    CONSTRAINT fk_invitation_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization (id),

    CONSTRAINT fk_invitation_invited_by
        FOREIGN KEY (invited_by_user_id)
        REFERENCES app_user (id),

    CONSTRAINT ck_invitation_role
        CHECK (
            role IN (
                'ADMIN',
                'FINANCE',
                'VIEWER'
            )
        )
);

CREATE UNIQUE INDEX uk_invitation_token_hash
    ON organization_user_invitation (token_hash);

CREATE INDEX idx_invitation_organization
    ON organization_user_invitation (
        organization_id,
        created_at DESC
    );

/*
 * Apenas um convite pendente por e-mail
 * dentro da mesma organização.
 */
CREATE UNIQUE INDEX uk_pending_invitation_email
    ON organization_user_invitation (
        organization_id,
        LOWER(email)
    )
    WHERE accepted_at IS NULL
      AND canceled_at IS NULL;