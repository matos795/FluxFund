package com.fluxfund.api.domain.receipt.service;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.receipt.Receipt;
import com.fluxfund.api.domain.receipt.ReceiptSourceType;
import com.fluxfund.api.domain.receipt.ReceiptStatus;
import com.fluxfund.api.domain.receipt.dto.ReceiptFile;
import com.fluxfund.api.domain.receipt.dto.ReceiptResponse;
import com.fluxfund.api.domain.receipt.export.ReceiptPdfGenerator;
import com.fluxfund.api.domain.receipt.mapper.ReceiptMapper;
import com.fluxfund.api.domain.receipt.repository.ReceiptRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.storage.LocalFileStorageService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ReceiptIssuanceService {

    private final ReceiptRepository receiptRepository;

    private final ReceiptNumberService receiptNumberService;

    private final ReceiptPdfGenerator pdfGenerator;

    private final LocalFileStorageService storageService;

    private final OrganizationAccessService organizationAccessService;

    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public ReceiptFile preview(

            UUID organizationId,

            UUID receiptId) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        Receipt receipt = findReceipt(

                organizationId,

                receiptId);

        requireDraft(
                receipt);

        byte[] pdf = pdfGenerator.generate(

                receipt,

                receipt.getOrganization(),

                true);

        return new ReceiptFile(

                "previa-recibo-sem-validade.pdf",

                "application/pdf",

                pdf);
    }

    public ReceiptResponse issue(

            UUID organizationId,

            UUID receiptId) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        Receipt receipt = receiptRepository
                .findByIdAndOrganizationIdForUpdate(

                        receiptId,

                        organizationId)

                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Receipt not found"));

        requireDraft(
                receipt);

        validateBeforeIssue(
                receipt);

        validateAvailableSourceAmount(
                receipt);

        LocalDate issueDate = LocalDate.now();

        int sequenceYear = issueDate.getYear();

        long sequenceNumber = receiptNumberService
                .nextNumber(

                        organizationId,

                        sequenceYear);

        snapshotIssuer(
                receipt);

        receipt.setSequenceYear(
                sequenceYear);

        receipt.setSequenceNumber(
                sequenceNumber);

        receipt.setIssueDate(
                issueDate);

        receipt.setIssuedAt(
                OffsetDateTime.now());

        String receiptNumber = "REC-%d-%06d"
                .formatted(

                        sequenceYear,

                        sequenceNumber);

        String filename = "recibo-"
                + receiptNumber
                + ".pdf";

        String storageKey = "organizations/"
                + organizationId

                + "/receipts/"
                + sequenceYear

                + "/"
                + receipt.getId()

                + ".pdf";

        byte[] pdf = pdfGenerator.generate(

                receipt,

                receipt.getOrganization(),

                false);

        boolean fileSaved = false;

        try {

            storageService.save(

                    storageKey,

                    new ByteArrayInputStream(
                            pdf));

            fileSaved = true;

            receipt.setPdfStorageKey(
                    storageKey);

            receipt.setPdfFilename(
                    filename);

            receipt.setPdfSizeBytes(
                    (long) pdf.length);

            receipt.setStatus(
                    ReceiptStatus.ISSUED);

            Receipt saved = receiptRepository
                    .saveAndFlush(
                            receipt);

            auditLogService.record(

                    organizationId,

                    AuditEntityType.RECEIPT,

                    saved.getId(),

                    AuditAction.ISSUE_RECEIPT,

                    "Receipt issued: "
                            + receiptNumber);

            return ReceiptMapper
                    .toResponse(
                            saved);

        } catch (RuntimeException exception) {

            if (fileSaved) {

                storageService.delete(
                        storageKey);
            }

            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public ReceiptFile download(

            UUID organizationId,

            UUID receiptId) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        Receipt receipt = findReceipt(

                organizationId,

                receiptId);

        if (receipt.getStatus() == ReceiptStatus.DRAFT

                || !StringUtils.hasText(
                        receipt.getPdfStorageKey())) {

            throw new BusinessException(
                    "Receipt has not been issued");
        }

        return new ReceiptFile(

                receipt.getPdfFilename(),

                "application/pdf",

                storageService.read(

                        receipt
                                .getPdfStorageKey()));
    }

    public ReceiptResponse cancel(

            UUID organizationId,

            UUID receiptId,

            String reason) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        Receipt receipt = receiptRepository
                .findByIdAndOrganizationIdForUpdate(

                        receiptId,

                        organizationId)

                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Receipt not found"));

        if (receipt.getStatus() != ReceiptStatus.ISSUED) {

            throw new BusinessException(
                    "Only issued receipts can be canceled");
        }

        String normalizedReason = normalize(
                reason);

        if (!StringUtils.hasText(
                normalizedReason)) {

            throw new BusinessException(
                    "Cancellation reason is required");
        }

        receipt.setStatus(
                ReceiptStatus.CANCELED);

        receipt.setCanceledAt(
                OffsetDateTime.now());

        receipt.setCancellationReason(
                normalizedReason);

        Receipt saved = receiptRepository
                .saveAndFlush(
                        receipt);

        auditLogService.record(

                organizationId,

                AuditEntityType.RECEIPT,

                saved.getId(),

                AuditAction.CANCEL_RECEIPT,

                "Receipt canceled: "
                        + normalizedReason);

        return ReceiptMapper
                .toResponse(
                        saved);
    }

    public ReceiptResponse reissue(

            UUID organizationId,

            UUID receiptId) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        Receipt previous = findReceipt(

                organizationId,

                receiptId);

        if (previous.getStatus() != ReceiptStatus.CANCELED) {

            throw new BusinessException(
                    "Only canceled receipts can be reissued");
        }

        Receipt next = new Receipt();

        next.setOrganization(
                previous.getOrganization());

        next.setSourceType(
                previous.getSourceType());

        next.setFinancialTransaction(
                previous.getFinancialTransaction());

        next.setTransactionAllocation(
                previous.getTransactionAllocation());

        next.setReceiptType(
                previous.getReceiptType());

        next.setStatus(
                ReceiptStatus.DRAFT);

        next.setPaymentDate(
                previous.getPaymentDate());

        next.setAmount(
                previous.getAmount());

        next.setCounterpartyParty(
                previous.getCounterpartyParty());

        next.setCounterpartyName(
                previous.getCounterpartyName());

        next.setCounterpartyDocument(
                previous.getCounterpartyDocument());

        next.setCounterpartyAddress(
                previous.getCounterpartyAddress());

        next.setBeneficiaryParty(
                previous.getBeneficiaryParty());

        next.setBeneficiaryName(
                previous.getBeneficiaryName());

        next.setBeneficiaryDocument(
                previous.getBeneficiaryDocument());

        next.setFund(
                previous.getFund());

        next.setFundName(
                previous.getFundName());

        next.setPurposeDescription(
                previous.getPurposeDescription());

        next.setPlaceCity(
                previous.getPlaceCity());

        next.setPlaceState(
                previous.getPlaceState());

        next.setSignatoryName(
                previous.getSignatoryName());

        next.setSignatoryTitle(
                previous.getSignatoryTitle());

        next.setNotes(
                previous.getNotes());

        next.setReplacesReceipt(
                previous);

        Receipt saved = receiptRepository
                .saveAndFlush(
                        next);

        auditLogService.record(

                organizationId,

                AuditEntityType.RECEIPT,

                saved.getId(),

                AuditAction.REISSUE_RECEIPT,

                "Receipt reissue draft created from "
                        + previous.getId());

        return ReceiptMapper
                .toResponse(
                        saved);
    }

    private void validateBeforeIssue(
            Receipt receipt) {

        if (!StringUtils.hasText(
                receipt.getCounterpartyName())) {

            throw new BusinessException(
                    "Counterparty name is required");
        }

        if (!StringUtils.hasText(
                receipt.getPurposeDescription())) {

            throw new BusinessException(
                    "Receipt purpose is required");
        }

        if (receipt.getAmount() == null
                || receipt.getAmount()
                        .compareTo(
                                BigDecimal.ZERO) <= 0) {

            throw new BusinessException(
                    "Receipt amount must be greater than zero");
        }

        if (receipt.getPaymentDate() == null) {

            throw new BusinessException(
                    "Payment date is required");
        }

        if (!StringUtils.hasText(
                receipt.getPlaceCity())

                || !StringUtils.hasText(
                        receipt.getPlaceState())) {

            throw new BusinessException(
                    "Receipt city and state are required");
        }

        if (!StringUtils.hasText(
                receipt.getSignatoryName())) {

            throw new BusinessException(
                    "Receipt signatory is required");
        }

        FinancialTransaction transaction = receipt.getFinancialTransaction();

        if (transaction != null
                && transaction.getStatus() != FinancialTransactionStatus.SETTLED) {

            throw new BusinessException(
                    "Receipt source transaction is no longer settled");
        }
    }

    private void validateAvailableSourceAmount(
            Receipt receipt) {

        if (receipt.getSourceType() == ReceiptSourceType.MANUAL) {

            return;
        }

        UUID organizationId = receipt
                .getOrganization()
                .getId();

        UUID transactionId = receipt
                .getFinancialTransaction()
                .getId();

        if (receipt.getSourceType() == ReceiptSourceType.TRANSACTION) {

            boolean hasAllocationReceipts = receiptRepository
                    .existsIssuedByTransactionAndSourceType(

                            organizationId,

                            transactionId,

                            ReceiptSourceType.ALLOCATION);

            if (hasAllocationReceipts) {

                throw new BusinessException(
                        "Transaction already has receipts issued by allocation");
            }

            BigDecimal alreadyIssued = receiptRepository
                    .sumIssuedByTransaction(

                            organizationId,

                            transactionId);

            BigDecimal sourceAmount = resolveTransactionAmount(
                    receipt
                            .getFinancialTransaction());

            validateRemainingAmount(

                    alreadyIssued,

                    sourceAmount,

                    receipt.getAmount());

            return;
        }

        boolean hasTransactionReceipt = receiptRepository
                .existsIssuedByTransactionAndSourceType(

                        organizationId,

                        transactionId,

                        ReceiptSourceType.TRANSACTION);

        if (hasTransactionReceipt) {

            throw new BusinessException(
                    "Transaction already has a transaction-level receipt");
        }

        BigDecimal alreadyIssued = receiptRepository
                .sumIssuedByAllocation(

                        organizationId,

                        receipt
                                .getTransactionAllocation()
                                .getId());

        BigDecimal sourceAmount = receipt
                .getTransactionAllocation()
                .getAmount()
                .abs();

        validateRemainingAmount(

                alreadyIssued,

                sourceAmount,

                receipt.getAmount());
    }

    private void validateRemainingAmount(

            BigDecimal alreadyIssued,

            BigDecimal sourceAmount,

            BigDecimal currentAmount) {

        BigDecimal remaining = sourceAmount
                .subtract(
                        alreadyIssued)

                .max(
                        BigDecimal.ZERO);

        if (currentAmount.compareTo(
                remaining) > 0) {

            throw new BusinessException(
                    "Receipt amount exceeds the amount still available for this source");
        }
    }

    private BigDecimal resolveTransactionAmount(
            FinancialTransaction transaction) {

        BigDecimal amount = transaction.getSettledAmount() != null

                ? transaction.getSettledAmount()

                : transaction.getExpectedAmount();

        return amount.abs();
    }

    private void snapshotIssuer(
            Receipt receipt) {

        Organization organization = receipt.getOrganization();

        receipt.setIssuerName(
                organization.getName());

        receipt.setIssuerLegalName(
                organization.getLegalName());

        receipt.setIssuerDocument(
                organization.getCnpj());

        receipt.setIssuerAddress(
                formatOrganizationAddress(
                        organization));

        receipt.setIssuerContact(
                buildIssuerContact(
                        organization));
    }

    private String formatOrganizationAddress(
            Organization organization) {

        List<String> parts = new ArrayList<>();

        addPart(
                parts,
                organization.getAddressLine());

        addPart(
                parts,
                organization.getAddressNumber());

        addPart(
                parts,
                organization.getAddressComplement());

        addPart(
                parts,
                organization.getNeighborhood());

        String cityState = StringUtils.hasText(
                organization.getCity())

                        ? organization.getCity()
                                + (StringUtils.hasText(
                                        organization.getState())

                                                ? "/"
                                                        + organization.getState()

                                                : "")

                        : organization.getState();

        addPart(
                parts,
                cityState);

        addPart(
                parts,
                organization.getZipCode());

        return parts.isEmpty()

                ? null

                : String.join(
                        ", ",
                        parts);
    }

    private String buildIssuerContact(
            Organization organization) {

        List<String> parts = new ArrayList<>();

        addPart(
                parts,
                organization.getContactPhone());

        addPart(
                parts,
                organization.getContactEmail());

        return parts.isEmpty()

                ? null

                : String.join(
                        " · ",
                        parts);
    }

    private void addPart(

            List<String> parts,

            String value) {

        String normalized = normalize(
                value);

        if (StringUtils.hasText(
                normalized)) {

            parts.add(
                    normalized);
        }
    }

    private Receipt findReceipt(

            UUID organizationId,

            UUID receiptId) {

        return receiptRepository
                .findByIdAndOrganizationId(

                        receiptId,

                        organizationId)

                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Receipt not found"));
    }

    private void requireDraft(
            Receipt receipt) {

        if (receipt.getStatus() != ReceiptStatus.DRAFT) {

            throw new BusinessException(
                    "Only receipt drafts can be issued or previewed");
        }
    }

    private String normalize(
            String value) {

        if (!StringUtils.hasText(
                value)) {

            return null;
        }

        return value.trim();
    }
}