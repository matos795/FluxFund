package com.fluxfund.api.domain.beneficiary.service;

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
import com.fluxfund.api.domain.organization.OrganizationRepository;
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

    public BeneficiaryResponse create(CreateBeneficiaryRequest request) {

        UUID organizationId = request.organizationId();

        Organization organization = organizationRepository.findById(organizationId)
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

        return repository
                .findAllByOrganizationIdAndActiveTrue(organizationId, pageable)
                .map(BeneficiaryMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public BeneficiaryResponse findById(UUID id) {

        Beneficiary beneficiary = findBeneficiaryById(id);

        return BeneficiaryMapper.toResponse(beneficiary);
    }

    public BeneficiaryResponse update(
            UUID id,
            UpdateBeneficiaryRequest request) {

        Beneficiary beneficiary = findBeneficiaryById(id);

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

    public void delete(UUID id) {

        Beneficiary beneficiary = findBeneficiaryById(id);

        beneficiary.setActive(false);
        repository.save(beneficiary);
    }

    private Beneficiary findBeneficiaryById(UUID id) {
        return repository.findById(id)
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
                : repository.existsByOrganizationIdAndDocumentAndIdNot(organizationId, normalizedDocument, currentBeneficiaryId);

        if (exists) {
            throw new BusinessException("Beneficiary document already exists");
        }
    }
}
