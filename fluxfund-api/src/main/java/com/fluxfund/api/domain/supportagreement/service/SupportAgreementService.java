package com.fluxfund.api.domain.supportagreement.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.repository.BeneficiaryRepository;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.domain.supportagreement.SupportAgreement;
import com.fluxfund.api.domain.supportagreement.dto.CreateSupportAgreementRequest;
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

    public SupportAgreementResponse create(CreateSupportAgreementRequest request) {
        organizationAccessService.requireFinanceWriteAccess(request.organizationId());
        
        validateDates(request.startDate(), request.endDate());

        Organization organization = organizationRepository.findById(request.organizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Beneficiary beneficiary = beneficiaryRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.beneficiaryId(), request.organizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found"));

        Fund fund = fundRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.fundId(), request.organizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Fund not found"));

        boolean alreadyExists = repository.existsByOrganizationIdAndBeneficiaryIdAndFundIdAndActiveTrue(
                request.organizationId(),
                request.beneficiaryId(),
                request.fundId());

        if (alreadyExists) {
            throw new BusinessException("There is already an active support agreement for this beneficiary and fund");
        }

        SupportAgreement agreement = new SupportAgreement();
        agreement.setOrganization(organization);
        agreement.setBeneficiary(beneficiary);
        agreement.setFund(fund);
        agreement.setAmount(request.amount());
        agreement.setStartDate(request.startDate());
        agreement.setEndDate(request.endDate());
        agreement.setActive(true);
        agreement.setDescription(request.description());

        repository.save(agreement);

        return SupportAgreementMapper.toResponse(agreement);
    }

    @Transactional(readOnly = true)
    public Page<SupportAgreementResponse> findAll(
            UUID organizationId,
            Boolean active,
            Pageable pageable) {
        organizationAccessService.requireReadAccess(organizationId);
        Page<SupportAgreement> agreements;

        if (active == null) {
            agreements = repository.findAllByOrganizationId(organizationId, pageable);
        } else if (active) {
            agreements = repository.findAllByOrganizationIdAndActiveTrue(organizationId, pageable);
        } else {
            agreements = repository.findAllByOrganizationIdAndActiveFalse(organizationId, pageable);
        }

        return agreements.map(SupportAgreementMapper::toResponse);
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

        Beneficiary beneficiary = beneficiaryRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.beneficiaryId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found"));

        Fund fund = fundRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.fundId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Fund not found"));

        agreement.setBeneficiary(beneficiary);
        agreement.setFund(fund);
        agreement.setAmount(request.amount());
        agreement.setStartDate(request.startDate());
        agreement.setEndDate(request.endDate());
        agreement.setActive(request.active() != null ? request.active() : agreement.getActive());
        agreement.setDescription(request.description());

        repository.save(agreement);

        return SupportAgreementMapper.toResponse(agreement);
    }

    public void deactivate(UUID organizationId, UUID id) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        SupportAgreement agreement = findEntityById(organizationId, id);
        agreement.setActive(false);

        repository.save(agreement);
    }

    public SupportAgreementResponse activate(UUID organizationId, UUID id) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);
        
        SupportAgreement agreement = findEntityById(organizationId, id);

        if (agreement.getActive()) {
            return SupportAgreementMapper.toResponse(agreement);
        }

        boolean alreadyExists = repository.existsByOrganizationIdAndBeneficiaryIdAndFundIdAndActiveTrue(
                organizationId,
                agreement.getBeneficiary().getId(),
                agreement.getFund().getId());

        if (alreadyExists) {
            throw new BusinessException(
                    "There is already an active support agreement for this beneficiary and fund");
        }

        agreement.setActive(true);

        repository.save(agreement);

        return SupportAgreementMapper.toResponse(agreement);
    }

    private SupportAgreement findEntityById(UUID organizationId, UUID id) {
        return repository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Support agreement not found"));
    }

    private void validateDates(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (endDate != null && endDate.isBefore(startDate)) {
            throw new BusinessException("End date cannot be before start date");
        }
    }
}