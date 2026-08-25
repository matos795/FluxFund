package com.fluxfund.api.domain.account.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

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
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.TransferDirection;
import com.fluxfund.api.domain.organization.Organization;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class AccountRepositoryIntegrationTest {

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
    private AccountRepository repository;

    @Test
    void shouldMoveMoneyBetweenAccountsWithoutChangingOrganizationTotal() {

        // ARRANGE
        Organization organization = createOrganization("Organização Teste");

        Account bradesco = createAccount(organization, "Bradesco", "1000.00");

        Account sicredi = createAccount(organization, "Sicredi", "500.00");

        UUID transferGroupId = UUID.randomUUID();

        createTransfer(
                organization,
                bradesco,
                sicredi,
                transferGroupId,
                TransferDirection.OUT,
                new BigDecimal("300.00"),
                LocalDate.of(2026, 8, 10));

        createTransfer(
                organization,
                sicredi,
                bradesco,
                transferGroupId,
                TransferDirection.IN,
                new BigDecimal("300.00"),
                LocalDate.of(2026, 8, 10));

        entityManager.flush();
        entityManager.clear();

        // ACT
        var result = repository.findAccountCashFlowReport(
                organization.getId(),
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2026, 8, 31));

        var bradescoResult = result.stream().filter(item -> item.getAccountId().equals(bradesco.getId()))
                .findFirst()
                .orElseThrow();

        var sicrediResult = result.stream().filter(item -> item.getAccountId().equals(sicredi.getId()))
                .findFirst()
                .orElseThrow();

        // ASSERT - BRADESCO
        assertThat(bradescoResult.getIncomeAmount()).isEqualByComparingTo("0.00");
        assertThat(bradescoResult.getExpenseAmount()).isEqualByComparingTo("0.00");
        assertThat(bradescoResult.getTransferInAmount()).isEqualByComparingTo("0.00");
        assertThat(bradescoResult.getTransferOutAmount()).isEqualByComparingTo("300.00");
        assertThat(bradescoResult.getTransferNetAmount()).isEqualByComparingTo("-300.00");

        // ASSERT - SICREDI
        assertThat(sicrediResult.getIncomeAmount()).isEqualByComparingTo("0.00");
        assertThat(sicrediResult.getExpenseAmount()).isEqualByComparingTo("0.00");
        assertThat(sicrediResult.getTransferInAmount()).isEqualByComparingTo("300.00");
        assertThat(sicrediResult.getTransferOutAmount()).isEqualByComparingTo("0.00");
        assertThat(sicrediResult.getTransferNetAmount()).isEqualByComparingTo("300.00");

        // INVARIANTE
        BigDecimal organizationTransferNet = bradescoResult.getTransferNetAmount()
                .add(sicrediResult.getTransferNetAmount());
        assertThat(organizationTransferNet).isEqualByComparingTo("0.00");
    }

    @Test
    void shouldOnlyMoveBankCashWhenCreditCardStatementIsPaid() {

        // ARRANGE
        Organization organization = createOrganization(
                "Organização Teste");

        Account bankAccount = createAccount(
                organization,
                "Bradesco",
                "1000.00");

        Account creditCardAccount = createCreditCardAccount(
                organization,
                "Cartão Bradesco");

        CreditCardStatement statement = createCreditCardStatement(
                organization,
                creditCardAccount);

        createCreditCardPurchase(
                organization,
                creditCardAccount,
                statement,
                new BigDecimal("600.00"),
                LocalDate.of(2026, 8, 5));

        /*
         * Pagamento da fatura:
         *
         * banco -> cartão
         *
         * No modelo atual isso é apenas a
         * perna OUT da conta bancária.
         */
        createTransfer(
                organization,
                bankAccount,
                creditCardAccount,
                UUID.randomUUID(),
                TransferDirection.OUT,
                new BigDecimal("600.00"),
                LocalDate.of(2026, 8, 20));

        entityManager.flush();
        entityManager.clear();

        // ACT
        var result = repository.findAccountCashFlowReport(
                organization.getId(),
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2026, 8, 31));

        // ASSERT
        assertThat(result)
                .hasSize(1);

        var bankResult = result.getFirst();

        assertThat(
                bankResult.getAccountId())
                .isEqualTo(
                        bankAccount.getId());

        assertThat(
                bankResult.getIncomeAmount())
                .isEqualByComparingTo(
                        "0.00");

        assertThat(
                bankResult.getExpenseAmount())
                .isEqualByComparingTo(
                        "0.00");

        assertThat(
                bankResult.getTransferInAmount())
                .isEqualByComparingTo(
                        "0.00");

        assertThat(
                bankResult.getTransferOutAmount())
                .isEqualByComparingTo(
                        "600.00");

        assertThat(
                bankResult.getTransferNetAmount())
                .isEqualByComparingTo(
                        "-600.00");

        assertThat(
                bankResult.getTransactionCount())
                .isEqualTo(1L);
    }

    private Organization createOrganization(String name) {

        Organization organization = new Organization();
        organization.setName(name);
        entityManager.persist(organization);

        return organization;
    }

    private Account createAccount(Organization organization, String name, String initialBalance) {

        Account account = new Account();
        account.setOrganization(organization);
        account.setName(name);
        account.setType(AccountType.BANK);
        account.setInitialBalance(new BigDecimal(initialBalance));
        account.setInitialBalanceDate(LocalDate.of(2026, 8, 1));
        account.setActive(true);
        entityManager.persist(account);

        return account;
    }

    private void createTransfer(
            Organization organization,
            Account account,
            Account counterpartyAccount,
            UUID transferGroupId,
            TransferDirection direction,
            BigDecimal amount,
            LocalDate settlementDate) {

        FinancialTransaction transaction = new FinancialTransaction();
        transaction.setOrganization(organization);
        transaction.setAccount(account);
        transaction.setSource(FinancialTransactionSource.MANUAL);
        transaction.setStatus(FinancialTransactionStatus.SETTLED);
        transaction.setType(FinancialTransactionType.TRANSFER);
        transaction.setTransferDirection(direction);
        transaction.setTransferGroupId(transferGroupId);
        transaction.setTransferCounterpartyAccount(counterpartyAccount);
        transaction.setSettlementDate(settlementDate);
        transaction.setExpectedAmount(amount);
        transaction.setSettledAmount(amount);
        transaction.setInterestAmount(BigDecimal.ZERO);
        transaction.setDiscountAmount(BigDecimal.ZERO);
        transaction.setDescription("Transferência de teste");

        entityManager.persist(transaction);
    }

    private Account createCreditCardAccount(
            Organization organization,
            String name) {

        Account account = new Account();

        account.setOrganization(
                organization);

        account.setName(
                name);

        account.setType(
                AccountType.CREDIT_CARD);

        account.setInitialBalance(
                BigDecimal.ZERO);

        account.setActive(true);

        entityManager.persist(
                account);

        return account;
    }

    private CreditCardStatement createCreditCardStatement(
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

    private void createCreditCardPurchase(
            Organization organization,
            Account creditCardAccount,
            CreditCardStatement statement,
            BigDecimal amount,
            LocalDate purchaseDate) {

        FinancialTransaction transaction = new FinancialTransaction();

        transaction.setOrganization(
                organization);

        transaction.setAccount(
                creditCardAccount);

        transaction.setCreditCardStatement(
                statement);

        transaction.setSource(
                FinancialTransactionSource.CREDIT_CARD);

        transaction.setStatus(
                FinancialTransactionStatus.SETTLED);

        transaction.setType(
                FinancialTransactionType.EXPENSE);

        transaction.setPurchaseDate(
                purchaseDate);

        transaction.setSettlementDate(
                purchaseDate);

        transaction.setDueDate(
                statement.getDueDate());

        transaction.setExpectedAmount(
                amount);

        transaction.setSettledAmount(
                amount);

        transaction.setInterestAmount(
                BigDecimal.ZERO);

        transaction.setDiscountAmount(
                BigDecimal.ZERO);

        transaction.setDescription(
                "Compra no cartão");

        entityManager.persist(
                transaction);
    }
}