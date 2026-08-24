package com.fluxfund.api.integration;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
class PostgresContainerTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(
            "postgres:17-alpine");

    @Test
    void shouldStartIsolatedPostgres() {

        assertThat(postgres.isRunning())
                .isTrue();

        assertThat(postgres.getJdbcUrl())
                .startsWith(
                        "jdbc:postgresql://");

        assertThat(postgres.getDatabaseName())
                .isNotBlank();

        assertThat(postgres.getUsername())
                .isNotBlank();
    }
}