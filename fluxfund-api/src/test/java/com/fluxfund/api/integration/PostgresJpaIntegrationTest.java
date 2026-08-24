package com.fluxfund.api.integration;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PostgresJpaIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(
            "postgres:17-alpine");

    @DynamicPropertySource
    static void configureDatabase(
            DynamicPropertyRegistry registry) {

        registry.add(
                "spring.datasource.url",
                postgres::getJdbcUrl);

        registry.add(
                "spring.datasource.username",
                postgres::getUsername);

        registry.add(
                "spring.datasource.password",
                postgres::getPassword);
    }

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void shouldRunFlywayAndJpaAgainstIsolatedPostgres()
            throws Exception {

        assertThat(postgres.isRunning())
                .isTrue();

        String connectedUrl = dataSource
                .getConnection()
                .getMetaData()
                .getURL();

        assertThat(connectedUrl)
                .startsWith(
                        postgres.getJdbcUrl());

        Integer successfulMigrations = jdbcTemplate.queryForObject(
                """
                        select count(*)
                        from flyway_schema_history
                        where success = true
                        """,
                Integer.class);

        assertThat(successfulMigrations)
                .isNotNull()
                .isGreaterThanOrEqualTo(57);
    }
}