package com.fluxfund.api.domain.fund.repository;

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
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.transactionallocation.TransactionAllocation;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(
        replace = AutoConfigureTestDatabase.Replace.NONE)
class FundRepositoryIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:17-alpine");

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
    private FundRepository repository;

    @Test
    void shouldIgnoreTechnicalAllocationsInFundBalances() {

        Organization organization = createOrganization();

        Account account = createAccount(organization);

        Fund fund = createFund(organization);

        createAllocation(
                organization,
                account,
                fund,
                FinancialTransactionType.INCOME,
                new BigDecimal("100.00"),
                false);

        createAllocation(
                organization,
                account,
                fund,
                FinancialTransactionType.EXPENSE,
                new BigDecimal("500.00"),
                true);

        entityManager.flush();
        entityManager.clear();

        var overview =
                repository.findFundsOverview(
                        organization.getId(),
                        LocalDate.of(2026, 8, 1),
                        LocalDate.of(2026, 8, 31),
                        10);

        assertThat(overview).hasSize(1);

        var item = overview.getFirst();

        assertThat(item.getCurrentMovement()).isEqualByComparingTo("100.00");
        assertThat(item.getIncomeAllocated()).isEqualByComparingTo("100.00");
        assertThat(item.getExpenseAllocated()).isZero();
        assertThat(repository.countNegativeFunds(organization.getId())).isZero();
        assertThat(repository.findNegativeFundActionItems(organization.getId(), 10)).isEmpty();
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
        account.setName("Conta Teste");
        account.setType(AccountType.BANK);
        account.setInitialBalance(BigDecimal.ZERO);
        account.setActive(true);

        entityManager.persist(account);

        return account;
    }

    private Fund createFund(Organization organization) {

        Fund fund = new Fund();
        fund.setOrganization(organization);
        fund.setName("Fundo Teste");
        fund.setInitialBalance(BigDecimal.ZERO);
        fund.setActive(true);
        entityManager.persist(fund);

        return fund;
    }

    private void createAllocation(
            Organization organization,
            Account account,
            Fund fund,
            FinancialTransactionType type,
            BigDecimal amount,
            boolean technical) {

        FinancialTransaction transaction = new FinancialTransaction();
        transaction.setOrganization(organization);
        transaction.setAccount(account);
        transaction.setSource(FinancialTransactionSource.OFX);
        transaction.setStatus(FinancialTransactionStatus.SETTLED);
        transaction.setType(type);
        transaction.setSettlementDate(LocalDate.of(2026, 8, 18));
        transaction.setExpectedAmount(amount);
        transaction.setSettledAmount(amount);
        transaction.setInterestAmount(BigDecimal.ZERO);
        transaction.setDiscountAmount(BigDecimal.ZERO);
        transaction.setDescription(
                technical
                        ? "Movimento técnico legado"
                        : "Movimento econômico");

        if (technical) {
            transaction.markAsTechnicalMovement(TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);
        }

        entityManager.persist(transaction);

        TransactionAllocation allocation = new TransactionAllocation();

        allocation.setOrganization(organization);

        allocation.setFinancialTransaction(transaction);

        allocation.setFund(fund);

        allocation.setAmount(
                type == FinancialTransactionType.EXPENSE
                        ? amount.negate()
                        : amount);

        entityManager.persist(allocation);
    }
}