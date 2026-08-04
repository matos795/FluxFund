package com.fluxfund.api.domain.receipt.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.repository.BeneficiaryRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.receipt.Receipt;
import com.fluxfund.api.domain.receipt.ReceiptDirection;
import com.fluxfund.api.domain.receipt.ReceiptSourceType;
import com.fluxfund.api.domain.receipt.ReceiptStatus;
import com.fluxfund.api.domain.receipt.dto.CreateReceiptDraftRequest;
import com.fluxfund.api.domain.receipt.dto.ReceiptResponse;
import com.fluxfund.api.domain.receipt.mapper.ReceiptMapper;
import com.fluxfund.api.domain.receipt.repository.ReceiptRepository;
import com.fluxfund.api.domain.transactionallocation.TransactionAllocation;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ReceiptService {

    private final ReceiptRepository receiptRepository;

    private final OrganizationRepository organizationRepository;

    private final BeneficiaryRepository beneficiaryRepository;

    private final FundRepository fundRepository;

    private final FinancialTransactionRepository transactionRepository;

    private final TransactionAllocationRepository allocationRepository;

    private final OrganizationAccessService organizationAccessService;

    private final AuditLogService auditLogService;

    public ReceiptResponse createDraft(

            UUID organizationId,

            CreateReceiptDraftRequest request) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        Organization organization = organizationRepository
                .findById(
                        organizationId)

                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Organization not found"));

        ReceiptSourceContext source = resolveSource(

                organizationId,

                request);

        Receipt receipt = new Receipt();

        receipt.setOrganization(
                organization);

        receipt.setStatus(
                ReceiptStatus.DRAFT);

        applyDraftData(

                receipt,

                organization,

                organizationId,

                request,

                source);

        Receipt saved = receiptRepository
                .saveAndFlush(
                        receipt);

        auditLogService.record(

                organizationId,

                AuditEntityType.RECEIPT,

                saved.getId(),

                AuditAction.CREATE,

                "Receipt draft created");

        return ReceiptMapper
                .toResponse(
                        saved);
    }

    public ReceiptResponse updateDraft(

            UUID organizationId,

            UUID receiptId,

            CreateReceiptDraftRequest request) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        Receipt receipt = findEntity(

                organizationId,

                receiptId);

        requireDraft(
                receipt);

        ReceiptSourceContext source = resolveSource(

                organizationId,

                request);

        applyDraftData(

                receipt,

                receipt.getOrganization(),

                organizationId,

                request,

                source);

        Receipt saved = receiptRepository
                .saveAndFlush(
                        receipt);

        auditLogService.record(

                organizationId,

                AuditEntityType.RECEIPT,

                saved.getId(),

                AuditAction.UPDATE,

                "Receipt draft updated");

        return ReceiptMapper
                .toResponse(
                        saved);
    }

    @Transactional(readOnly = true)
    public ReceiptResponse findById(

            UUID organizationId,

            UUID receiptId) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        return ReceiptMapper
                .toResponse(

                        findEntity(

                                organizationId,

                                receiptId));
    }

    @Transactional(readOnly = true)
    public Page<ReceiptResponse> findAll(

            UUID organizationId,

            ReceiptStatus status,

            com.fluxfund.api.domain.receipt.ReceiptType receiptType,

            Pageable pageable) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        Pageable resolvedPageable = pageable
                .getSort()
                .isSorted()

                        ? pageable

                        : PageRequest.of(

                                pageable.getPageNumber(),

                                pageable.getPageSize(),

                                Sort.by(
                                        Sort.Direction.DESC,
                                        "createdAt"));

        return receiptRepository
                .findAllByFilters(

                        organizationId,

                        status,

                        receiptType,

                        resolvedPageable)

                .map(
                        ReceiptMapper::toResponse);
    }

    public void deleteDraft(

            UUID organizationId,

            UUID receiptId) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        Receipt receipt = findEntity(

                organizationId,

                receiptId);

        requireDraft(
                receipt);

        receiptRepository.delete(
                receipt);

        auditLogService.record(

                organizationId,

                AuditEntityType.RECEIPT,

                receiptId,

                AuditAction.CANCEL,

                "Receipt draft deleted");
    }

    private void applyDraftData(

            Receipt receipt,

            Organization organization,

            UUID organizationId,

            CreateReceiptDraftRequest request,

            ReceiptSourceContext source) {

        validateReceiptDirection(

                request,

                source.transaction());

        BigDecimal amount = resolveAmount(

                request,

                source);

        LocalDate paymentDate = resolvePaymentDate(

                request,

                source.transaction());

        PartySnapshot counterparty = resolveCounterparty(

                organizationId,

                request,

                source);

        PartySnapshot beneficiary = resolveBeneficiary(

                organizationId,

                request,

                source);

        FundSnapshot fund = resolveFund(

                organizationId,

                request,

                source);

        String purpose = resolvePurpose(

                request,

                source.transaction());

        receipt.setSourceType(
                request.sourceType());

        receipt.setFinancialTransaction(
                source.transaction());

        receipt.setTransactionAllocation(
                source.allocation());

        receipt.setReceiptType(
                request.receiptType());

        receipt.setAmount(
                amount);

        receipt.setPaymentDate(
                paymentDate);

        receipt.setCounterpartyParty(
                counterparty.party());

        receipt.setCounterpartyName(
                counterparty.name());

        receipt.setCounterpartyDocument(
                counterparty.document());

        receipt.setCounterpartyAddress(
                counterparty.address());

        receipt.setBeneficiaryParty(

                beneficiary != null

                        ? beneficiary.party()

                        : null);

        receipt.setBeneficiaryName(

                beneficiary != null

                        ? beneficiary.name()

                        : null);

        receipt.setBeneficiaryDocument(

                beneficiary != null

                        ? beneficiary.document()

                        : null);

        receipt.setFund(
                fund.fund());

        receipt.setFundName(
                fund.name());

        receipt.setPurposeDescription(
                purpose);

        receipt.setPlaceCity(

                firstText(

                        request.placeCity(),

                        organization.getCity()));

        receipt.setPlaceState(

                firstText(

                        request.placeState(),

                        organization.getState()));

        receipt.setSignatoryName(

                resolveSignatoryName(

                        request,

                        organization,

                        counterparty));

        receipt.setSignatoryTitle(

                resolveSignatoryTitle(

                        request,

                        organization));

        receipt.setNotes(
                normalize(
                        request.notes()));
    }

    private ReceiptSourceContext resolveSource(

            UUID organizationId,

            CreateReceiptDraftRequest request) {

        return switch (request.sourceType()) {

            case MANUAL -> {

                if (request.financialTransactionId() != null

                        || request.transactionAllocationId() != null) {

                    throw new BusinessException(
                            "Manual receipt cannot contain a transaction or allocation");
                }

                yield new ReceiptSourceContext(
                        null,
                        null);
            }

            case TRANSACTION -> {

                if (request.financialTransactionId() == null) {

                    throw new BusinessException(
                            "Transaction is required for a transaction receipt");
                }

                if (request.transactionAllocationId() != null) {

                    throw new BusinessException(
                            "Transaction receipt cannot contain an allocation");
                }

                FinancialTransaction transaction = findTransaction(

                        organizationId,

                        request.financialTransactionId());

                validateTransaction(
                        transaction);

                yield new ReceiptSourceContext(
                        transaction,
                        null);
            }

            case ALLOCATION -> {

                if (request.transactionAllocationId() == null) {

                    throw new BusinessException(
                            "Allocation is required for an allocation receipt");
                }

                TransactionAllocation allocation = allocationRepository
                        .findByIdAndOrganizationId(

                                request.transactionAllocationId(),

                                organizationId)

                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Transaction allocation not found"));

                FinancialTransaction transaction = allocation
                        .getFinancialTransaction();

                if (request.financialTransactionId() != null

                        && !request
                                .financialTransactionId()
                                .equals(
                                        transaction.getId())) {

                    throw new BusinessException(
                            "Allocation does not belong to the informed transaction");
                }

                validateTransaction(
                        transaction);

                yield new ReceiptSourceContext(

                        transaction,

                        allocation);
            }
        };
    }

    private void validateReceiptDirection(

            CreateReceiptDraftRequest request,

            FinancialTransaction transaction) {

        if (transaction == null) {
            return;
        }

        ReceiptDirection direction = request
                .receiptType()
                .getDirection();

        if (direction == ReceiptDirection.RECEIVED_BY_ORGANIZATION

                && transaction.getType() != FinancialTransactionType.INCOME) {

            throw new BusinessException(
                    "Incoming receipt requires an income transaction");
        }

        if (direction == ReceiptDirection.PAID_BY_ORGANIZATION

                && transaction.getType() != FinancialTransactionType.EXPENSE) {

            throw new BusinessException(
                    "Payment receipt requires an expense transaction");
        }
    }

    private BigDecimal resolveAmount(

            CreateReceiptDraftRequest request,

            ReceiptSourceContext source) {

        BigDecimal sourceAmount = null;

        if (source.allocation() != null) {

            sourceAmount = source
                    .allocation()
                    .getAmount()
                    .abs();

        } else if (source.transaction() != null) {

            BigDecimal transactionAmount = source
                    .transaction()
                    .getSettledAmount() != null

                            ? source
                                    .transaction()
                                    .getSettledAmount()

                            : source
                                    .transaction()
                                    .getExpectedAmount();

            sourceAmount = transactionAmount != null

                    ? transactionAmount.abs()

                    : null;
        }

        BigDecimal resolved = request.amount() != null

                ? request.amount()

                : sourceAmount;

        if (resolved == null
                || resolved.compareTo(
                        BigDecimal.ZERO) <= 0) {

            throw new BusinessException(
                    "Receipt amount must be greater than zero");
        }

        if (sourceAmount != null
                && resolved.compareTo(
                        sourceAmount) > 0) {

            throw new BusinessException(
                    "Receipt amount cannot exceed the source amount");
        }

        return resolved;
    }

    private LocalDate resolvePaymentDate(

            CreateReceiptDraftRequest request,

            FinancialTransaction transaction) {

        LocalDate resolved = request.paymentDate() != null

                ? request.paymentDate()

                : transaction != null

                        ? transaction.getSettlementDate()

                        : null;

        if (resolved == null) {

            throw new BusinessException(
                    "Payment date is required");
        }

        return resolved;
    }

    private PartySnapshot resolveCounterparty(

            UUID organizationId,

            CreateReceiptDraftRequest request,

            ReceiptSourceContext source) {

        Beneficiary party = request.counterpartyPartyId() != null

                ? findParty(

                        organizationId,

                        request.counterpartyPartyId())

                : inferCounterparty(

                        request,

                        source);

        if (party != null) {

            return snapshot(
                    party);
        }

        String manualName = normalize(
                request.counterpartyName());

        if (!StringUtils.hasText(
                manualName)) {

            throw new BusinessException(
                    "Counterparty name is required");
        }

        return new PartySnapshot(

                null,

                manualName,

                normalize(
                        request.counterpartyDocument()),

                normalize(
                        request.counterpartyAddress()));
    }

    private Beneficiary inferCounterparty(

            CreateReceiptDraftRequest request,

            ReceiptSourceContext source) {

        if (source.allocation() == null) {
            return null;
        }

        if (request
                .receiptType()
                .isReceivedByOrganization()) {

            return source
                    .allocation()
                    .getSourceParty();
        }

        return source
                .allocation()
                .getRecipientParty();
    }

    private PartySnapshot resolveBeneficiary(

            UUID organizationId,

            CreateReceiptDraftRequest request,

            ReceiptSourceContext source) {

        boolean hasBeneficiaryInput = request.beneficiaryPartyId() != null

                || StringUtils.hasText(
                        request.beneficiaryName())

                || StringUtils.hasText(
                        request.beneficiaryDocument());

        if (request
                .receiptType()
                .isPaidByOrganization()) {

            if (hasBeneficiaryInput) {

                throw new BusinessException(
                        "Payment receipts use the counterparty as the recipient");
            }

            return null;
        }

        Beneficiary party = request.beneficiaryPartyId() != null

                ? findParty(

                        organizationId,

                        request.beneficiaryPartyId())

                : source.allocation() != null

                        ? source
                                .allocation()
                                .getRecipientParty()

                        : null;

        if (party != null) {

            return snapshot(
                    party);
        }

        String manualName = normalize(
                request.beneficiaryName());

        if (!StringUtils.hasText(
                manualName)) {

            return null;
        }

        return new PartySnapshot(

                null,

                manualName,

                normalize(
                        request.beneficiaryDocument()),

                null);
    }

    private FundSnapshot resolveFund(

            UUID organizationId,

            CreateReceiptDraftRequest request,

            ReceiptSourceContext source) {

        Fund fund = request.fundId() != null

                ? fundRepository
                        .findByIdAndOrganizationIdAndActiveTrue(

                                request.fundId(),

                                organizationId)

                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Fund not found"))

                : source.allocation() != null

                        ? source
                                .allocation()
                                .getFund()

                        : null;

        if (fund != null) {

            return new FundSnapshot(

                    fund,

                    fund.getName());
        }

        return new FundSnapshot(

                null,

                normalize(
                        request.fundName()));
    }

    private String resolvePurpose(

            CreateReceiptDraftRequest request,

            FinancialTransaction transaction) {

        String requested = normalize(
                request.purposeDescription());

        if (StringUtils.hasText(
                requested)) {

            return requested;
        }

        if (transaction != null) {

            String transactionDescription = firstText(

                    transaction.getDescription(),

                    transaction.getRawDescription());

            if (StringUtils.hasText(
                    transactionDescription)) {

                return transactionDescription;
            }
        }

        return request
                .receiptType()
                .getDefaultDescription();
    }

    private String resolveSignatoryName(

            CreateReceiptDraftRequest request,

            Organization organization,

            PartySnapshot counterparty) {

        String requested = normalize(
                request.signatoryName());

        if (StringUtils.hasText(
                requested)) {

            return requested;
        }

        if (request
                .receiptType()
                .isPaidByOrganization()) {

            return counterparty.name();
        }

        return firstText(

                organization.getApproverName(),

                organization.getReviewerName());
    }

    private String resolveSignatoryTitle(

            CreateReceiptDraftRequest request,

            Organization organization) {

        String requested = normalize(
                request.signatoryTitle());

        if (StringUtils.hasText(
                requested)) {

            return requested;
        }

        if (request
                .receiptType()
                .isPaidByOrganization()) {

            return null;
        }

        return firstText(

                organization.getApproverTitle(),

                organization.getReviewerTitle());
    }

    private void validateTransaction(
            FinancialTransaction transaction) {

        if (transaction.getStatus() != FinancialTransactionStatus.SETTLED) {

            throw new BusinessException(
                    "Receipt can only use a settled transaction");
        }

        if (transaction.getType() == FinancialTransactionType.TRANSFER) {

            throw new BusinessException(
                    "Transfers cannot generate receipts");
        }
    }

    private FinancialTransaction findTransaction(

            UUID organizationId,

            UUID transactionId) {

        return transactionRepository
                .findByIdAndOrganizationId(

                        transactionId,

                        organizationId)

                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Financial transaction not found"));
    }

    private Beneficiary findParty(

            UUID organizationId,

            UUID partyId) {

        return beneficiaryRepository
                .findByIdAndOrganizationIdAndActiveTrue(

                        partyId,

                        organizationId)

                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Financial party not found"));
    }

    private PartySnapshot snapshot(
            Beneficiary party) {

        String name = firstText(

                party.getLegalName(),

                party.getName());

        return new PartySnapshot(

                party,

                name,

                normalize(
                        party.getDocument()),

                formatAddress(
                        party));
    }

    private String formatAddress(
            Beneficiary party) {

        List<String> parts = new ArrayList<>();

        addPart(
                parts,

                party.getAddressLine());

        addPart(
                parts,

                party.getAddressNumber());

        addPart(
                parts,

                party.getAddressComplement());

        addPart(
                parts,

                party.getNeighborhood());

        String cityAndState = StringUtils.hasText(
                party.getCity())

                        ? party.getCity()
                                + (StringUtils.hasText(
                                        party.getState())

                                                ? "/"
                                                        + party.getState()

                                                : "")

                        : party.getState();

        addPart(
                parts,

                cityAndState);

        if (parts.isEmpty()) {
            return null;
        }

        return String.join(
                ", ",
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

    private Receipt findEntity(

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
                    "Only receipt drafts can be edited or deleted");
        }
    }

    private String firstText(
            String... values) {

        for (String value : values) {

            String normalized = normalize(
                    value);

            if (StringUtils.hasText(
                    normalized)) {

                return normalized;
            }
        }

        return null;
    }

    private String normalize(
            String value) {

        if (!StringUtils.hasText(
                value)) {

            return null;
        }

        return value.trim();
    }

    private record ReceiptSourceContext(

            FinancialTransaction transaction,

            TransactionAllocation allocation) {
    }

    private record PartySnapshot(

            Beneficiary party,

            String name,

            String document,

            String address) {
    }

    private record FundSnapshot(

            Fund fund,

            String name) {
    }
}