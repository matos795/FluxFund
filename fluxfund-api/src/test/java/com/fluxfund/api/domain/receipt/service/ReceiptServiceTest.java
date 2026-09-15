package com.fluxfund.api.domain.receipt.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.beneficiary.repository.BeneficiaryRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.TechnicalMovementType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.receipt.ReceiptSourceType;
import com.fluxfund.api.domain.receipt.ReceiptType;
import com.fluxfund.api.domain.receipt.dto.CreateReceiptDraftRequest;
import com.fluxfund.api.domain.receipt.repository.ReceiptRepository;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;

@ExtendWith(MockitoExtension.class)
class ReceiptServiceTest {

    @Mock
    private ReceiptRepository receiptRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private BeneficiaryRepository beneficiaryRepository;

    @Mock
    private FundRepository fundRepository;

    @Mock
    private FinancialTransactionRepository transactionRepository;

    @Mock
    private TransactionAllocationRepository allocationRepository;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ReceiptService service;

    @Test
    void shouldRejectReceiptForTechnicalMovement() {

        UUID organizationId = UUID.randomUUID();
        UUID transactionId = UUID.randomUUID();

        Organization organization = new Organization();

        FinancialTransaction transaction = new FinancialTransaction();
        transaction.setId(transactionId);
        transaction.setStatus(FinancialTransactionStatus.SETTLED);
        transaction.setType(FinancialTransactionType.EXPENSE);
        transaction.markAsTechnicalMovement(TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);

        when(organizationRepository
                .findById(organizationId))
                .thenReturn(Optional.of(organization));

        when(transactionRepository
                .findByIdAndOrganizationId(transactionId, organizationId))
                .thenReturn(Optional.of(transaction));

        CreateReceiptDraftRequest request = new CreateReceiptDraftRequest(
                ReceiptSourceType.TRANSACTION,
                transactionId,
                null,
                ReceiptType.OTHER_PAYMENT,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);

        assertThatThrownBy(() -> service.createDraft(organizationId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Technical movements are managed automatically");
    }
}