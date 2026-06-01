CREATE TABLE audit_log (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    actor_user_id UUID NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(80) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,

    CONSTRAINT fk_audit_log_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(id),

    CONSTRAINT fk_audit_log_actor_user
        FOREIGN KEY (actor_user_id)
        REFERENCES app_user(id)
);

CREATE INDEX idx_audit_log_organization_created_at
    ON audit_log (organization_id, created_at DESC);

CREATE INDEX idx_audit_log_entity
    ON audit_log (entity_type, entity_id);

CREATE INDEX idx_audit_log_actor_user
    ON audit_log (actor_user_id);

CREATE INDEX idx_audit_log_action
    ON audit_log (action);