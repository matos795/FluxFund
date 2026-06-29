package com.fluxfund.api.domain.beneficiary.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.dto.BeneficiaryResponse;
import com.fluxfund.api.domain.beneficiary.dto.CreateBeneficiaryRequest;
import com.fluxfund.api.domain.beneficiary.dto.UpdateBeneficiaryRequest;
import com.fluxfund.api.domain.beneficiary.mapper.BeneficiaryMapper;
import com.fluxfund.api.domain.beneficiary.repository.BeneficiaryRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.dto.OptionResponse;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.util.DocumentNormalizer;
import com.fluxfund.api.shared.util.StringNormalizer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BeneficiaryService {

    private final BeneficiaryRepository repository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationAccessService organizationAccessService;

    public BeneficiaryResponse create(CreateBeneficiaryRequest request, UUID organizationId) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        Organization organization = organizationRepository.findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        validateBeneficiaryName(organizationId, request.name(), null);
        validateBeneficiaryDocument(organizationId, request.document(), null);

        Beneficiary beneficiary = BeneficiaryMapper.createEntity(request, organization);

        repository.save(beneficiary);

        return BeneficiaryMapper.toResponse(beneficiary);
    }

    @Transactional(readOnly = true)
    public Page<BeneficiaryResponse> findAll(
            UUID organizationId,
            Pageable pageable) {
        organizationAccessService.requireReadAccess(organizationId);

        return repository
                .findAllByOrganizationIdAndActiveTrue(organizationId, pageable)
                .map(BeneficiaryMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public BeneficiaryResponse findById(UUID id, UUID organizationId) {
        organizationAccessService.requireReadAccess(organizationId);

        Beneficiary beneficiary = findBeneficiaryById(id, organizationId);

        return BeneficiaryMapper.toResponse(beneficiary);
    }

    public BeneficiaryResponse update(
            UUID organizationId,
            UUID id,
            UpdateBeneficiaryRequest request) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        Beneficiary beneficiary = findBeneficiaryById(id, organizationId);

        if (request.name() != null) {

            validateBeneficiaryName(
                    beneficiary.getOrganization().getId(),
                    request.name(),
                    beneficiary.getId());
        }

        if (request.document() != null) {

            validateBeneficiaryDocument(
                    beneficiary.getOrganization().getId(),
                    request.document(),
                    beneficiary.getId());
        }

        BeneficiaryMapper.updateEntity(beneficiary, request);
        repository.save(beneficiary);

        return BeneficiaryMapper.toResponse(beneficiary);
    }

    public void delete(UUID id, UUID organizationId) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        Beneficiary beneficiary = findBeneficiaryById(id, organizationId);

        beneficiary.setActive(false);
        repository.save(beneficiary);
    }

    @Transactional(readOnly = true)
    public List<OptionResponse> findOptions(UUID organizationId) {
        organizationAccessService.requireReadAccess(organizationId);

        return repository.findByOrganizationIdAndActiveTrueOrderByNameAsc(organizationId)
                .stream()
                .map(beneficiary -> new OptionResponse(
                        beneficiary.getId(),
                        beneficiary.getName()))
                .toList();
    }

    private Beneficiary findBeneficiaryById(UUID id, UUID organizationId) {
        return repository.findByIdAndOrganizationIdAndActiveTrue(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found"));
    }

    private void validateBeneficiaryName(
            UUID organizationId,
            String name,
            UUID currentBeneficiaryId) {

        String normalizedName = StringNormalizer.normalize(name);

        if (normalizedName == null) {
            throw new BusinessException("Beneficiary name cannot be blank");
        }

        boolean exists = currentBeneficiaryId == null
                ? repository.existsByOrganizationIdAndNameIgnoreCase(
                        organizationId,
                        normalizedName)
                : repository.existsByOrganizationIdAndNameIgnoreCaseAndIdNot(
                        organizationId,
                        normalizedName,
                        currentBeneficiaryId);

        if (exists) {
            throw new BusinessException("Beneficiary name already exists");
        }
    }

    private void validateBeneficiaryDocument(
            UUID organizationId,
            String document,
            UUID currentBeneficiaryId) {

        String normalizedDocument = DocumentNormalizer.normalize(document);

        if (normalizedDocument == null) {
            return;
        }

        boolean exists = currentBeneficiaryId == null
                ? repository.existsByOrganizationIdAndDocument(organizationId, normalizedDocument)
                : repository.existsByOrganizationIdAndDocumentAndIdNot(organizationId, normalizedDocument,
                        currentBeneficiaryId);

        if (exists) {
            throw new BusinessException("Beneficiary document already exists");
        }
    }
}
