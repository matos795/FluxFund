CREATE TABLE app_user_password_reset (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL,

    token_hash VARCHAR(64) NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_app_user_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES app_user(id),

    CONSTRAINT uk_app_user_password_reset_token_hash
        UNIQUE (token_hash)
);

CREATE INDEX idx_app_user_password_reset_user
    ON app_user_password_reset(user_id);

CREATE INDEX idx_app_user_password_reset_expires_at
    ON app_user_password_reset(expires_at);