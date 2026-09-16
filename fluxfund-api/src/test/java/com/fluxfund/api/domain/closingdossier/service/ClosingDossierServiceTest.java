package com.fluxfund.api.domain.closingdossier.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.attachment.repository.AttachmentRepository;
import com.fluxfund.api.domain.bankstatementdocument.repository.BankStatementDocumentRepository;
import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.category.CategoryType;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewRequest;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.FiscalDocumentPolicy;
import com.fluxfund.api.domain.financialtransaction.TechnicalMovementType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.organizationsettings.repository.OrganizationSettingsRepository;
import com.fluxfund.api.security.OrganizationAccessService;

@ExtendWith(MockitoExtension.class)
class ClosingDossierServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationSettingsRepository organizationSettingsRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private BankStatementDocumentRepository bankStatementDocumentRepository;

    @Mock
    private CreditCardStatementRepository creditCardStatementRepository;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @InjectMocks
    private ClosingDossierService service;

    @Test
    void shouldKeepTechnicalMovementAsBankMovementButExcludeItFromEconomicMetricsAndIssues() {

        UUID organizationId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID transactionId = UUID.randomUUID();

        LocalDate startDate = LocalDate.of(2026, 8, 1);
        LocalDate endDate = LocalDate.of(2026, 8, 31);

        Organization organization = new Organization();
        organization.setId(organizationId);
        organization.setName("Organização Teste");

        Account account = new Account();
        account.setId(accountId);
        account.setOrganization(organization);
        account.setName("Nubank");
        account.setType(AccountType.BANK);
        account.setActive(true);

        Category category = new Category();
        category.setId(UUID.randomUUID());
        category.setOrganization(organization);
        category.setName("Despesa antiga");
        category.setType(CategoryType.EXPENSE);
        category.setRequiresPaymentProof(true);
        category.setRequiresFiscalDocument(true);

        FinancialTransaction transaction = new FinancialTransaction();
        transaction.setId(transactionId);
        transaction.setOrganization(organization);
        transaction.setAccount(account);
        transaction.setCategory(category);
        transaction.setSource(FinancialTransactionSource.OFX);
        transaction.setStatus(FinancialTransactionStatus.SETTLED);
        transaction.setType(FinancialTransactionType.EXPENSE);
        transaction.setSettlementDate(LocalDate.of(2026, 8, 18));
        transaction.setExpectedAmount(new BigDecimal("50.00"));
        transaction.setSettledAmount(new BigDecimal("50.00"));
        transaction.setInterestAmount(BigDecimal.ZERO);
        transaction.setDiscountAmount(BigDecimal.ZERO);
        transaction.setFiscalDocumentPolicy(FiscalDocumentPolicy.REQUIRED);
        transaction.setDescription("Movimento técnico legado");
        transaction.markAsTechnicalMovement(TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);

        ClosingDossierPreviewRequest request =
                new ClosingDossierPreviewRequest(
                        startDate,
                        endDate,
                        List.of(accountId),
                        false,
                        false,
                        true,
                        false,
                        false,
                        false,
                        false,
                        false);

        when(organizationRepository
                .findByIdAndActiveTrue(organizationId))
                .thenReturn(Optional.of(organization));

        when(accountRepository
                .findAllByIdInAndOrganizationIdAndActiveTrue(
                        List.of(accountId),
                        organizationId))
                .thenReturn(List.of(account));

        when(financialTransactionRepository
                .findSettledForClosingDossier(
                        organizationId,
                        List.of(accountId),
                        startDate,
                        endDate,
                        List.of(FinancialTransactionType.EXPENSE)))
                .thenReturn(List.of(transaction));

        when(creditCardStatementRepository
                .findForClosingDossierByItemPeriod(
                        organizationId,
                        startDate,
                        endDate,
                        CreditCardStatementStatus.CANCELED,
                        FinancialTransactionStatus.CANCELED))
                .thenReturn(List.of());

        when(creditCardStatementRepository
                .findPaidForClosingDossier(
                        organizationId,
                        CreditCardStatementStatus.PAID,
                        List.of(transactionId)))
                .thenReturn(List.of());

        when(attachmentRepository
                .findAllByTransactionIdsForExport(
                        organizationId,
                        List.of(transactionId)))
                .thenReturn(List.of());

        when(bankStatementDocumentRepository
                .findAllForAccountsAndOverlappingPeriod(
                        organizationId,
                        List.of(accountId),
                        startDate,
                        endDate))
                .thenReturn(List.of());

        when(organizationSettingsRepository
                .findByOrganizationId(organizationId))
                .thenReturn(Optional.empty());

        var response = service.preview(organizationId, request);

        var accountPreview = response.accounts().getFirst();

        // EXISTE no banco
        assertThat(accountPreview.hasMovement()).isTrue();
        assertThat(accountPreview.transactionCount()).isEqualTo(1L);
        assertThat(accountPreview.requiresBankStatement()).isTrue();

        // NÃO existe economicamente
        assertThat(accountPreview.incomeTotal()).isZero();
        assertThat(accountPreview.expenseTotal()).isZero();
        assertThat(accountPreview.transferTotal()).isZero();

        // NÃO cria burocracia
        assertThat(accountPreview.paymentProofIssues()).isEmpty();
        assertThat(accountPreview.fiscalDocumentIssues()).isEmpty();
        assertThat(response.expensesWithoutPaymentProofCount()).isZero();
        assertThat(response.expensesWithoutFiscalDocumentCount()).isZero();
    }
}