package com.fluxfund.api.domain.creditcardstatement.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.organization.Organization;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CreditCardStatementRepositoryIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>(
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
    private TestEntityManager entityManager;

    @Autowired
    private CreditCardStatementRepository repository;

    @Test
    void shouldIsolateStatementCreditChainByOrganizationAndCreditCard() {

        // GIVEN
        Organization organizationA =
                createOrganization(
                        "Organização A");

        Organization organizationB =
                createOrganization(
                        "Organização B");

        Account nubankA =
                createCreditCardAccount(
                        organizationA,
                        "Nubank");

        Account bradescoA =
                createCreditCardAccount(
                        organizationA,
                        "Bradesco");

        Account nubankB =
                createCreditCardAccount(
                        organizationB,
                        "Nubank");

        CreditCardStatement mayNubankA =
                createStatement(
                        organizationA,
                        nubankA,
                        "Nubank Maio",
                        LocalDate.of(
                                2026,
                                5,
                                20));

        CreditCardStatement juneNubankA =
                createStatement(
                        organizationA,
                        nubankA,
                        "Nubank Junho",
                        LocalDate.of(
                                2026,
                                6,
                                20));

        createStatement(
                organizationA,
                bradescoA,
                "Bradesco Junho",
                LocalDate.of(
                        2026,
                        6,
                        20));

        createStatement(
                organizationB,
                nubankB,
                "Nubank B Junho",
                LocalDate.of(
                        2026,
                        6,
                        20));

        entityManager.flush();
        entityManager.clear();

        // WHEN
        var futureStatements =
                repository
                        .findAllByOrganizationIdAndCreditCardAccountIdAndDueDateAfterAndStatusNotOrderByDueDateAsc(
                                organizationA.getId(),
                                nubankA.getId(),
                                LocalDate.of(
                                        2026,
                                        5,
                                        20),
                                CreditCardStatementStatus.CANCELED);

        var previousStatement =
                repository
                        .findFirstByOrganizationIdAndCreditCardAccountIdAndDueDateBeforeAndStatusNotOrderByDueDateDesc(
                                organizationA.getId(),
                                nubankA.getId(),
                                LocalDate.of(
                                        2026,
                                        6,
                                        20),
                                CreditCardStatementStatus.CANCELED);

        var wrongOrganization =
                repository
                        .findAllByOrganizationIdAndCreditCardAccountIdAndDueDateAfterAndStatusNotOrderByDueDateAsc(
                                organizationB.getId(),
                                nubankA.getId(),
                                LocalDate.of(
                                        2026,
                                        5,
                                        20),
                                CreditCardStatementStatus.CANCELED);

        // THEN
        assertThat(futureStatements)
                .extracting(
                        CreditCardStatement::getId)
                .containsExactly(
                        juneNubankA.getId());

        assertThat(previousStatement)
                .isPresent()
                .get()
                .extracting(
                        CreditCardStatement::getId)
                .isEqualTo(
                        mayNubankA.getId());

        assertThat(wrongOrganization)
                .isEmpty();
    }

    private Organization createOrganization(String name) {

        Organization organization = new Organization();

        organization.setName(name);

        entityManager.persist(organization);

        return organization;
    }

    private Account createCreditCardAccount(
            Organization organization,
            String name) {

        Account account = new Account();

        account.setOrganization(organization);

        account.setName(name);

        account.setType(AccountType.CREDIT_CARD);

        account.setInitialBalance(BigDecimal.ZERO);

        account.setActive(true);

        entityManager.persist(account);

        return account;
    }

    private CreditCardStatement createStatement(
            Organization organization,
            Account account,
            String name,
            LocalDate dueDate) {

        CreditCardStatement statement = new CreditCardStatement();

        statement.setOrganization(organization);

        statement.setCreditCardAccount(account);

        statement.setName(name);

        statement.setClosingDate(dueDate.minusDays(5));

        statement.setDueDate(dueDate);

        statement.setStatus(CreditCardStatementStatus.OPEN);

        statement.setPreviousBalanceAmount(BigDecimal.ZERO);

        statement.setPreviousCreditAmount(BigDecimal.ZERO);

        entityManager.persist(statement);

        return statement;
    }
}