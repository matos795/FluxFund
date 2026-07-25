ALTER TABLE app_user
    ADD COLUMN platform_admin BOOLEAN NOT NULL
        DEFAULT FALSE;