package com.fluxfund.api.domain.creditcardstatement.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

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
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementPayment;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.organization.Organization;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CreditCardStatementPaymentRepositoryIntegrationTest {

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
    private TestEntityManager entityManager;

    @Autowired
    private CreditCardStatementPaymentRepository repository;

    @Test
    void shouldPersistValidPaymentBreakdown() {

        // ARRANGE
        Organization organization = createOrganization();

        Account creditCardAccount = createCreditCardAccount(
                organization);

        CreditCardStatement statement = createStatement(
                organization,
                creditCardAccount);

        CreditCardStatementPayment payment = createPayment(
                organization,
                statement,
                "1100.00",
                "1000.00",
                "100.00");

        // ACT
        CreditCardStatementPayment saved = repository.saveAndFlush(
                payment);

        // ASSERT
        assertThat(saved.getAmount())
                .isEqualByComparingTo(
                        "1100.00");

        assertThat(saved.getAppliedAmount())
                .isEqualByComparingTo(
                        "1000.00");

        assertThat(saved.getAdvanceCreditAmount())
                .isEqualByComparingTo(
                        "100.00");
    }

    @Test
    void shouldRejectPaymentBreakdownThatDoesNotMatchAmount() {

        // ARRANGE
        Organization organization = createOrganization();

        Account creditCardAccount = createCreditCardAccount(
                organization);

        CreditCardStatement statement = createStatement(
                organization,
                creditCardAccount);

        CreditCardStatementPayment payment = createPayment(
                organization,
                statement,
                "1100.00",
                "1000.00",
                "50.00");

        // ACT
        Throwable thrown = catchThrowable(
                () -> repository
                        .saveAndFlush(
                                payment));

        // ASSERT
        assertThat(thrown)
                .isNotNull();

        assertThat(
                rootCause(thrown)
                        .getMessage())
                .contains(
                        "chk_credit_card_statement_payment_breakdown");
    }

    private Organization createOrganization() {

        Organization organization = new Organization();

        organization.setName(
                "Organização Teste");

        entityManager.persist(
                organization);

        return organization;
    }

    private Account createCreditCardAccount(
            Organization organization) {

        Account account = new Account();

        account.setOrganization(
                organization);

        account.setName(
                "Cartão Teste");

        account.setType(
                AccountType.CREDIT_CARD);

        account.setInitialBalance(
                BigDecimal.ZERO);

        account.setActive(
                true);

        entityManager.persist(
                account);

        return account;
    }

    private CreditCardStatement createStatement(
            Organization organization,
            Account creditCardAccount) {

        CreditCardStatement statement = new CreditCardStatement();

        statement.setOrganization(
                organization);

        statement.setCreditCardAccount(
                creditCardAccount);

        statement.setName(
                "Fatura Agosto 2026");

        statement.setClosingDate(
                LocalDate.of(
                        2026,
                        8,
                        15));

        statement.setDueDate(
                LocalDate.of(
                        2026,
                        8,
                        20));

        statement.setStatus(
                CreditCardStatementStatus.CLOSED);

        statement.setPreviousBalanceAmount(
                BigDecimal.ZERO);

        entityManager.persist(
                statement);

        return statement;
    }

    private CreditCardStatementPayment createPayment(
            Organization organization,
            CreditCardStatement statement,
            String amount,
            String appliedAmount,
            String advanceCreditAmount) {

        CreditCardStatementPayment payment = new CreditCardStatementPayment();

        payment.setOrganization(
                organization);

        payment.setStatement(
                statement);

        payment.setPaymentDate(
                LocalDate.of(
                        2026,
                        8,
                        20));

        payment.setAmount(
                new BigDecimal(amount));

        payment.setAppliedAmount(
                new BigDecimal(
                        appliedAmount));

        payment.setAdvanceCreditAmount(
                new BigDecimal(
                        advanceCreditAmount));

        /*
         * A constraint existente exige que
         * pagamentos sem transação bancária
         * tenham origem identificável.
         */
        payment.setStatementExternalId(
                "PAYMENT-TEST");

        return payment;
    }

    private Throwable rootCause(
            Throwable throwable) {

        Throwable current = throwable;

        while (current.getCause() != null) {
            current = current.getCause();
        }

        return current;
    }
}