ALTER TABLE app_user
    ADD COLUMN session_version INTEGER NOT NULL
        DEFAULT 0;