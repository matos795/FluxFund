package com.fluxfund.api.domain.creditcardstatement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.importer.BradescoCreditCardXlsxParser;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.importer.ImportProfile;
import com.fluxfund.api.shared.importer.ImportedTransactionRow;

@ExtendWith(MockitoExtension.class)
class CreditCardStatementSpreadsheetImportServiceTest {

    @Mock
    private CreditCardStatementRepository statementRepository;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @Mock
    private BradescoCreditCardXlsxParser bradescoParser;

    @InjectMocks
    private CreditCardStatementSpreadsheetImportService service;

    @Test
    void shouldImportNegativeBradescoAmountAsStatementCredit() {

        UUID organizationId = UUID.randomUUID();
        UUID statementId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        Organization organization = new Organization();
        organization.setId(organizationId);
        organization.setName("Organização Teste");

        Account creditCardAccount = new Account();
        creditCardAccount.setId(accountId);
        creditCardAccount.setOrganization(organization);
        creditCardAccount.setName("Bradesco");
        creditCardAccount.setType(AccountType.CREDIT_CARD);
        creditCardAccount.setActive(true);
        creditCardAccount.setInitialBalance(BigDecimal.ZERO);

        CreditCardStatement statement = new CreditCardStatement();
        statement.setId(statementId);
        statement.setOrganization(organization);
        statement.setCreditCardAccount(creditCardAccount);
        statement.setName("Fatura Setembro");
        statement.setDueDate(LocalDate.of(2026, 9, 10));
        statement.setStatus(CreditCardStatementStatus.OPEN);

        ImportedTransactionRow creditRow = new ImportedTransactionRow(
                LocalDate.of(2026, 8, 20),
                "MERCADOLIVRE*MERCADOLIVRE",
                new BigDecimal("-27.90"),
                "credit-test",
                null);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "fatura.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new byte[] { 1 });

        when(statementRepository
                .findByIdAndOrganizationId(statementId, organizationId))
                .thenReturn(Optional.of(statement));

        when(bradescoParser.parse(file)).thenReturn(List.of(creditRow));

        when(financialTransactionRepository
                .existsByOrganizationIdAndCreditCardStatementIdAndExternalId(
                        organizationId,
                        statementId,
                        "credit-test"))
                .thenReturn(false);

        when(financialTransactionRepository.save(any()))
                .thenAnswer(invocation -> {
                    FinancialTransaction transaction = invocation.getArgument(0);

                    transaction.setId(UUID.randomUUID());

                    return transaction;
                });

        service.importFile(
                organizationId,
                statementId,
                ImportProfile.BRADESCO_CREDIT_CARD_XLSX,
                file);

        ArgumentCaptor<FinancialTransaction> captor = ArgumentCaptor.forClass(FinancialTransaction.class);

        verify(financialTransactionRepository).save(captor.capture());

        FinancialTransaction saved = captor.getValue();

        assertThat(saved.isTechnicalMovement()).isTrue();

        assertThat(saved.getTechnicalMovementType()).isNotNull();

        assertThat(
                saved.getTechnicalMovementType().name())
                .isEqualTo("CREDIT_CARD_STATEMENT_CREDIT");

        assertThat(saved.getExpectedAmount()).isEqualByComparingTo("27.90");

        assertThat(saved.getSettledAmount()).isEqualByComparingTo("27.90");
    }
}