package com.fluxfund.api.domain.transactionallocation.repository;

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
import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.BeneficiaryType;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.TransferDirection;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.transactionallocation.TransactionAllocation;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TransactionAllocationRepositoryIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(
            "postgres:17-alpine");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {

        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TransactionAllocationRepository repository;

    @Test
    void shouldAggregateSettledIncomeBySourceParty() {

        // ARRANGE
        Organization organization = createOrganization("Organização Teste");

        Account account = createAccount(organization);

        Fund fund = createFund(organization);

        Beneficiary joao = createParty(organization, "João", BeneficiaryType.DONOR);

        Beneficiary maria = createParty(organization, "Maria", BeneficiaryType.DONOR);

        createIncomeAllocation(
                organization,
                account,
                fund,
                joao,
                new BigDecimal("1000.17"),
                LocalDate.of(2026, 8, 10));

        createIncomeAllocation(
                organization,
                account,
                fund,
                maria,
                new BigDecimal("750.32"),
                LocalDate.of(2026, 8, 15));

        entityManager.flush();
        entityManager.clear();

        // ACT
        var result = repository.findFinancialRelationshipIncomeSources(
                organization.getId(),
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2026, 8, 31));

        // ASSERT
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getPartyName()).isEqualTo("João");
        assertThat(result.get(0).getTotalAmount()).isEqualByComparingTo("1000.17");
        assertThat(result.get(1).getPartyName()).isEqualTo("Maria");
        assertThat(result.get(1).getTotalAmount()).isEqualByComparingTo("750.32");
    }

    @Test
    void shouldIgnoreIncomeThatDoesNotBelongToRelationshipReport() {

        // ARRANGE
        Organization organizationA = createOrganization(
                "Organização A");

        Account accountA = createAccount(
                organizationA);

        Fund fundA = createFund(
                organizationA);

        Beneficiary joao = createParty(
                organizationA,
                "João",
                BeneficiaryType.DONOR);

        createIncomeAllocation(
                organizationA,
                accountA,
                fundA,
                joao,
                new BigDecimal("1000.17"),
                LocalDate.of(2026, 8, 10),
                FinancialTransactionStatus.SETTLED);

        createIncomeAllocation(
                organizationA,
                accountA,
                fundA,
                joao,
                new BigDecimal("5000.00"),
                LocalDate.of(2026, 8, 11),
                FinancialTransactionStatus.PENDING);

        createIncomeAllocation(
                organizationA,
                accountA,
                fundA,
                joao,
                new BigDecimal("8000.00"),
                LocalDate.of(2026, 8, 12),
                FinancialTransactionStatus.CANCELED);

        createIncomeAllocation(
                organizationA,
                accountA,
                fundA,
                joao,
                new BigDecimal("10000.00"),
                LocalDate.of(2026, 7, 31),
                FinancialTransactionStatus.SETTLED);

        Organization organizationB = createOrganization(
                "Organização B");

        Account accountB = createAccount(
                organizationB);

        Fund fundB = createFund(
                organizationB);

        Beneficiary intruso = createParty(
                organizationB,
                "Intruso",
                BeneficiaryType.DONOR);

        createIncomeAllocation(
                organizationB,
                accountB,
                fundB,
                intruso,
                new BigDecimal("999999.99"),
                LocalDate.of(2026, 8, 10),
                FinancialTransactionStatus.SETTLED);

        entityManager.flush();
        entityManager.clear();

        // ACT
        var result = repository
                .findFinancialRelationshipIncomeSources(
                        organizationA.getId(),
                        LocalDate.of(2026, 8, 1),
                        LocalDate.of(2026, 8, 31));

        // ASSERT
        assertThat(result)
                .hasSize(1);

        var joaoResult = result.getFirst();

        assertThat(
                joaoResult.getPartyName())
                .isEqualTo(
                        "João");

        assertThat(
                joaoResult.getTotalAmount())
                .isEqualByComparingTo(
                        "1000.17");

        assertThat(
                joaoResult.getAllocationCount())
                .isEqualTo(1L);
    }

    @Test
    void shouldOnlyAggregateSettledExpensesForCorrectOrganizationAndPeriod() {

        // ARRANGE
        Organization organizationA = createOrganization(
                "Organização A");

        Account accountA = createAccount(
                organizationA);

        Fund fundA = createFund(
                organizationA);

        Beneficiary fornecedor = createParty(
                organizationA,
                "Fornecedor A",
                BeneficiaryType.SUPPLIER);

        createPaymentAllocation(
                organizationA,
                accountA,
                fundA,
                fornecedor,
                new BigDecimal("420.11"),
                LocalDate.of(2026, 8, 10),
                FinancialTransactionStatus.SETTLED,
                FinancialTransactionType.EXPENSE);

        createPaymentAllocation(
                organizationA,
                accountA,
                fundA,
                fornecedor,
                new BigDecimal("5000.00"),
                LocalDate.of(2026, 8, 11),
                FinancialTransactionStatus.PENDING,
                FinancialTransactionType.EXPENSE);

        createPaymentAllocation(
                organizationA,
                accountA,
                fundA,
                fornecedor,
                new BigDecimal("8000.00"),
                LocalDate.of(2026, 8, 12),
                FinancialTransactionStatus.CANCELED,
                FinancialTransactionType.EXPENSE);

        createPaymentAllocation(
                organizationA,
                accountA,
                fundA,
                fornecedor,
                new BigDecimal("10000.00"),
                LocalDate.of(2026, 7, 31),
                FinancialTransactionStatus.SETTLED,
                FinancialTransactionType.EXPENSE);

        createPaymentAllocation(
                organizationA,
                accountA,
                fundA,
                fornecedor,
                new BigDecimal("50000.00"),
                LocalDate.of(2026, 8, 15),
                FinancialTransactionStatus.SETTLED,
                FinancialTransactionType.TRANSFER);

        Organization organizationB = createOrganization(
                "Organização B");

        Account accountB = createAccount(
                organizationB);

        Fund fundB = createFund(
                organizationB);

        Beneficiary intruso = createParty(
                organizationB,
                "Fornecedor Intruso",
                BeneficiaryType.SUPPLIER);

        createPaymentAllocation(
                organizationB,
                accountB,
                fundB,
                intruso,
                new BigDecimal("999999.99"),
                LocalDate.of(2026, 8, 10),
                FinancialTransactionStatus.SETTLED,
                FinancialTransactionType.EXPENSE);

        entityManager.flush();
        entityManager.clear();

        // ACT
        var result = repository
                .findFinancialRelationshipPaymentRecipients(
                        organizationA.getId(),
                        LocalDate.of(2026, 8, 1),
                        LocalDate.of(2026, 8, 31));

        // ASSERT
        assertThat(result)
                .hasSize(1);

        var fornecedorResult = result.getFirst();

        assertThat(
                fornecedorResult.getPartyName())
                .isEqualTo(
                        "Fornecedor A");

        assertThat(
                fornecedorResult.getTotalAmount())
                .isEqualByComparingTo(
                        "420.11");

        assertThat(
                fornecedorResult.getAllocationCount())
                .isEqualTo(1L);
    }

    @Test
    void shouldAggregateIncomeByMonthAndReconcileWithRelationshipTotal() {

        // ARRANGE
        Organization organization = createOrganization(
                "Organização Teste");

        Account account = createAccount(
                organization);

        Fund fund = createFund(
                organization);

        Beneficiary joao = createParty(
                organization,
                "João",
                BeneficiaryType.DONOR);

        Beneficiary maria = createParty(
                organization,
                "Maria",
                BeneficiaryType.DONOR);

        // João - agosto
        createIncomeAllocation(
                organization,
                account,
                fund,
                joao,
                new BigDecimal("1000.17"),
                LocalDate.of(2026, 8, 10));

        createIncomeAllocation(
                organization,
                account,
                fund,
                joao,
                new BigDecimal("249.83"),
                LocalDate.of(2026, 8, 20));

        // Maria - agosto
        createIncomeAllocation(
                organization,
                account,
                fund,
                maria,
                new BigDecimal("750.32"),
                LocalDate.of(2026, 8, 15));

        // João - setembro
        createIncomeAllocation(
                organization,
                account,
                fund,
                joao,
                new BigDecimal("300.50"),
                LocalDate.of(2026, 9, 5));

        entityManager.flush();
        entityManager.clear();

        // ACT
        var monthly = repository
                .findFinancialRelationshipMonthlyIncomeSources(
                        organization.getId(),
                        LocalDate.of(2026, 8, 1),
                        LocalDate.of(2026, 9, 30));

        var ranking = repository
                .findFinancialRelationshipIncomeSources(
                        organization.getId(),
                        LocalDate.of(2026, 8, 1),
                        LocalDate.of(2026, 9, 30));

        // ASSERT
        assertThat(monthly)
                .hasSize(3);

        var joaoAugust = monthly.stream()
                .filter(item -> item.getPartyName().equals("João")
                        && item.getSettlementYear() == 2026
                        && item.getSettlementMonth() == 8)
                .findFirst()
                .orElseThrow();

        var mariaAugust = monthly.stream()
                .filter(item -> item.getPartyName().equals("Maria")
                        && item.getSettlementYear() == 2026
                        && item.getSettlementMonth() == 8)
                .findFirst()
                .orElseThrow();

        var joaoSeptember = monthly.stream()
                .filter(item -> item.getPartyName().equals("João")
                        && item.getSettlementYear() == 2026
                        && item.getSettlementMonth() == 9)
                .findFirst()
                .orElseThrow();

        assertThat(
                joaoAugust.getTotalAmount())
                .isEqualByComparingTo(
                        "1250.00");

        assertThat(
                mariaAugust.getTotalAmount())
                .isEqualByComparingTo(
                        "750.32");

        assertThat(
                joaoSeptember.getTotalAmount())
                .isEqualByComparingTo(
                        "300.50");

        BigDecimal monthlyTotal = monthly.stream()
                .map(item -> item.getTotalAmount())
                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add);

        BigDecimal rankingTotal = ranking.stream()
                .map(item -> item.getTotalAmount())
                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add);

        assertThat(monthlyTotal)
                .isEqualByComparingTo(
                        rankingTotal);
    }

    private Organization createOrganization(String name) {

        Organization organization = new Organization();
        organization.setName(name);
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

    private Beneficiary createParty(Organization organization, String name, BeneficiaryType type) {

        Beneficiary party = new Beneficiary();
        party.setOrganization(organization);
        party.setName(name);
        party.setType(type);
        party.setActive(true);
        entityManager.persist(party);

        return party;
    }

    private void createIncomeAllocation(
            Organization organization,
            Account account,
            Fund fund,
            Beneficiary sourceParty,
            BigDecimal amount,
            LocalDate settlementDate) {

        createIncomeAllocation(
                organization,
                account,
                fund,
                sourceParty,
                amount,
                settlementDate,
                FinancialTransactionStatus.SETTLED);
    }

    private void createIncomeAllocation(
            Organization organization,
            Account account,
            Fund fund,
            Beneficiary sourceParty,
            BigDecimal amount,
            LocalDate settlementDate,
            FinancialTransactionStatus status) {

        FinancialTransaction transaction = new FinancialTransaction();

        transaction.setOrganization(
                organization);

        transaction.setAccount(
                account);

        transaction.setSource(
                FinancialTransactionSource.MANUAL);

        transaction.setStatus(
                status);

        transaction.setType(
                FinancialTransactionType.INCOME);

        transaction.setSettlementDate(
                settlementDate);

        transaction.setExpectedAmount(
                amount);

        transaction.setSettledAmount(
                amount);

        transaction.setInterestAmount(
                BigDecimal.ZERO);

        transaction.setDiscountAmount(
                BigDecimal.ZERO);

        transaction.setDescription(
                "Receita de teste");

        entityManager.persist(
                transaction);

        TransactionAllocation allocation = new TransactionAllocation();

        allocation.setOrganization(
                organization);

        allocation.setFinancialTransaction(
                transaction);

        allocation.setFund(
                fund);

        allocation.setSourceParty(
                sourceParty);

        allocation.setAmount(
                amount);

        entityManager.persist(
                allocation);
    }

    private void createPaymentAllocation(
            Organization organization,
            Account account,
            Fund fund,
            Beneficiary beneficiary,
            BigDecimal amount,
            LocalDate settlementDate,
            FinancialTransactionStatus status,
            FinancialTransactionType type) {

        FinancialTransaction transaction = new FinancialTransaction();

        transaction.setOrganization(
                organization);

        transaction.setAccount(
                account);

        transaction.setSource(
                FinancialTransactionSource.MANUAL);

        transaction.setStatus(
                status);

        transaction.setType(
                type);

        if (type == FinancialTransactionType.TRANSFER) {
            transaction.setTransferDirection(
                    TransferDirection.OUT);
        }

        transaction.setSettlementDate(
                settlementDate);

        transaction.setExpectedAmount(
                amount);

        transaction.setSettledAmount(
                amount);

        transaction.setInterestAmount(
                BigDecimal.ZERO);

        transaction.setDiscountAmount(
                BigDecimal.ZERO);

        transaction.setDescription(
                "Pagamento de teste");

        entityManager.persist(
                transaction);

        TransactionAllocation allocation = new TransactionAllocation();

        allocation.setOrganization(
                organization);

        allocation.setFinancialTransaction(
                transaction);

        allocation.setFund(
                fund);

        allocation.setBeneficiary(
                beneficiary);

        allocation.setAmount(
                amount.negate());

        entityManager.persist(
                allocation);
    }
}