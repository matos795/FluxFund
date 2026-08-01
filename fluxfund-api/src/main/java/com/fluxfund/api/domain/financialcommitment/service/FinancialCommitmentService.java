package com.fluxfund.api.domain.financialcommitment.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.FinancialPartyRole;
import com.fluxfund.api.domain.beneficiary.repository.BeneficiaryRepository;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitment;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentStatus;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType;
import com.fluxfund.api.domain.financialcommitment.dto.CreateFinancialCommitmentRequest;
import com.fluxfund.api.domain.financialcommitment.dto.FinancialCommitmentAllocationSuggestionResponse;
import com.fluxfund.api.domain.financialcommitment.dto.FinancialCommitmentResponse;
import com.fluxfund.api.domain.financialcommitment.dto.UpdateFinancialCommitmentRequest;
import com.fluxfund.api.domain.financialcommitment.mapper.FinancialCommitmentMapper;
import com.fluxfund.api.domain.financialcommitment.repository.FinancialCommitmentRepository;
import com.fluxfund.api.domain.financialcommitment.specification.FinancialCommitmentSpecification;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FinancialCommitmentService {

    private final FinancialCommitmentRepository repository;
    private final OrganizationRepository organizationRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final FundRepository fundRepository;
    private final OrganizationAccessService organizationAccessService;
    private final AuditLogService auditLogService;
    private final TransactionAllocationRepository transactionAllocationRepository;

    public FinancialCommitmentResponse create(
            UUID organizationId,
            CreateFinancialCommitmentRequest request) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        validateCommitmentDefinition(
                request.direction(),
                request.commitmentType(),
                request.recurrence(),
                request.startDate(),
                request.endDate(),
                request.dueDay());

        Organization organization = organizationRepository
                .findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Beneficiary party = resolveParty(
                organizationId,
                request.partyId(),
                request.direction());

        Beneficiary designatedRecipient = resolveDesignatedRecipient(
                organizationId,
                request.direction(),
                request.partyId(),
                request.designatedRecipientId());

        Fund fund = resolveFund(
                organizationId,
                request.fundId());

        LocalDate endDate = normalizeEndDate(
                request.recurrence(),
                request.startDate(),
                request.endDate());

        validateNoOverlap(
                organizationId,
                request.direction(),
                request.commitmentType(),
                request.recurrence(),
                request.partyId(),
                request.designatedRecipientId(),
                request.fundId(),
                request.startDate(),
                endDate,
                null);

        FinancialCommitment commitment = new FinancialCommitment();

        commitment.setOrganization(
                organization);

        commitment.setParty(
                party);

        commitment.setDesignatedRecipient(
                designatedRecipient);

        commitment.setFund(
                fund);

        commitment.setDirection(
                request.direction());

        commitment.setCommitmentType(
                request.commitmentType());

        commitment.setRecurrence(
                request.recurrence());

        commitment.setAmount(
                request.amount());

        commitment.setDueDay(
                request.recurrence() == FinancialCommitmentRecurrence.MONTHLY

                        ? request.dueDay()
                        : null);

        commitment.setStartDate(
                request.startDate());

        commitment.setEndDate(
                endDate);

        commitment.setDescription(
                normalizeText(
                        request.description()));

        commitment.setActive(true);

        repository.saveAndFlush(
                commitment);

        auditLogService.record(

                organizationId,

                AuditEntityType.FINANCIAL_COMMITMENT,

                commitment.getId(),

                AuditAction.CREATE,

                "Financial commitment created");

        return FinancialCommitmentMapper
                .toResponse(
                        commitment);
    }

    @Transactional(readOnly = true)
    public Page<FinancialCommitmentResponse> findAll(

            UUID organizationId,

            String search,

            FinancialCommitmentDirection direction,

            FinancialCommitmentType commitmentType,

            FinancialCommitmentRecurrence recurrence,

            FinancialCommitmentStatus status,

            UUID partyId,

            UUID designatedRecipientId,

            UUID fundId,

            Pageable pageable) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        LocalDate referenceDate = LocalDate.now();

        Specification<FinancialCommitment> specification =

                FinancialCommitmentSpecification
                        .withFilters(

                                organizationId,

                                search,

                                direction,

                                commitmentType,

                                recurrence,

                                status,

                                partyId,

                                designatedRecipientId,

                                fundId,

                                referenceDate);

        return repository
                .findAll(
                        specification,
                        pageable)

                .map(
                        commitment -> FinancialCommitmentMapper
                                .toResponse(

                                        commitment,

                                        referenceDate));
    }

    @Transactional(readOnly = true)
    public FinancialCommitmentResponse findById(

            UUID organizationId,

            UUID id) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        return FinancialCommitmentMapper
                .toResponse(

                        findEntityById(
                                organizationId,
                                id));
    }

    public FinancialCommitmentResponse update(

            UUID organizationId,

            UUID id,

            UpdateFinancialCommitmentRequest request) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        FinancialCommitment commitment = findEntityById(
                organizationId,
                id);

        /*
         * Alterar a direção ou o tipo pode remover
         * um registro de relatórios históricos.
         *
         * Para isso, o usuário deverá encerrar o
         * compromisso antigo e criar outro.
         */
        if (commitment.getDirection() != request.direction()) {

            throw new BusinessException(
                    "Commitment direction cannot be changed. Create a new commitment.");
        }

        if (commitment.getCommitmentType() != request.commitmentType()) {

            throw new BusinessException(
                    "Commitment type cannot be changed. Create a new commitment.");
        }

        validateCommitmentDefinition(
                request.direction(),
                request.commitmentType(),
                request.recurrence(),
                request.startDate(),
                request.endDate(),
                request.dueDay());

        Beneficiary party = resolveParty(
                organizationId,
                request.partyId(),
                request.direction());

        Beneficiary designatedRecipient = resolveDesignatedRecipient(

                organizationId,

                request.direction(),

                request.partyId(),

                request.designatedRecipientId());

        Fund fund = resolveFund(
                organizationId,
                request.fundId());

        LocalDate endDate = normalizeEndDate(

                request.recurrence(),

                request.startDate(),

                request.endDate());

        if (Boolean.TRUE.equals(
                commitment.getActive())) {

            validateNoOverlap(

                    organizationId,

                    request.direction(),

                    request.commitmentType(),

                    request.recurrence(),

                    request.partyId(),

                    request.designatedRecipientId(),

                    request.fundId(),

                    request.startDate(),

                    endDate,

                    commitment.getId());
        }

        commitment.setParty(
                party);

        commitment.setDesignatedRecipient(
                designatedRecipient);

        commitment.setFund(
                fund);

        commitment.setRecurrence(
                request.recurrence());

        commitment.setAmount(
                request.amount());

        commitment.setDueDay(
                request.recurrence() == FinancialCommitmentRecurrence.MONTHLY

                        ? request.dueDay()
                        : null);

        commitment.setStartDate(
                request.startDate());

        commitment.setEndDate(
                endDate);

        commitment.setDescription(
                normalizeText(
                        request.description()));

        repository.saveAndFlush(
                commitment);

        auditLogService.record(

                organizationId,

                AuditEntityType.FINANCIAL_COMMITMENT,

                commitment.getId(),

                AuditAction.UPDATE,

                "Financial commitment updated");

        return FinancialCommitmentMapper
                .toResponse(
                        commitment);
    }

    public void deactivate(

            UUID organizationId,

            UUID id) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        FinancialCommitment commitment = findEntityById(
                organizationId,
                id);

        if (!Boolean.TRUE.equals(
                commitment.getActive())) {

            return;
        }

        commitment.setActive(false);

        repository.save(
                commitment);

        auditLogService.record(

                organizationId,

                AuditEntityType.FINANCIAL_COMMITMENT,

                commitment.getId(),

                AuditAction.DEACTIVATE,

                "Financial commitment deactivated");
    }

    public FinancialCommitmentResponse activate(

            UUID organizationId,

            UUID id) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        FinancialCommitment commitment = findEntityById(
                organizationId,
                id);

        if (Boolean.TRUE.equals(
                commitment.getActive())) {

            return FinancialCommitmentMapper
                    .toResponse(
                            commitment);
        }

        if (commitment.getEndDate() != null
                && commitment
                        .getEndDate()
                        .isBefore(
                                LocalDate.now())) {

            throw new BusinessException(
                    "Update the commitment period before reactivating it");
        }

        validateNoOverlap(

                organizationId,

                commitment.getDirection(),

                commitment.getCommitmentType(),

                commitment.getRecurrence(),

                commitment.getParty().getId(),

                commitment.getDesignatedRecipient() != null

                        ? commitment
                                .getDesignatedRecipient()
                                .getId()

                        : null,

                commitment.getFund().getId(),

                commitment.getStartDate(),

                commitment.getEndDate(),

                commitment.getId());

        commitment.setActive(true);

        repository.saveAndFlush(
                commitment);

        auditLogService.record(

                organizationId,

                AuditEntityType.FINANCIAL_COMMITMENT,

                commitment.getId(),

                AuditAction.ACTIVATE,

                "Financial commitment activated");

        return FinancialCommitmentMapper
                .toResponse(
                        commitment);
    }

    @Transactional(readOnly = true)
    public List<FinancialCommitmentAllocationSuggestionResponse> findAllocationSuggestions(
            UUID organizationId,
            FinancialTransactionType transactionType,
            UUID sourcePartyId,
            UUID recipientPartyId,
            UUID fundId,
            LocalDate referenceMonth,
            BigDecimal availableAmount,
            UUID excludedAllocationId) {

        organizationAccessService.requireReadAccess(organizationId);

        if (transactionType == FinancialTransactionType.TRANSFER) {
            return List.of();
        }

        if (availableAmount == null || availableAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of();
        }

        FinancialCommitmentDirection direction;
        UUID partyId;
        UUID designatedRecipientId;

        if (transactionType == FinancialTransactionType.INCOME) {

            if (sourcePartyId == null) {
                return List.of();
            }

            direction = FinancialCommitmentDirection.RECEIVABLE;
            partyId = sourcePartyId;
            designatedRecipientId = recipientPartyId;

        } else {

            if (recipientPartyId == null) {
                return List.of();
            }

            direction = FinancialCommitmentDirection.PAYABLE;
            partyId = recipientPartyId;
            designatedRecipientId = null;
        }

        LocalDate monthStart = referenceMonth.withDayOfMonth(1);

        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

        BigDecimal normalizedAvailableAmount = availableAmount.abs();

        return repository.findApplicableForAllocation(
                organizationId,
                direction,
                partyId,
                designatedRecipientId,
                monthStart,
                monthEnd)
                .stream()
                .map(commitment -> {
                    BigDecimal realized = transactionAllocationRepository
                            .sumRealizedCommitmentAmount(
                                    organizationId,
                                    commitment.getId(),
                                    monthStart,
                                    excludedAllocationId)
                            .abs();
                    BigDecimal remaining = commitment.getAmount().subtract(realized).max(BigDecimal.ZERO);
                    BigDecimal suggested = remaining.min(normalizedAvailableAmount);
                    boolean exactFundMatch = commitment.getFund().getId().equals(fundId);
                    boolean fulfilled = remaining.compareTo(BigDecimal.ZERO) == 0;

                    return new FinancialCommitmentAllocationSuggestionResponse(
                            FinancialCommitmentMapper.toAllocationSummary(commitment),
                            realized,
                            remaining,
                            suggested,
                            exactFundMatch,
                            fulfilled);
                })

                .sorted(Comparator
                        .comparing(FinancialCommitmentAllocationSuggestionResponse::exactFundMatch)
                        .reversed()
                        .thenComparing(FinancialCommitmentAllocationSuggestionResponse::fulfilled)
                        .thenComparing(suggestion -> suggestion.commitment().dueDay(),
                                Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private FinancialCommitment findEntityById(

            UUID organizationId,

            UUID id) {

        return repository
                .findByIdAndOrganizationId(
                        id,
                        organizationId)

                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Financial commitment not found"));
    }

    private Beneficiary resolveParty(
            UUID organizationId,
            UUID partyId,
            FinancialCommitmentDirection direction) {

        Beneficiary party = beneficiaryRepository.findByIdAndOrganizationIdAndActiveTrue(
                partyId,
                organizationId)

                .orElseThrow(() -> new ResourceNotFoundException("Financial party not found"));

        FinancialPartyRole requiredRole = direction == FinancialCommitmentDirection.RECEIVABLE
                ? FinancialPartyRole.INCOME_SOURCE
                : FinancialPartyRole.PAYMENT_RECIPIENT;

        if (party.getRoles() == null || !party.getRoles().contains(requiredRole)) {
            throw new BusinessException("Financial party does not have the required role");
        }

        return party;
    }

    private Beneficiary resolveDesignatedRecipient(
            UUID organizationId,
            FinancialCommitmentDirection direction,
            UUID partyId,
            UUID designatedRecipientId) {

        if (designatedRecipientId == null) {
            return null;
        }

        if (direction != FinancialCommitmentDirection.RECEIVABLE) {
            throw new BusinessException("Only receivable commitments can have a designated recipient");
        }

        if (partyId.equals(designatedRecipientId)) {
            throw new BusinessException("Source party and designated recipient must be different");
        }

        Beneficiary recipient = beneficiaryRepository
                .findByIdAndOrganizationIdAndActiveTrue(
                        designatedRecipientId,
                        organizationId)

                .orElseThrow(() -> new ResourceNotFoundException("Designated recipient not found"));

        if (recipient.getRoles() == null || !recipient.getRoles()
                .contains(FinancialPartyRole.PAYMENT_RECIPIENT)) {

            throw new BusinessException("Designated recipient does not have the payment recipient role");
        }

        return recipient;
    }

    private Fund resolveFund(UUID organizationId, UUID fundId) {
        return fundRepository.findByIdAndOrganizationIdAndActiveTrue(fundId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Fund not found"));
    }

    private void validateCommitmentDefinition(
            FinancialCommitmentDirection direction,
            FinancialCommitmentType commitmentType,
            FinancialCommitmentRecurrence recurrence,
            LocalDate startDate,
            LocalDate endDate,
            Integer dueDay) {

        if (endDate != null && endDate.isBefore(startDate)) {

            throw new BusinessException("End date cannot be before start date");
        }

        if (recurrence == FinancialCommitmentRecurrence.ONE_TIME) {

            if (dueDay != null) {
                throw new BusinessException("One-time commitments cannot have a due day");
            }

            if (endDate != null && !endDate.equals(startDate)) {
                throw new BusinessException("One-time commitment end date must equal its start date");
            }
        }

        boolean validType = switch (direction) {

            case RECEIVABLE ->
                commitmentType == FinancialCommitmentType.SUPPORT
                        || commitmentType == FinancialCommitmentType.DONATION
                        || commitmentType == FinancialCommitmentType.CUSTOMER_PAYMENT
                        || commitmentType == FinancialCommitmentType.SPONSORSHIP
                        || commitmentType == FinancialCommitmentType.MEMBER_CONTRIBUTION
                        || commitmentType == FinancialCommitmentType.OTHER;

            case PAYABLE ->
                commitmentType == FinancialCommitmentType.SUPPLIER_PAYMENT
                        || commitmentType == FinancialCommitmentType.SALARY
                        || commitmentType == FinancialCommitmentType.SERVICE_PAYMENT
                        || commitmentType == FinancialCommitmentType.REIMBURSEMENT
                        || commitmentType == FinancialCommitmentType.OTHER;
        };

        if (!validType) {
            throw new BusinessException("Commitment type is not compatible with its direction");
        }
    }

    private LocalDate normalizeEndDate(
            FinancialCommitmentRecurrence recurrence,
            LocalDate startDate,
            LocalDate endDate) {

        if (recurrence == FinancialCommitmentRecurrence.ONE_TIME) {
            return startDate;
        }

        return endDate;
    }

    private void validateNoOverlap(
            UUID organizationId,
            FinancialCommitmentDirection direction,
            FinancialCommitmentType commitmentType,
            FinancialCommitmentRecurrence recurrence,
            UUID partyId,
            UUID designatedRecipientId,
            UUID fundId,
            LocalDate startDate,
            LocalDate endDate,
            UUID excludedId) {

        boolean overlap = repository.existsActiveFinancialCommitmentOverlap(
                organizationId,
                direction,
                commitmentType,
                recurrence,
                partyId,
                designatedRecipientId,
                fundId,
                startDate,
                endDate,
                excludedId);

        if (overlap) {
            throw new BusinessException("There is already an active equivalent commitment in the selected period");
        }
    }

    private String normalizeText(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}