package com.fluxfund.api.domain.financialtransaction.repository;

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
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.TechnicalMovementType;
import com.fluxfund.api.domain.organization.Organization;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class FinancialTransactionRepositoryIntegrationTest {

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
        private FinancialTransactionRepository repository;

        @Test
        void shouldExcludeTechnicalMovementsFromEconomicMetricsButKeepBankMovement() {

                Organization organization = createOrganization();

                Account account = createAccount(organization);

                createTransaction(
                                organization,
                                account,
                                FinancialTransactionType.INCOME,
                                "100.00",
                                false);

                createTransaction(
                                organization,
                                account,
                                FinancialTransactionType.EXPENSE,
                                "40.00",
                                false);

                createTransaction(
                                organization,
                                account,
                                FinancialTransactionType.INCOME,
                                "50.00",
                                true);

                createTransaction(
                                organization,
                                account,
                                FinancialTransactionType.EXPENSE,
                                "50.00",
                                true);

                entityManager.flush();
                entityManager.clear();

                LocalDate startDate = LocalDate.of(2026, 8, 1);

                LocalDate endDate = LocalDate.of(2026, 8, 31);

                BigDecimal income = repository.sumSettledAmountByTypeAndPeriod(
                                organization.getId(),
                                FinancialTransactionStatus.SETTLED,
                                FinancialTransactionType.INCOME,
                                startDate,
                                endDate);

                BigDecimal expense = repository.sumSettledAmountByTypeAndPeriod(
                                organization.getId(),
                                FinancialTransactionStatus.SETTLED,
                                FinancialTransactionType.EXPENSE,
                                startDate,
                                endDate);

                long unclassified = repository.countUnclassifiedByOrganizationId(
                                organization.getId(),
                                FinancialTransactionStatus.CANCELED,
                                FinancialTransactionType.TRANSFER);

                long dashboardTransactionCount = repository.countByOrganizationIdAndReportDateBetween(
                                organization.getId(),
                                FinancialTransactionStatus.CANCELED,
                                startDate,
                                endDate);

                var bankMovements = repository.findSettledAccountMovementReportTransactions(
                                organization.getId(),
                                account.getId(),
                                startDate,
                                endDate);

                assertThat(income).isEqualByComparingTo("100.00");
                assertThat(expense).isEqualByComparingTo("40.00");
                assertThat(unclassified).isEqualTo(2);
                assertThat(dashboardTransactionCount).isEqualTo(2);
                assertThat(bankMovements).hasSize(4);
        }

        private Organization createOrganization() {

                Organization organization = new Organization();
                organization.setName("Organização Teste");

                entityManager.persist(organization);

                return organization;
        }

        private Account createAccount(Organization organization) {

                Account account = new Account();
                account.setOrganization(organization);
                account.setName("Nubank");
                account.setType(AccountType.BANK);
                account.setInitialBalance(BigDecimal.ZERO);
                account.setInitialBalanceDate(LocalDate.of(2026, 8, 1));
                account.setActive(true);

                entityManager.persist(account);

                return account;
        }

        private void createTransaction(
                        Organization organization,
                        Account account,
                        FinancialTransactionType type,
                        String amount,
                        boolean technical) {

                FinancialTransaction transaction = new FinancialTransaction();
                transaction.setOrganization(organization);
                transaction.setAccount(account);
                transaction.setType(type);
                transaction.setSource(FinancialTransactionSource.OFX);
                transaction.setStatus(FinancialTransactionStatus.SETTLED);
                transaction.setSettlementDate(LocalDate.of(2026, 8, 18));
                transaction.setExpectedAmount(new BigDecimal(amount));
                transaction.setSettledAmount(new BigDecimal(amount));
                transaction.setInterestAmount(BigDecimal.ZERO);
                transaction.setDiscountAmount(BigDecimal.ZERO);
                transaction.setDescription(
                                technical
                                                ? "Movimento técnico"
                                                : "Movimento normal");

                if (technical) {
                        transaction.markAsTechnicalMovement(TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);
                }

                entityManager.persist(transaction);
        }
}