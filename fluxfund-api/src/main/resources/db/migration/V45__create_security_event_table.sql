CREATE TABLE security_event (
    id UUID PRIMARY KEY,

    user_id UUID,

    email VARCHAR(255),

    event_type VARCHAR(80) NOT NULL,

    outcome VARCHAR(20) NOT NULL,

    ip_address VARCHAR(64),

    user_agent VARCHAR(500),

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ,

    CONSTRAINT fk_security_event_user
        FOREIGN KEY (user_id)
        REFERENCES app_user(id)
);

CREATE INDEX idx_security_event_created_at
    ON security_event(created_at DESC);

CREATE INDEX idx_security_event_user_created_at
    ON security_event(user_id, created_at DESC);

CREATE INDEX idx_security_event_email_created_at
    ON security_event(email, created_at DESC);

CREATE INDEX idx_security_event_type_outcome
    ON security_event(event_type, outcome);