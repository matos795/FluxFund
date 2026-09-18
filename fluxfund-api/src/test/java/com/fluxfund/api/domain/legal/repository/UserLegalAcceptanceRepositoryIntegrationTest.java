package com.fluxfund.api.domain.legal.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.fluxfund.api.domain.legal.UserLegalAcceptance;
import com.fluxfund.api.domain.user.AppUser;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserLegalAcceptanceRepositoryIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {

        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserLegalAcceptanceRepository repository;

    @Test
    void shouldPersistLegalAcceptanceAndFindCurrentVersions() {

        AppUser user = new AppUser();

        user.setName("Usuário Teste");
        user.setEmail("legal-test@fluxfund.test");
        user.setPasswordHash("hash");
        user.setActive(true);

        entityManager.persist(user);

        UserLegalAcceptance acceptance = new UserLegalAcceptance();
        acceptance.setUser(user);
        acceptance.setTermsVersion("2026-09");
        acceptance.setTermsHash("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" + "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        acceptance.setPrivacyNoticeVersion("2026-09");
        acceptance.setPrivacyNoticeHash("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" + "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        acceptance.setAcceptedAt(OffsetDateTime.now());

        repository.save(acceptance);

        entityManager.flush();
        entityManager.clear();

        boolean accepted = repository
                .existsByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHash(
                        user.getId(),
                        "2026-09",
                        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" + "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                        "2026-09",
                        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" + "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
                );

        assertThat(accepted).isTrue();

        assertThat(repository.findAllByUser_IdOrderByAcceptedAtDesc(user.getId())).hasSize(1);
    }
}