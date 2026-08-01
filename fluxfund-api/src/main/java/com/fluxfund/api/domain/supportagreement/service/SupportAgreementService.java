package com.fluxfund.api.domain.supportagreement.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
import com.fluxfund.api.domain.financialcommitment.repository.FinancialCommitmentRepository;
import com.fluxfund.api.domain.financialcommitment.specification.FinancialCommitmentSpecification;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.supportagreement.SupportAgreementStatus;
import com.fluxfund.api.domain.supportagreement.dto.CreateSupportAgreementRequest;
import com.fluxfund.api.domain.supportagreement.dto.CreateSupportAgreementVersionRequest;
import com.fluxfund.api.domain.supportagreement.dto.SupportAgreementResponse;
import com.fluxfund.api.domain.supportagreement.dto.UpdateSupportAgreementRequest;
import com.fluxfund.api.domain.supportagreement.mapper.SupportAgreementMapper;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SupportAgreementService {

    private final FinancialCommitmentRepository
            repository;

    private final OrganizationRepository
            organizationRepository;

    private final BeneficiaryRepository
            beneficiaryRepository;

    private final FundRepository
            fundRepository;

    private final OrganizationAccessService
            organizationAccessService;

    private final AuditLogService
            auditLogService;

    public SupportAgreementResponse create(

            UUID organizationId,

            CreateSupportAgreementRequest request) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        validateDates(
                request.startDate(),
                request.endDate());

        Organization organization =
                organizationRepository
                        .findById(
                                organizationId)

                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Organization not found"));

        Beneficiary recipient =
                resolveSupportRecipient(

                        organizationId,

                        request
                                .beneficiaryId());

        Fund fund =
                resolveFund(

                        organizationId,

                        request.fundId());

        validateNoActiveAgreementOverlap(

                organizationId,

                request.beneficiaryId(),

                request.fundId(),

                request.startDate(),

                request.endDate(),

                null);

        FinancialCommitment commitment =
                new FinancialCommitment();

        commitment.setOrganization(
                organization);

        commitment.setParty(
                recipient);

        commitment.setDesignatedRecipient(
                null);

        commitment.setFund(
                fund);

        commitment.setDirection(
                FinancialCommitmentDirection
                        .PAYABLE);

        commitment.setCommitmentType(
                FinancialCommitmentType
                        .SUPPORT);

        commitment.setRecurrence(
                FinancialCommitmentRecurrence
                        .MONTHLY);

        commitment.setAmount(
                request.amount());

        commitment.setDueDay(
                null);

        commitment.setStartDate(
                request.startDate());

        commitment.setEndDate(
                request.endDate());

        commitment.setActive(
                true);

        commitment.setDescription(
                normalizeText(
                        request.description()));

        repository.saveAndFlush(
                commitment);

        recordAudit(

                organizationId,

                commitment.getId(),

                AuditAction.CREATE,

                "Support commitment created");

        return SupportAgreementMapper
                .toResponse(
                        commitment);
    }

    @Transactional(readOnly = true)
    public Page<SupportAgreementResponse>
            findAll(

                    UUID organizationId,

                    SupportAgreementStatus status,

                    Pageable pageable) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        LocalDate referenceDate =
                LocalDate.now();

        FinancialCommitmentStatus
                commitmentStatus =

                status != null

                        ? FinancialCommitmentStatus
                                .valueOf(
                                        status.name())

                        : null;

        Specification<FinancialCommitment>
                specification =

                FinancialCommitmentSpecification
                        .withFilters(

                                organizationId,

                                null,

                                FinancialCommitmentDirection
                                        .PAYABLE,

                                FinancialCommitmentType
                                        .SUPPORT,

                                FinancialCommitmentRecurrence
                                        .MONTHLY,

                                commitmentStatus,

                                null,

                                null,

                                null,

                                referenceDate);

        Pageable resolvedPageable =
                pageable
                        .getSort()
                        .isSorted()

                ? pageable

                : PageRequest.of(

                        pageable
                                .getPageNumber(),

                        pageable
                                .getPageSize(),

                        Sort.by(
                                Sort.Direction.DESC,
                                "startDate"));

        return repository
                .findAll(
                        specification,
                        resolvedPageable)

                .map(
                        commitment ->
                                SupportAgreementMapper
                                        .toResponse(

                                                commitment,

                                                referenceDate));
    }

    @Transactional(readOnly = true)
    public SupportAgreementResponse findById(

            UUID organizationId,

            UUID id) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        return SupportAgreementMapper
                .toResponse(

                        findEntityById(
                                organizationId,
                                id));
    }

    public SupportAgreementResponse update(

            UUID organizationId,

            UUID id,

            UpdateSupportAgreementRequest request) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        validateDates(
                request.startDate(),
                request.endDate());

        FinancialCommitment commitment =
                findEntityById(
                        organizationId,
                        id);

        Beneficiary recipient =
                resolveSupportRecipient(

                        organizationId,

                        request
                                .beneficiaryId());

        Fund fund =
                resolveFund(

                        organizationId,

                        request.fundId());

        boolean nextActive =
                request.active() != null

                        ? request.active()

                        : Boolean.TRUE.equals(
                                commitment
                                        .getActive());

        if (nextActive) {

            validateNoActiveAgreementOverlap(

                    organizationId,

                    request.beneficiaryId(),

                    request.fundId(),

                    request.startDate(),

                    request.endDate(),

                    commitment.getId());
        }

        commitment.setParty(
                recipient);

        commitment.setFund(
                fund);

        commitment.setAmount(
                request.amount());

        commitment.setStartDate(
                request.startDate());

        commitment.setEndDate(
                request.endDate());

        commitment.setActive(
                nextActive);

        commitment.setDescription(
                normalizeText(
                        request.description()));

        repository.saveAndFlush(
                commitment);

        recordAudit(

                organizationId,

                commitment.getId(),

                AuditAction.UPDATE,

                "Support commitment updated");

        return SupportAgreementMapper
                .toResponse(
                        commitment);
    }

    public SupportAgreementResponse
            createVersion(

                    UUID organizationId,

                    UUID id,

                    CreateSupportAgreementVersionRequest
                            request) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        FinancialCommitment previous =
                findEntityById(
                        organizationId,
                        id);

        if (!Boolean.TRUE.equals(
                previous.getActive())) {

            throw new BusinessException(
                    "Não é possível criar uma nova vigência a partir de um compromisso inativo.");
        }

        if (previous.getEndDate()
                != null) {

            throw new BusinessException(
                    "Este compromisso já possui uma data de fim. Crie um novo compromisso normalmente.");
        }

        if (!request.startDate()
                .isAfter(
                        previous
                                .getStartDate())) {

            throw new BusinessException(
                    "A nova vigência deve começar depois da data de início do compromisso atual.");
        }

        validateNoActiveAgreementOverlap(

                organizationId,

                previous
                        .getParty()
                        .getId(),

                previous
                        .getFund()
                        .getId(),

                request.startDate(),

                null,

                previous.getId());

        previous.setEndDate(

                request
                        .startDate()
                        .minusDays(1));

        FinancialCommitment next =
                new FinancialCommitment();

        next.setOrganization(
                previous
                        .getOrganization());

        next.setParty(
                previous
                        .getParty());

        next.setDesignatedRecipient(
                null);

        next.setFund(
                previous
                        .getFund());

        next.setDirection(
                FinancialCommitmentDirection
                        .PAYABLE);

        next.setCommitmentType(
                FinancialCommitmentType
                        .SUPPORT);

        next.setRecurrence(
                FinancialCommitmentRecurrence
                        .MONTHLY);

        next.setAmount(
                request.amount());

        next.setDueDay(
                previous
                        .getDueDay());

        next.setStartDate(
                request.startDate());

        next.setEndDate(
                null);

        next.setActive(
                true);

        next.setDescription(

                request.description() !=
                        null

                ? normalizeText(
                        request.description())

                : previous
                        .getDescription());

        repository.saveAndFlush(
                previous);

        repository.saveAndFlush(
                next);

        recordAudit(

                organizationId,

                previous.getId(),

                AuditAction.UPDATE,

                "Support commitment ended due to a new version");

        recordAudit(

                organizationId,

                next.getId(),

                AuditAction.CREATE,

                "New support commitment version created");

        return SupportAgreementMapper
                .toResponse(
                        next);
    }

    public void deactivate(

            UUID organizationId,

            UUID id) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        FinancialCommitment commitment =
                findEntityById(
                        organizationId,
                        id);

        if (!Boolean.TRUE.equals(
                commitment.getActive())) {

            return;
        }

        commitment.setActive(
                false);

        repository.save(
                commitment);

        recordAudit(

                organizationId,

                commitment.getId(),

                AuditAction.DEACTIVATE,

                "Support commitment deactivated");
    }

    public SupportAgreementResponse activate(

            UUID organizationId,

            UUID id) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        FinancialCommitment commitment =
                findEntityById(
                        organizationId,
                        id);

        if (Boolean.TRUE.equals(
                commitment.getActive())) {

            return SupportAgreementMapper
                    .toResponse(
                            commitment);
        }

        if (commitment.getEndDate() !=
                null

                && commitment
                        .getEndDate()
                        .isBefore(
                                LocalDate.now())) {

            throw new BusinessException(
                    "Update the end date before reactivating an expired support commitment");
        }

        validateNoActiveAgreementOverlap(

                organizationId,

                commitment
                        .getParty()
                        .getId(),

                commitment
                        .getFund()
                        .getId(),

                commitment
                        .getStartDate(),

                commitment
                        .getEndDate(),

                commitment.getId());

        commitment.setActive(
                true);

        repository.saveAndFlush(
                commitment);

        recordAudit(

                organizationId,

                commitment.getId(),

                AuditAction.ACTIVATE,

                "Support commitment activated");

        return SupportAgreementMapper
                .toResponse(
                        commitment);
    }

    @Transactional(readOnly = true)
    public List<SupportAgreementResponse>
            findActiveSuggestions(

                    UUID organizationId,

                    UUID beneficiaryId,

                    LocalDate referenceDate) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        resolveSupportRecipient(

                organizationId,

                beneficiaryId);

        LocalDate effectiveReferenceDate =
                referenceDate != null

                        ? referenceDate

                        : LocalDate.now();

        return repository
                .findActiveSupportSuggestionsByParty(

                        organizationId,

                        beneficiaryId,

                        effectiveReferenceDate)

                .stream()

                .map(
                        commitment ->
                                SupportAgreementMapper
                                        .toResponse(

                                                commitment,

                                                effectiveReferenceDate))

                .toList();
    }

    private FinancialCommitment
            findEntityById(

                    UUID organizationId,

                    UUID id) {

        return repository
                .findSupportByIdAndOrganizationId(

                        id,

                        organizationId)

                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Support commitment not found"));
    }

    private void validateDates(

            LocalDate startDate,

            LocalDate endDate) {

        if (endDate != null
                && endDate.isBefore(
                        startDate)) {

            throw new BusinessException(
                    "End date cannot be before start date");
        }
    }

    private void validateNoActiveAgreementOverlap(

            UUID organizationId,

            UUID beneficiaryId,

            UUID fundId,

            LocalDate startDate,

            LocalDate endDate,

            UUID excludedId) {

        boolean hasOverlap =
                repository
                        .existsActiveFinancialCommitmentOverlap(

                                organizationId,

                                FinancialCommitmentDirection
                                        .PAYABLE,

                                FinancialCommitmentType
                                        .SUPPORT,

                                FinancialCommitmentRecurrence
                                        .MONTHLY,

                                beneficiaryId,

                                null,

                                fundId,

                                startDate,

                                endDate,

                                excludedId);

        if (hasOverlap) {

            throw new BusinessException(
                    "There is already an active support commitment for this beneficiary and fund during the selected period");
        }
    }

    private Beneficiary
            resolveSupportRecipient(

                    UUID organizationId,

                    UUID financialPartyId) {

        Beneficiary financialParty =
                beneficiaryRepository
                        .findByIdAndOrganizationIdAndActiveTrue(

                                financialPartyId,

                                organizationId)

                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Payment recipient not found"));

        if (financialParty.getRoles() ==
                null

                || !financialParty
                        .getRoles()
                        .contains(
                                FinancialPartyRole
                                        .PAYMENT_RECIPIENT)) {

            throw new BusinessException(
                    "Financial party cannot be used as a support recipient");
        }

        return financialParty;
    }

    private Fund resolveFund(

            UUID organizationId,

            UUID fundId) {

        return fundRepository
                .findByIdAndOrganizationIdAndActiveTrue(

                        fundId,

                        organizationId)

                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Fund not found"));
    }

    private String normalizeText(
            String value) {

        if (value == null
                || value.isBlank()) {

            return null;
        }

        return value.trim();
    }

    private void recordAudit(

            UUID organizationId,

            UUID commitmentId,

            AuditAction action,

            String description) {

        auditLogService.record(

                organizationId,

                AuditEntityType
                        .FINANCIAL_COMMITMENT,

                commitmentId,

                action,

                description);
    }
}