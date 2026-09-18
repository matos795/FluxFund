CREATE TABLE user_legal_acceptance (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL,

    terms_version VARCHAR(50) NOT NULL,
    terms_hash VARCHAR(64) NOT NULL,

    privacy_notice_version VARCHAR(50) NOT NULL,
    privacy_notice_hash VARCHAR(64) NOT NULL,

    accepted_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,

    CONSTRAINT fk_user_legal_acceptance_user
        FOREIGN KEY (user_id)
        REFERENCES app_user(id),

    CONSTRAINT uk_user_legal_acceptance_versions
        UNIQUE (
            user_id,
            terms_version,
            privacy_notice_version
        )
);

CREATE INDEX idx_user_legal_acceptance_user
    ON user_legal_acceptance(user_id);