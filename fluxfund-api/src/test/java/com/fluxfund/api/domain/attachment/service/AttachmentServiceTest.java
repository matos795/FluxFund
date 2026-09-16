package com.fluxfund.api.domain.attachment.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.attachment.AttachmentType;
import com.fluxfund.api.domain.attachment.repository.AttachmentRepository;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.TechnicalMovementType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.storage.LocalFileStorageService;

@ExtendWith(MockitoExtension.class)
class AttachmentServiceTest {

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private LocalFileStorageService storageService;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AttachmentService service;

    @Test
    void shouldRejectAttachmentForTechnicalMovement() throws Exception {

        UUID organizationId = UUID.randomUUID();
        UUID transactionId = UUID.randomUUID();

        Organization organization = new Organization();

        FinancialTransaction transaction = new FinancialTransaction();
        transaction.setId(transactionId);
        transaction.markAsTechnicalMovement(TechnicalMovementType.NUBANK_PIX_CREDIT_BRIDGE);

        MultipartFile file = mock(MultipartFile.class);

        when(file.isEmpty()).thenReturn(false);

        when(file.getOriginalFilename()).thenReturn("comprovante.pdf");

        when(file.getContentType()).thenReturn("application/pdf");

        when(file.getSize()).thenReturn(4L);

        when(file.getInputStream()).thenReturn(new ByteArrayInputStream("%PDF".getBytes()));

        when(organizationRepository
                .findById(organizationId))
                .thenReturn(
                        Optional.of(organization));

        when(financialTransactionRepository
                .findByIdAndOrganizationId(
                        transactionId,
                        organizationId))
                .thenReturn(
                        Optional.of(transaction));

        assertThatThrownBy(() -> service.upload(
                organizationId,
                transactionId,
                AttachmentType.PROOF_OF_PAYMENT,
                file))
                .isInstanceOf(BusinessException.class)
                .hasMessage(
                        "Technical movements are managed automatically");

        verifyNoInteractions(storageService);
    }
}