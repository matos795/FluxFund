package com.fluxfund.api.domain.financialtransaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.service.CreditCardStatementCreditService;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.security.OrganizationAccessService;

@ExtendWith(MockitoExtension.class)
class FinancialTransactionServiceTest {

    @Mock
    private FinancialTransactionRepository repository;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private CreditCardStatementCreditService creditCardStatementCreditService;

    @InjectMocks
    private FinancialTransactionService service;

    @Test
    void shouldRecalculateCreditStateWhenCreditCardItemIsCanceled() {

        // GIVEN
        UUID organizationId = UUID.randomUUID();

        UUID transactionId = UUID.randomUUID();

        CreditCardStatement statement = new CreditCardStatement();

        statement.setId(
                UUID.randomUUID());

        FinancialTransaction transaction = new FinancialTransaction();

        transaction.setId(
                transactionId);

        transaction.setStatus(
                FinancialTransactionStatus.SETTLED);

        transaction.setType(
                FinancialTransactionType.EXPENSE);

        transaction.setCreditCardStatement(
                statement);

        when(repository
                .findByIdAndOrganizationId(
                        transactionId,
                        organizationId))
                .thenReturn(
                        Optional.of(transaction));

        // WHEN
        service.delete(
                organizationId,
                transactionId);

        // THEN
        assertThat(transaction.getStatus())
                .isEqualTo(
                        FinancialTransactionStatus.CANCELED);

        verify(creditCardStatementCreditService)
                .recalculateCreditState(
                        organizationId,
                        statement);
    }
}