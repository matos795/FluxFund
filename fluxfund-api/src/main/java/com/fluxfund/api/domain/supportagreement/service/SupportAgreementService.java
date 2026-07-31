package com.fluxfund.api.domain.supportagreement.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.FinancialPartyRole;
import com.fluxfund.api.domain.beneficiary.repository.BeneficiaryRepository;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.supportagreement.SupportAgreement;
import com.fluxfund.api.domain.supportagreement.SupportAgreementStatus;
import com.fluxfund.api.domain.supportagreement.dto.CreateSupportAgreementRequest;
import com.fluxfund.api.domain.supportagreement.dto.CreateSupportAgreementVersionRequest;
import com.fluxfund.api.domain.supportagreement.dto.SupportAgreementResponse;
import com.fluxfund.api.domain.supportagreement.dto.UpdateSupportAgreementRequest;
import com.fluxfund.api.domain.supportagreement.mapper.SupportAgreementMapper;
import com.fluxfund.api.domain.supportagreement.repository.SupportAgreementRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SupportAgreementService {

        private final SupportAgreementRepository repository;
        private final OrganizationRepository organizationRepository;
        private final BeneficiaryRepository beneficiaryRepository;
        private final FundRepository fundRepository;
        private final OrganizationAccessService organizationAccessService;
        private final AuditLogService auditLogService;

        public SupportAgreementResponse create(
                        UUID organizationId,
                        CreateSupportAgreementRequest request) {
                organizationAccessService.requireFinanceWriteAccess(organizationId);

                validateDates(request.startDate(), request.endDate());

                Organization organization = organizationRepository.findById(organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

                Beneficiary beneficiary = resolveSupportRecipient(organizationId, request.beneficiaryId());

                Fund fund = fundRepository
                                .findByIdAndOrganizationIdAndActiveTrue(request.fundId(), organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Fund not found"));

                validateNoActiveAgreementOverlap(
                                organizationId,
                                request.beneficiaryId(),
                                request.fundId(),
                                request.startDate(),
                                request.endDate(),
                                null);

                SupportAgreement agreement = new SupportAgreement();
                agreement.setOrganization(organization);
                agreement.setBeneficiary(beneficiary);
                agreement.setFund(fund);
                agreement.setDirection(FinancialCommitmentDirection.PAYABLE);
                agreement.setCommitmentType(FinancialCommitmentType.SUPPORT);
                agreement.setRecurrence(FinancialCommitmentRecurrence.MONTHLY);
                agreement.setDueDay(null);
                agreement.setAmount(request.amount());
                agreement.setStartDate(request.startDate());
                agreement.setEndDate(request.endDate());
                agreement.setActive(true);
                agreement.setDescription(request.description());

                repository.save(agreement);

                auditLogService.record(
                                organizationId,
                                AuditEntityType.SUPPORT_AGREEMENT,
                                agreement.getId(),
                                AuditAction.CREATE,
                                "Support agreement created");

                return SupportAgreementMapper.toResponse(agreement);
        }

        @Transactional(readOnly = true)
        public Page<SupportAgreementResponse> findAll(
                        UUID organizationId,
                        SupportAgreementStatus status,
                        Pageable pageable) {

                organizationAccessService.requireReadAccess(organizationId);

                LocalDate referenceDate = LocalDate.now();

                Page<SupportAgreement> agreements;

                if (status == null) {
                        agreements = repository.findAllSupportByOrganizationId(organizationId, pageable);
                } else {
                        agreements = switch (status) {
                                case ACTIVE -> repository.findCurrentActive(
                                                organizationId,
                                                referenceDate,
                                                pageable);

                                case SCHEDULED -> repository.findScheduled(
                                                organizationId,
                                                referenceDate,
                                                pageable);

                                case EXPIRED -> repository.findExpired(
                                                organizationId,
                                                referenceDate,
                                                pageable);

                                case INACTIVE -> repository.findInactive(
                                                organizationId,
                                                pageable);
                        };
                }

                return agreements.map(agreement -> SupportAgreementMapper.toResponse(
                                agreement,
                                referenceDate));
        }

        @Transactional(readOnly = true)
        public SupportAgreementResponse findById(UUID organizationId, UUID id) {
                organizationAccessService.requireReadAccess(organizationId);

                SupportAgreement agreement = findEntityById(organizationId, id);

                return SupportAgreementMapper.toResponse(agreement);
        }

        public SupportAgreementResponse update(
                        UUID organizationId,
                        UUID id,
                        UpdateSupportAgreementRequest request) {
                organizationAccessService.requireFinanceWriteAccess(organizationId);

                validateDates(request.startDate(), request.endDate());

                SupportAgreement agreement = findEntityById(organizationId, id);

                Beneficiary beneficiary = resolveSupportRecipient(organizationId, request.beneficiaryId());

                Fund fund = fundRepository
                                .findByIdAndOrganizationIdAndActiveTrue(request.fundId(), organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Fund not found"));

                boolean nextActive = request.active() != null
                                ? request.active()
                                : agreement.getActive();

                if (nextActive) {
                        validateNoActiveAgreementOverlap(
                                        organizationId,
                                        request.beneficiaryId(),
                                        request.fundId(),
                                        request.startDate(),
                                        request.endDate(),
                                        agreement.getId());
                }

                agreement.setBeneficiary(beneficiary);
                agreement.setFund(fund);
                agreement.setAmount(request.amount());
                agreement.setStartDate(request.startDate());
                agreement.setEndDate(request.endDate());
                agreement.setActive(request.active() != null ? request.active() : agreement.getActive());
                agreement.setDescription(request.description());

                repository.save(agreement);

                auditLogService.record(
                                organizationId,
                                AuditEntityType.SUPPORT_AGREEMENT,
                                agreement.getId(),
                                AuditAction.UPDATE,
                                "Support agreement updated");

                return SupportAgreementMapper.toResponse(agreement);
        }

        public SupportAgreementResponse createVersion(
                        UUID organizationId,
                        UUID id,
                        CreateSupportAgreementVersionRequest request) {

                organizationAccessService.requireFinanceWriteAccess(organizationId);

                SupportAgreement previousAgreement = findEntityById(organizationId, id);

                if (!previousAgreement.getActive()) {
                        throw new BusinessException(
                                        "Não é possível criar uma nova vigência a partir de um compromisso inativo.");
                }

                if (previousAgreement.getEndDate() != null) {
                        throw new BusinessException(
                                        "Este compromisso já possui uma data de fim. "
                                                        + "Crie um novo compromisso normalmente.");
                }

                if (!request.startDate().isAfter(previousAgreement.getStartDate())) {
                        throw new BusinessException(
                                        "A nova vigência deve começar depois da data de início do compromisso atual.");
                }

                validateNoActiveAgreementOverlap(
                                organizationId,
                                previousAgreement.getBeneficiary().getId(),
                                previousAgreement.getFund().getId(),
                                request.startDate(),
                                null,
                                previousAgreement.getId());

                previousAgreement.setEndDate(request.startDate().minusDays(1));

                SupportAgreement nextAgreement = new SupportAgreement();
                nextAgreement.setOrganization(previousAgreement.getOrganization());
                nextAgreement.setBeneficiary(previousAgreement.getBeneficiary());
                nextAgreement.setFund(previousAgreement.getFund());
                nextAgreement.setDirection(previousAgreement.getDirection());
                nextAgreement.setCommitmentType(previousAgreement.getCommitmentType());
                nextAgreement.setRecurrence(previousAgreement.getRecurrence());
                nextAgreement.setDueDay(previousAgreement.getDueDay());
                nextAgreement.setAmount(request.amount());
                nextAgreement.setStartDate(request.startDate());
                nextAgreement.setEndDate(null);
                nextAgreement.setActive(true);
                nextAgreement.setDescription(
                                request.description() != null
                                                ? request.description()
                                                : previousAgreement.getDescription());

                repository.save(previousAgreement);
                repository.save(nextAgreement);

                auditLogService.record(
                                organizationId,
                                AuditEntityType.SUPPORT_AGREEMENT,
                                previousAgreement.getId(),
                                AuditAction.UPDATE,
                                "Support agreement ended due to a new version.");

                auditLogService.record(
                                organizationId,
                                AuditEntityType.SUPPORT_AGREEMENT,
                                nextAgreement.getId(),
                                AuditAction.CREATE,
                                "New support agreement version created.");

                return SupportAgreementMapper.toResponse(nextAgreement);
        }

        public void deactivate(UUID organizationId, UUID id) {
                organizationAccessService.requireFinanceWriteAccess(organizationId);

                SupportAgreement agreement = findEntityById(organizationId, id);
                agreement.setActive(false);

                repository.save(agreement);

                auditLogService.record(
                                organizationId,
                                AuditEntityType.SUPPORT_AGREEMENT,
                                agreement.getId(),
                                AuditAction.DEACTIVATE,
                                "Support agreement deactivated");
        }

        public SupportAgreementResponse activate(UUID organizationId, UUID id) {
                organizationAccessService.requireFinanceWriteAccess(organizationId);

                SupportAgreement agreement = findEntityById(organizationId, id);

                if (agreement.getActive()) {
                        return SupportAgreementMapper.toResponse(agreement);
                }

                if (agreement.getEndDate() != null
                                && agreement.getEndDate().isBefore(LocalDate.now())) {
                        throw new BusinessException(
                                        "Update the end date before reactivating an expired support agreement");
                }

                validateNoActiveAgreementOverlap(
                                organizationId,
                                agreement.getBeneficiary().getId(),
                                agreement.getFund().getId(),
                                agreement.getStartDate(),
                                agreement.getEndDate(),
                                agreement.getId());

                agreement.setActive(true);

                repository.save(agreement);

                auditLogService.record(
                                organizationId,
                                AuditEntityType.SUPPORT_AGREEMENT,
                                agreement.getId(),
                                AuditAction.ACTIVATE,
                                "Support agreement activated");

                return SupportAgreementMapper.toResponse(agreement);
        }

        @Transactional(readOnly = true)
        public List<SupportAgreementResponse> findActiveSuggestions(
                        UUID organizationId,
                        UUID beneficiaryId,
                        LocalDate referenceDate) {
                organizationAccessService.requireReadAccess(organizationId);

                resolveSupportRecipient(organizationId, beneficiaryId);

                LocalDate effectiveReferenceDate = referenceDate != null ? referenceDate : LocalDate.now();

                return repository
                                .findActiveSuggestionsByBeneficiary(
                                                organizationId,
                                                beneficiaryId,
                                                effectiveReferenceDate)
                                .stream()
                                .map(agreement -> SupportAgreementMapper.toResponse(
                                                agreement,
                                                effectiveReferenceDate))
                                .toList();
        }

        private SupportAgreement findEntityById(UUID organizationId, UUID id) {
                return repository.findSupportByIdAndOrganizationId(id, organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Support agreement not found"));
        }

        private void validateDates(java.time.LocalDate startDate, java.time.LocalDate endDate) {
                if (endDate != null && endDate.isBefore(startDate)) {
                        throw new BusinessException("End date cannot be before start date");
                }
        }

        private void validateNoActiveAgreementOverlap(
                        UUID organizationId,
                        UUID beneficiaryId,
                        UUID fundId,
                        LocalDate startDate,
                        LocalDate endDate,
                        UUID excludedId) {

                boolean hasOverlap = repository
                                .existsActiveAgreementOverlappingPeriod(
                                                organizationId,
                                                beneficiaryId,
                                                fundId,
                                                startDate,
                                                endDate,
                                                excludedId);

                if (hasOverlap) {
                        throw new BusinessException(
                                        "There is already an active support agreement for this beneficiary and fund during the selected period");
                }
        }

        private Beneficiary resolveSupportRecipient(UUID organizationId, UUID financialPartyId) {

                Beneficiary financialParty = beneficiaryRepository
                                .findByIdAndOrganizationIdAndActiveTrue(financialPartyId, organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Payment recipient not found"));

                if (financialParty.getRoles() == null
                                || !financialParty.getRoles().contains(FinancialPartyRole.PAYMENT_RECIPIENT)) {
                        throw new BusinessException("Financial party cannot be used as a support recipient");
                }

                return financialParty;
        }
}