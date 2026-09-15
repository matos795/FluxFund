package com.fluxfund.api.domain.financialtransaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import com.fluxfund.api.domain.financialtransaction.TechnicalMovementType;
import com.fluxfund.api.domain.financialtransaction.dto.ClassifyFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.transactionallocation.dto.CreateTransactionAllocationRequest;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;

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
                statement.setId(UUID.randomUUID());

                FinancialTransaction transaction = new FinancialTransaction();
                transaction.setId(transactionId);
                transaction.setStatus(FinancialTransactionStatus.SETTLED);
                transaction.setType(FinancialTransactionType.EXPENSE);
                transaction.setCreditCardStatement(statement);

                when(repository
                                .findByIdAndOrganizationId(transactionId, organizationId))
                                .thenReturn(Optional.of(transaction));

                // WHEN
                service.delete(organizationId, transactionId);

                // THEN
                assertThat(transaction.getStatus())
                                .isEqualTo(FinancialTransactionStatus.CANCELED);

                verify(creditCardStatementCreditService)
                                .recalculateCreditState(organizationId, statement);
        }

        @Test
        void shouldRejectClassificationOfTechnicalMovement() {

                UUID organizationId = UUID.randomUUID();
                UUID transactionId = UUID.randomUUID();

                FinancialTransaction transaction = technicalTransaction(transactionId);

                when(repository.findByIdAndOrganizationId(transactionId, organizationId))
                                .thenReturn(Optional.of(transaction));

                ClassifyFinancialTransactionRequest request = new ClassifyFinancialTransactionRequest(
                                FinancialTransactionType.EXPENSE,
                                UUID.randomUUID(),
                                LocalDate.of(2026, 8, 18),
                                LocalDate.of(2026, 8, 18),
                                new BigDecimal("50.00"),
                                new BigDecimal("50.00"),
                                "Despesa",
                                null,
                                null,
                                null,
                                null,
                                null,
                                null);

                assertThatThrownBy(() -> service.classify(
                                organizationId,
                                transactionId,
                                request))
                                .isInstanceOf(BusinessException.class)
                                .hasMessage("Technical movements are managed automatically");
        }

        @Test
        void shouldRejectAllocationOfTechnicalMovement() {

                UUID organizationId = UUID.randomUUID();
                UUID transactionId = UUID.randomUUID();

                FinancialTransaction transaction = technicalTransaction(transactionId);

                when(repository
                                .findByIdAndOrganizationId(transactionId, organizationId))
                                .thenReturn(Optional.of(transaction));

                CreateTransactionAllocationRequest request = new CreateTransactionAllocationRequest(
                                UUID.randomUUID(),
                                null,
                                new BigDecimal("50.00"),
                                LocalDate.of(2026, 8, 1));

                assertThatThrownBy(() -> service.addAllocation(
                                organizationId,
                                transactionId,
                                request))
                                .isInstanceOf(BusinessException.class)
                                .hasMessage("Technical movements are managed automatically");
        }

        private FinancialTransaction technicalTransaction(UUID transactionId) {

                FinancialTransaction transaction = new FinancialTransaction();
                transaction.setId(transactionId);
                transaction.setStatus(FinancialTransactionStatus.SETTLED);
                transaction.setType(FinancialTransactionType.INCOME);
                transaction.markAsTechnicalMovement(TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);

                return transaction;
        }

        @Test
        void shouldRejectCancellationOfTechnicalMovement() {

                UUID organizationId = UUID.randomUUID();
                UUID transactionId = UUID.randomUUID();

                FinancialTransaction transaction = technicalTransaction(transactionId);

                when(repository
                                .findByIdAndOrganizationId(transactionId, organizationId))
                                .thenReturn(Optional.of(transaction));

                assertThatThrownBy(() -> service.delete(
                                organizationId,
                                transactionId))
                                .isInstanceOf(BusinessException.class)
                                .hasMessage("Technical movements are managed automatically");
        }
}