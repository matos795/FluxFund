package com.fluxfund.api.domain.creditcardstatement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.category.CategoryType;
import com.fluxfund.api.domain.category.repository.CategoryRepository;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementPayment;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.dto.CreateCreditCardItemRequest;
import com.fluxfund.api.domain.creditcardstatement.dto.CreateCreditCardStatementRequest;
import com.fluxfund.api.domain.creditcardstatement.dto.PayCreditCardStatementRequest;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementPaymentRepository;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.financialtransaction.service.FinancialTransactionDocumentPolicyService;
import com.fluxfund.api.domain.financialtransaction.service.FinancialTransactionService;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;

@ExtendWith(MockitoExtension.class)
class CreditCardStatementServiceTest {

        @Mock
        private CreditCardStatementRepository statementRepository;

        @Mock
        private FinancialTransactionRepository financialTransactionRepository;

        @Mock
        private FinancialTransactionService financialTransactionService;

        @Mock
        private OrganizationRepository organizationRepository;

        @Mock
        private AccountRepository accountRepository;

        @Mock
        private CategoryRepository categoryRepository;

        @Mock
        private OrganizationAccessService organizationAccessService;

        @Mock
        private FinancialTransactionDocumentPolicyService documentPolicyService;

        @Mock
        private CreditCardStatementPaymentRepository paymentRepository;

        private CreditCardStatementService service;

        private CreditCardStatementCreditService creditService;

        @BeforeEach
        void setUp() {

                creditService = new CreditCardStatementCreditService(
                                statementRepository,
                                financialTransactionRepository,
                                paymentRepository);

                service = new CreditCardStatementService(
                                statementRepository,
                                financialTransactionRepository,
                                financialTransactionService,
                                organizationRepository,
                                accountRepository,
                                categoryRepository,
                                organizationAccessService,
                                documentPolicyService,
                                paymentRepository,
                                creditService);
        }

        @Test
        void shouldAllowPaymentGreaterThanOutstandingAmount() {

                // ARRANGE
                UUID organizationId = UUID.randomUUID();
                UUID statementId = UUID.randomUUID();
                UUID paymentAccountId = UUID.randomUUID();
                CreditCardStatement statement = mock(CreditCardStatement.class);

                UUID creditCardAccountId = UUID.randomUUID();

                Account creditCardAccount = mock(Account.class);

                when(creditCardAccount.getId()).thenReturn(creditCardAccountId);

                when(statement.getCreditCardAccount()).thenReturn(creditCardAccount);

                when(statement.getDueDate()).thenReturn(LocalDate.of(2026, 8, 20));

                when(statement.getId()).thenReturn(statementId);
                when(statement.getStatus()).thenReturn(CreditCardStatementStatus.CLOSED);
                when(statement.getPreviousBalanceAmount()).thenReturn(BigDecimal.ZERO);

                when(statementRepository
                                .findByIdAndOrganizationId(
                                                statementId,
                                                organizationId))
                                .thenReturn(Optional.of(statement));

                when(financialTransactionRepository.sumCreditCardStatementTotal(organizationId, statementId))
                                .thenReturn(new BigDecimal("1000.00"));

                when(paymentRepository.sumAmountByStatement(organizationId, statementId))
                                .thenReturn(BigDecimal.ZERO);

                Account paymentAccount = mock(Account.class);

                when(paymentAccount.getType()).thenReturn(AccountType.BANK);

                when(accountRepository
                                .findByIdAndOrganizationIdAndActiveTrue(paymentAccountId, organizationId))
                                .thenReturn(Optional.of(paymentAccount));

                when(financialTransactionRepository
                                .save(any(FinancialTransaction.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                PayCreditCardStatementRequest request = new PayCreditCardStatementRequest(
                                paymentAccountId,
                                LocalDate.of(2026, 8, 20),
                                new BigDecimal("1100.00"),
                                null);

                // ACT + ASSERT
                assertThatCode(() -> service.pay(organizationId, statementId, request))
                                .doesNotThrowAnyException();
        }

        @Test
        void shouldSplitOverpaymentIntoAppliedAmountAndAdvanceCredit() {

                // ARRANGE
                UUID organizationId = UUID.randomUUID();
                UUID statementId = UUID.randomUUID();
                UUID paymentAccountId = UUID.randomUUID();
                CreditCardStatement statement = mock(CreditCardStatement.class);

                UUID creditCardAccountId = UUID.randomUUID();

                Account creditCardAccount = mock(Account.class);

                when(creditCardAccount.getId()).thenReturn(creditCardAccountId);

                when(statement.getCreditCardAccount()).thenReturn(creditCardAccount);

                when(statement.getDueDate()).thenReturn(LocalDate.of(2026, 8, 20));

                when(statement.getId()).thenReturn(statementId);
                when(statement.getStatus()).thenReturn(CreditCardStatementStatus.CLOSED);
                when(statement.getPreviousBalanceAmount()).thenReturn(BigDecimal.ZERO);

                when(statementRepository
                                .findByIdAndOrganizationId(statementId, organizationId))
                                .thenReturn(Optional.of(statement));

                when(financialTransactionRepository
                                .sumCreditCardStatementTotal(organizationId, statementId))
                                .thenReturn(new BigDecimal("1000.00"));

                when(paymentRepository
                                .sumAmountByStatement(organizationId, statementId))
                                .thenReturn(BigDecimal.ZERO);

                Account paymentAccount = mock(Account.class);

                when(paymentAccount.getType()).thenReturn(AccountType.BANK);

                when(accountRepository
                                .findByIdAndOrganizationIdAndActiveTrue(paymentAccountId, organizationId))
                                .thenReturn(Optional.of(paymentAccount));

                when(financialTransactionRepository
                                .save(any(FinancialTransaction.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                PayCreditCardStatementRequest request = new PayCreditCardStatementRequest(
                                paymentAccountId,
                                LocalDate.of(2026, 8, 20),
                                new BigDecimal("1100.00"),
                                null);

                // ACT
                service.pay(organizationId, statementId, request);

                // ASSERT
                ArgumentCaptor<CreditCardStatementPayment> paymentCaptor = ArgumentCaptor
                                .forClass(CreditCardStatementPayment.class);

                verify(paymentRepository).save(paymentCaptor.capture());

                CreditCardStatementPayment savedPayment = paymentCaptor.getValue();

                assertThat(savedPayment.getAmount()).isEqualByComparingTo("1100.00");
                assertThat(savedPayment.getAppliedAmount()).isEqualByComparingTo("1000.00");
                assertThat(savedPayment.getAdvanceCreditAmount()).isEqualByComparingTo("100.00");
        }

        @Test
        void shouldUsePreviousCreditBeforeApplyingNewPayment() {

                // ARRANGE
                UUID organizationId = UUID.randomUUID();

                UUID statementId = UUID.randomUUID();

                UUID paymentAccountId = UUID.randomUUID();

                CreditCardStatement statement = mock(CreditCardStatement.class);

                UUID creditCardAccountId = UUID.randomUUID();

                Account creditCardAccount = mock(Account.class);

                when(creditCardAccount.getId()).thenReturn(creditCardAccountId);

                when(statement.getCreditCardAccount()).thenReturn(creditCardAccount);

                when(statement.getDueDate()).thenReturn(LocalDate.of(2026, 8, 20));

                when(statement.getId()).thenReturn(statementId);

                when(statement.getStatus()).thenReturn(CreditCardStatementStatus.CLOSED);

                when(statement.getPreviousBalanceAmount())
                                .thenReturn(BigDecimal.ZERO);

                when(statement.getPreviousCreditAmount())
                                .thenReturn(
                                                new BigDecimal("100.00"));

                when(statementRepository
                                .findByIdAndOrganizationId(
                                                statementId,
                                                organizationId))
                                .thenReturn(
                                                Optional.of(statement));

                when(financialTransactionRepository
                                .sumCreditCardStatementTotal(
                                                organizationId,
                                                statementId))
                                .thenReturn(
                                                new BigDecimal("800.00"));

                when(paymentRepository
                                .sumAmountByStatement(
                                                organizationId,
                                                statementId))
                                .thenReturn(BigDecimal.ZERO);

                Account paymentAccount = mock(Account.class);

                when(paymentAccount.getType())
                                .thenReturn(AccountType.BANK);

                when(accountRepository
                                .findByIdAndOrganizationIdAndActiveTrue(
                                                paymentAccountId,
                                                organizationId))
                                .thenReturn(
                                                Optional.of(paymentAccount));

                when(financialTransactionRepository
                                .save(any(FinancialTransaction.class)))
                                .thenAnswer(
                                                invocation -> invocation.getArgument(0));

                PayCreditCardStatementRequest request = new PayCreditCardStatementRequest(
                                paymentAccountId,
                                LocalDate.of(2026, 9, 20),
                                new BigDecimal("800.00"),
                                null);

                // ACT
                service.pay(
                                organizationId,
                                statementId,
                                request);

                // ASSERT
                ArgumentCaptor<CreditCardStatementPayment> paymentCaptor = ArgumentCaptor.forClass(
                                CreditCardStatementPayment.class);

                verify(paymentRepository)
                                .save(paymentCaptor.capture());

                CreditCardStatementPayment payment = paymentCaptor.getValue();

                assertThat(payment.getAmount()).isEqualByComparingTo("800.00");

                assertThat(payment.getAppliedAmount()).isEqualByComparingTo("700.00");

                assertThat(payment.getAdvanceCreditAmount()).isEqualByComparingTo("100.00");
        }

        @Test
        void shouldCarryAdvanceCreditToNextStatement() {

                // ARRANGE
                UUID organizationId = UUID.randomUUID();
                UUID statementId = UUID.randomUUID();
                UUID paymentAccountId = UUID.randomUUID();
                UUID creditCardAccountId = UUID.randomUUID();
                UUID nextStatementId = UUID.randomUUID();

                Account creditCardAccount = mock(Account.class);

                when(creditCardAccount.getId()).thenReturn(creditCardAccountId);

                CreditCardStatement statement = mock(CreditCardStatement.class);

                when(statement.getId()).thenReturn(statementId);

                when(statement.getStatus()).thenReturn(CreditCardStatementStatus.CLOSED);

                when(statement.getCreditCardAccount()).thenReturn(creditCardAccount);

                when(statement.getDueDate())
                                .thenReturn(LocalDate.of(2026, 8, 20));

                when(statement.getPreviousBalanceAmount()).thenReturn(BigDecimal.ZERO);

                when(statement.getPreviousCreditAmount()).thenReturn(BigDecimal.ZERO);

                when(statementRepository
                                .findByIdAndOrganizationId(
                                                statementId,
                                                organizationId))
                                .thenReturn(Optional.of(statement));

                when(financialTransactionRepository
                                .sumCreditCardStatementTotal(
                                                organizationId,
                                                statementId))
                                .thenReturn(new BigDecimal("1000.00"));

                when(paymentRepository
                                .sumAmountByStatement(
                                                organizationId,
                                                statementId))
                                .thenReturn(BigDecimal.ZERO);

                Account paymentAccount = mock(Account.class);

                when(paymentAccount.getType()).thenReturn(AccountType.BANK);

                when(accountRepository
                                .findByIdAndOrganizationIdAndActiveTrue(
                                                paymentAccountId,
                                                organizationId))
                                .thenReturn(Optional.of(paymentAccount));

                when(financialTransactionRepository
                                .save(any(FinancialTransaction.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                CreditCardStatement nextStatement = new CreditCardStatement();
                nextStatement.setId(nextStatementId);
                nextStatement.setDueDate(LocalDate.of(2026, 9, 20));
                nextStatement.setPreviousCreditAmount(BigDecimal.ZERO);

                when(statementRepository
                                .findAllByOrganizationIdAndCreditCardAccountIdAndDueDateAfterAndStatusNotOrderByDueDateAsc(
                                                organizationId,
                                                creditCardAccountId,
                                                LocalDate.of(2026, 8, 20),
                                                CreditCardStatementStatus.CANCELED))
                                .thenReturn(List.of(nextStatement));

                when(financialTransactionRepository
                                .sumCreditCardStatementTotal(organizationId, nextStatementId))
                                .thenReturn(BigDecimal.ZERO);

                when(paymentRepository
                                .sumAmountByStatement(organizationId, nextStatementId))
                                .thenReturn(BigDecimal.ZERO);

                PayCreditCardStatementRequest request = new PayCreditCardStatementRequest(
                                paymentAccountId,
                                LocalDate.of(2026, 8, 20),
                                new BigDecimal("1100.00"), null);

                // ACT
                service.pay(organizationId, statementId, request);

                // ASSERT
                assertThat(nextStatement.getPreviousCreditAmount()).isEqualByComparingTo("100.00");
        }

        @Test
        void shouldCarryAvailableCreditWhenNextStatementIsCreatedLater() {

                // ARRANGE
                UUID organizationId = UUID.randomUUID();

                UUID creditCardAccountId = UUID.randomUUID();

                UUID previousStatementId = UUID.randomUUID();

                UUID newStatementId = UUID.randomUUID();

                Organization organization = new Organization();

                organization.setId(organizationId);

                organization.setName("Organização Teste");

                Account creditCardAccount = new Account();

                creditCardAccount.setId(creditCardAccountId);

                creditCardAccount.setOrganization(organization);

                creditCardAccount.setName("Cartão Teste");

                creditCardAccount.setType(AccountType.CREDIT_CARD);

                creditCardAccount.setInitialBalance(BigDecimal.ZERO);

                creditCardAccount.setActive(true);

                CreditCardStatement previousStatement = new CreditCardStatement();

                previousStatement.setId(
                                previousStatementId);

                previousStatement.setOrganization(
                                organization);

                previousStatement.setCreditCardAccount(
                                creditCardAccount);

                previousStatement.setName(
                                "Fatura Agosto 2026");

                previousStatement.setClosingDate(
                                LocalDate.of(
                                                2026,
                                                8,
                                                15));

                previousStatement.setDueDate(
                                LocalDate.of(
                                                2026,
                                                8,
                                                20));

                previousStatement.setStatus(
                                CreditCardStatementStatus.PAID);

                previousStatement.setPreviousBalanceAmount(
                                BigDecimal.ZERO);

                previousStatement.setPreviousCreditAmount(
                                BigDecimal.ZERO);

                when(organizationRepository
                                .findById(
                                                organizationId))
                                .thenReturn(
                                                Optional.of(
                                                                organization));

                when(accountRepository
                                .findByIdAndOrganizationIdAndActiveTrue(
                                                creditCardAccountId,
                                                organizationId))
                                .thenReturn(
                                                Optional.of(
                                                                creditCardAccount));

                /*
                 * Ainda é lenient porque o código de
                 * produção não faz essa busca.
                 *
                 * Queremos justamente que o teste
                 * vermelho force essa implementação.
                 */
                lenient().when(statementRepository
                                .findFirstByOrganizationIdAndCreditCardAccountIdAndDueDateBeforeAndStatusNotOrderByDueDateDesc(
                                                organizationId,
                                                creditCardAccountId,
                                                LocalDate.of(
                                                                2026,
                                                                9,
                                                                20),
                                                CreditCardStatementStatus.CANCELED))
                                .thenReturn(
                                                Optional.of(
                                                                previousStatement));

                /*
                 * Agosto:
                 *
                 * dívida = 1000
                 * pagamentos = 1100
                 *
                 * portanto:
                 *
                 * crédito disponível = 100
                 */
                lenient().when(financialTransactionRepository
                                .sumCreditCardStatementTotal(
                                                organizationId,
                                                previousStatementId))
                                .thenReturn(
                                                new BigDecimal(
                                                                "1000.00"));

                lenient().when(paymentRepository
                                .sumAmountByStatement(
                                                organizationId,
                                                previousStatementId))
                                .thenReturn(
                                                new BigDecimal(
                                                                "1100.00"));

                /*
                 * Simula o save da nova fatura.
                 */
                when(statementRepository
                                .save(any(CreditCardStatement.class)))
                                .thenAnswer(invocation -> {

                                        CreditCardStatement saved = invocation.getArgument(0);

                                        if (saved.getId() == null) {
                                                saved.setId(
                                                                newStatementId);
                                        }

                                        return saved;
                                });

                /*
                 * O create() gera o response da nova
                 * fatura depois de salvá-la.
                 */
                when(financialTransactionRepository
                                .sumCreditCardStatementTotal(
                                                organizationId,
                                                newStatementId))
                                .thenReturn(
                                                BigDecimal.ZERO);

                when(paymentRepository
                                .sumAmountByStatement(
                                                organizationId,
                                                newStatementId))
                                .thenReturn(
                                                BigDecimal.ZERO);

                CreateCreditCardStatementRequest request = new CreateCreditCardStatementRequest(
                                creditCardAccountId,
                                "Fatura Setembro 2026",
                                LocalDate.of(
                                                2026,
                                                9,
                                                15),
                                LocalDate.of(
                                                2026,
                                                9,
                                                20));

                // ACT
                service.create(
                                organizationId,
                                request);

                // ASSERT
                ArgumentCaptor<CreditCardStatement> statementCaptor = ArgumentCaptor.forClass(
                                CreditCardStatement.class);

                verify(statementRepository)
                                .save(
                                                statementCaptor.capture());

                CreditCardStatement createdStatement = statementCaptor.getValue();

                assertThat(
                                createdStatement
                                                .getPreviousCreditAmount())
                                .isEqualByComparingTo(
                                                "100.00");
        }

        @Test
        void shouldCarryCreditAcrossMissingStatementMonths() {

                // ARRANGE
                UUID organizationId = UUID.randomUUID();
                UUID creditCardAccountId = UUID.randomUUID();
                UUID aprilStatementId = UUID.randomUUID();
                UUID juneStatementId = UUID.randomUUID();

                Organization organization = new Organization();
                organization.setId(organizationId);
                organization.setName("Organização Teste");

                Account creditCardAccount = new Account();
                creditCardAccount.setId(creditCardAccountId);
                creditCardAccount.setOrganization(organization);
                creditCardAccount.setName("Cartão Teste");
                creditCardAccount.setType(AccountType.CREDIT_CARD);
                creditCardAccount.setInitialBalance(BigDecimal.ZERO);
                creditCardAccount.setActive(true);

                CreditCardStatement aprilStatement = new CreditCardStatement();
                aprilStatement.setId(aprilStatementId);
                aprilStatement.setOrganization(organization);
                aprilStatement.setCreditCardAccount(creditCardAccount);
                aprilStatement.setName("Fatura Abril 2026");
                aprilStatement.setClosingDate(LocalDate.of(2026, 4, 15));
                aprilStatement.setDueDate(LocalDate.of(2026, 4, 20));
                aprilStatement.setStatus(CreditCardStatementStatus.PAID);
                aprilStatement.setPreviousBalanceAmount(BigDecimal.ZERO);
                aprilStatement.setPreviousCreditAmount(BigDecimal.ZERO);

                when(organizationRepository
                                .findById(organizationId))
                                .thenReturn(Optional.of(organization));

                when(accountRepository
                                .findByIdAndOrganizationIdAndActiveTrue(creditCardAccountId, organizationId))
                                .thenReturn(Optional.of(creditCardAccount));

                when(statementRepository
                                .findFirstByOrganizationIdAndCreditCardAccountIdAndDueDateBeforeAndStatusNotOrderByDueDateDesc(
                                                organizationId,
                                                creditCardAccountId,
                                                LocalDate.of(2026, 6, 20),
                                                CreditCardStatementStatus.CANCELED))
                                .thenReturn(Optional.of(aprilStatement));

                when(financialTransactionRepository
                                .sumCreditCardStatementTotal(organizationId, aprilStatementId))
                                .thenReturn(new BigDecimal("1000.00"));

                when(paymentRepository
                                .sumAmountByStatement(organizationId, aprilStatementId))
                                .thenReturn(new BigDecimal("1100.00"));

                when(statementRepository
                                .save(any(CreditCardStatement.class)))
                                .thenAnswer(invocation -> {

                                        CreditCardStatement saved = invocation.getArgument(0);

                                        if (saved.getId() == null) {
                                                saved.setId(juneStatementId);
                                        }

                                        return saved;
                                });

                when(financialTransactionRepository
                                .sumCreditCardStatementTotal(organizationId, juneStatementId))
                                .thenReturn(BigDecimal.ZERO);

                when(paymentRepository
                                .sumAmountByStatement(organizationId, juneStatementId))
                                .thenReturn(BigDecimal.ZERO);

                CreateCreditCardStatementRequest request = new CreateCreditCardStatementRequest(
                                creditCardAccountId,
                                "Fatura Junho 2026",
                                LocalDate.of(2026, 6, 15),
                                LocalDate.of(2026, 6, 20));

                // ACT
                service.create(organizationId, request);

                // ASSERT
                ArgumentCaptor<CreditCardStatement> statementCaptor = ArgumentCaptor
                                .forClass(CreditCardStatement.class);

                verify(statementRepository).save(statementCaptor.capture());

                CreditCardStatement juneStatement = statementCaptor.getValue();

                assertThat(juneStatement.getPreviousCreditAmount())
                                .isEqualByComparingTo("100.00");
        }

        @Test
        void shouldCarryOnlyRemainingCreditAfterPreviousStatementUsesPartOfIt() {

                // GIVEN
                UUID organizationId = UUID.randomUUID();
                UUID creditCardAccountId = UUID.randomUUID();
                UUID mayStatementId = UUID.randomUUID();
                UUID juneStatementId = UUID.randomUUID();

                Organization organization = new Organization();
                organization.setId(organizationId);
                organization.setName("Organização Teste");

                Account creditCardAccount = new Account();
                creditCardAccount.setId(creditCardAccountId);
                creditCardAccount.setOrganization(organization);
                creditCardAccount.setName("Cartão Teste");
                creditCardAccount.setType(AccountType.CREDIT_CARD);
                creditCardAccount.setInitialBalance(BigDecimal.ZERO);
                creditCardAccount.setActive(true);

                CreditCardStatement mayStatement = new CreditCardStatement();
                mayStatement.setId(mayStatementId);
                mayStatement.setOrganization(organization);
                mayStatement.setCreditCardAccount(creditCardAccount);
                mayStatement.setName("Fatura Maio 2026");
                mayStatement.setClosingDate(LocalDate.of(2026, 5, 15));
                mayStatement.setDueDate(LocalDate.of(2026, 5, 20));
                mayStatement.setStatus(CreditCardStatementStatus.CLOSED);
                mayStatement.setPreviousCreditAmount(new BigDecimal("300.00"));
                mayStatement.setPreviousBalanceAmount(BigDecimal.ZERO);

                when(organizationRepository
                                .findById(organizationId))
                                .thenReturn(Optional.of(organization));

                when(accountRepository
                                .findByIdAndOrganizationIdAndActiveTrue(creditCardAccountId, organizationId))
                                .thenReturn(Optional.of(creditCardAccount));

                when(statementRepository
                                .findFirstByOrganizationIdAndCreditCardAccountIdAndDueDateBeforeAndStatusNotOrderByDueDateDesc(
                                                organizationId,
                                                creditCardAccountId,
                                                LocalDate.of(2026, 6, 20),
                                                CreditCardStatementStatus.CANCELED))
                                .thenReturn(Optional.of(mayStatement));

                when(financialTransactionRepository
                                .sumCreditCardStatementTotal(organizationId, mayStatementId))
                                .thenReturn(new BigDecimal("200.00"));

                when(paymentRepository
                                .sumAmountByStatement(organizationId, mayStatementId))
                                .thenReturn(BigDecimal.ZERO);

                when(statementRepository
                                .save(any(CreditCardStatement.class)))
                                .thenAnswer(invocation -> {

                                        CreditCardStatement saved = invocation.getArgument(0);

                                        if (saved.getId() == null) {
                                                saved.setId(juneStatementId);
                                        }
                                        return saved;
                                });

                when(financialTransactionRepository
                                .sumCreditCardStatementTotal(organizationId, juneStatementId))
                                .thenReturn(BigDecimal.ZERO);

                when(paymentRepository
                                .sumAmountByStatement(organizationId, juneStatementId))
                                .thenReturn(BigDecimal.ZERO);

                CreateCreditCardStatementRequest request = new CreateCreditCardStatementRequest(
                                creditCardAccountId,
                                "Fatura Junho 2026",
                                LocalDate.of(2026, 6, 15),
                                LocalDate.of(2026, 6, 20));

                // WHEN
                service.create(organizationId, request);

                // THEN
                ArgumentCaptor<CreditCardStatement> statementCaptor = ArgumentCaptor.forClass(
                                CreditCardStatement.class);

                verify(statementRepository).save(statementCaptor.capture());

                CreditCardStatement juneStatement = statementCaptor.getValue();

                assertThat(juneStatement
                                .getPreviousCreditAmount())
                                .isEqualByComparingTo("100.00");
        }

        @Test
        void shouldRecalculateFutureCreditWhenRetroactiveStatementConsumesCredit() {

                // GIVEN
                UUID organizationId = UUID.randomUUID();
                UUID creditCardAccountId = UUID.randomUUID();
                UUID mayStatementId = UUID.randomUUID();
                UUID juneStatementId = UUID.randomUUID();
                UUID categoryId = UUID.randomUUID();
                UUID transactionId = UUID.randomUUID();

                Organization organization = new Organization();
                organization.setId(organizationId);
                organization.setName("Organização Teste");

                Account creditCardAccount = new Account();
                creditCardAccount.setId(creditCardAccountId);
                creditCardAccount.setOrganization(organization);
                creditCardAccount.setName("Cartão Teste");
                creditCardAccount.setType(AccountType.CREDIT_CARD);
                creditCardAccount.setInitialBalance(BigDecimal.ZERO);
                creditCardAccount.setActive(true);

                CreditCardStatement mayStatement = new CreditCardStatement();
                mayStatement.setId(mayStatementId);
                mayStatement.setOrganization(organization);
                mayStatement.setCreditCardAccount(creditCardAccount);
                mayStatement.setName("Fatura Maio 2026");
                mayStatement.setClosingDate(LocalDate.of(2026, 5, 15));
                mayStatement.setDueDate(LocalDate.of(2026, 5, 20));
                mayStatement.setStatus(CreditCardStatementStatus.CLOSED);
                mayStatement.setPreviousBalanceAmount(BigDecimal.ZERO);
                mayStatement.setPreviousCreditAmount(new BigDecimal("300.00"));

                CreditCardStatement juneStatement = new CreditCardStatement();
                juneStatement.setId(juneStatementId);
                juneStatement.setOrganization(organization);
                juneStatement.setCreditCardAccount(creditCardAccount);
                juneStatement.setName("Fatura Junho 2026");
                juneStatement.setClosingDate(LocalDate.of(2026, 6, 15));
                juneStatement.setDueDate(LocalDate.of(2026, 6, 20));
                juneStatement.setStatus(CreditCardStatementStatus.OPEN);
                juneStatement.setPreviousBalanceAmount(BigDecimal.ZERO);
                juneStatement.setPreviousCreditAmount(new BigDecimal("300.00"));

                Category category = new Category();
                category.setId(categoryId);
                category.setOrganization(organization);
                category.setName("Alimentação");
                category.setType(CategoryType.EXPENSE);
                category.setActive(true);

                when(statementRepository
                                .findByIdAndOrganizationId(mayStatementId, organizationId))
                                .thenReturn(Optional.of(mayStatement));

                when(categoryRepository
                                .findByIdAndOrganizationIdAndActiveTrue(categoryId, organizationId))
                                .thenReturn(Optional.of(category));

                AtomicReference<FinancialTransaction> savedTransaction = new AtomicReference<>();

                when(financialTransactionRepository
                                .save(any(FinancialTransaction.class)))
                                .thenAnswer(invocation -> {
                                        FinancialTransaction transaction = invocation.getArgument(0);
                                        transaction.setId(transactionId);
                                        savedTransaction.set(transaction);
                                        return transaction;
                                });

                when(financialTransactionRepository
                                .findByIdAndOrganizationId(
                                                transactionId,
                                                organizationId))
                                .thenAnswer(invocation -> Optional.of(
                                                savedTransaction.get()));

                lenient().when(financialTransactionRepository
                                .sumCreditCardStatementTotal(organizationId, mayStatementId))
                                .thenReturn(new BigDecimal("80.00"));

                lenient().when(paymentRepository
                                .sumAmountByStatement(organizationId, mayStatementId))
                                .thenReturn(BigDecimal.ZERO);

                lenient().when(statementRepository
                                .findAllByOrganizationIdAndCreditCardAccountIdAndDueDateAfterAndStatusNotOrderByDueDateAsc(
                                                organizationId,
                                                creditCardAccountId,
                                                LocalDate.of(2026, 5, 20),
                                                CreditCardStatementStatus.CANCELED))
                                .thenReturn(List.of(juneStatement));

                lenient().when(financialTransactionRepository
                                .sumCreditCardStatementTotal(organizationId, juneStatementId))
                                .thenReturn(BigDecimal.ZERO);

                lenient().when(paymentRepository
                                .sumAmountByStatement(organizationId, juneStatementId))
                                .thenReturn(BigDecimal.ZERO);

                CreateCreditCardItemRequest request = new CreateCreditCardItemRequest(
                                LocalDate.of(2026, 5, 10),
                                "Compra retroativa",
                                new BigDecimal("80.00"),
                                categoryId,
                                null,
                                null,
                                null,
                                null,
                                null,
                                List.of());

                // WHEN
                service.addItem(organizationId, mayStatementId, request);

                // THEN
                assertThat(juneStatement
                                .getPreviousCreditAmount())
                                .isEqualByComparingTo("220.00");
        }
}