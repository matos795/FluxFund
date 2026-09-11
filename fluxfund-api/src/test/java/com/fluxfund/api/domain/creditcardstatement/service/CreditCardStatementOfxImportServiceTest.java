package com.fluxfund.api.domain.creditcardstatement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementPaymentRepository;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.ofx.OfxTextNormalizer;

@ExtendWith(MockitoExtension.class)
class CreditCardStatementOfxImportServiceTest {

    @Mock
    private CreditCardStatementRepository statementRepository;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @Mock
    private OfxTextNormalizer ofxTextNormalizer;

    @Mock
    private CreditCardStatementPaymentRepository paymentRepository;

    @Mock
    private CreditCardOfxEntryClassifier entryClassifier;

    @Mock
    private CreditCardStatementCreditService creditService;

    @InjectMocks
    private CreditCardStatementOfxImportService service;

    @Test
    void shouldImportPositiveOpeningBalanceAsPreviousCredit()
            throws Exception {

        // GIVEN
        UUID organizationId = UUID.randomUUID();

        UUID statementId = UUID.randomUUID();

        Organization organization = new Organization();

        organization.setId(
                organizationId);

        Account creditCardAccount = new Account();

        creditCardAccount.setId(
                UUID.randomUUID());

        creditCardAccount.setOrganization(
                organization);

        CreditCardStatement statement = new CreditCardStatement();

        statement.setId(
                statementId);

        statement.setOrganization(
                organization);

        statement.setCreditCardAccount(
                creditCardAccount);

        statement.setStatus(
                CreditCardStatementStatus.OPEN);

        statement.setPreviousBalanceAmount(
                BigDecimal.ZERO);

        statement.setPreviousCreditAmount(
                BigDecimal.ZERO);

        when(statementRepository
                .findByIdAndOrganizationId(
                        statementId,
                        organizationId))
                .thenReturn(
                        Optional.of(statement));

        when(statementRepository
                .save(any(CreditCardStatement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        when(ofxTextNormalizer
                .normalize(anyString()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        when(entryClassifier
                .classify(
                        any(),
                        anyString()))
                .thenReturn(
                        CreditCardOfxEntryType.EXPENSE);

        when(financialTransactionRepository
                .findByOrganizationIdAndCreditCardStatementIdAndExternalId(
                        organizationId,
                        statementId,
                        "TEST-EXPENSE-1"))
                .thenReturn(
                        Optional.empty());

        when(financialTransactionRepository
                .save(any(FinancialTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        InputStream inputStream = getClass()
                .getResourceAsStream(
                        "/ofx/credit-card-positive-opening-balance.ofx");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "credit-card-positive-opening-balance.ofx",
                "application/x-ofx",
                inputStream);

        // WHEN
        service.importOfx(
                organizationId,
                statementId,
                file);

        // THEN
        assertThat(
                statement.getPreviousBalanceAmount())
                .isEqualByComparingTo(
                        "0.00");

        assertThat(
                statement.getPreviousCreditAmount())
                .isEqualByComparingTo(
                        "44.11");
    }
}