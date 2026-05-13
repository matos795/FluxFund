package com.fluxfund.api.domain.fund.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.dto.CreateFundRequest;
import com.fluxfund.api.domain.fund.dto.FundResponse;
import com.fluxfund.api.domain.fund.dto.UpdateFundRequest;
import com.fluxfund.api.domain.fund.mapper.FundMapper;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.util.StringNormalizer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FundService {

    private final FundRepository repository;
    private final OrganizationRepository organizationRepository;

    public FundResponse create(CreateFundRequest request, UUID organizationId) {

        Organization organization = organizationRepository.findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        validateFundName(organizationId, request.name(), null);

        Fund fund = FundMapper.createEntity(request, organization);

        repository.save(fund);

        return FundMapper.toResponse(fund);
    }

    @Transactional(readOnly = true)
    public Page<FundResponse> findAll(

            UUID organizationId,
            Pageable pageable) {

        return repository
                .findAllByOrganizationIdAndActiveTrue(organizationId, pageable)
                .map(FundMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public FundResponse findById(UUID id, UUID organizationId) {

        Fund fund = findFundById(id, organizationId);

        return FundMapper.toResponse(fund);
    }

    public FundResponse update(
            UUID id,
            UUID organizationId,
            UpdateFundRequest request) {

        Fund fund = findFundById(id, organizationId);

        if (request.name() != null) {

            validateFundName(
                    fund.getOrganization().getId(),
                    request.name(),
                    fund.getId());
        }

        FundMapper.updateEntity(fund, request);
        repository.save(fund);

        return FundMapper.toResponse(fund);
    }

    public void delete(UUID id, UUID organizationId) {

        Fund fund = findFundById(id, organizationId);

        fund.setActive(false);
        repository.save(fund);
    }

    private Fund findFundById(UUID id, UUID organizationId) {
        return repository.findByIdAndOrganizationIdAndActiveTrue(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Fund not found"));
    }

    private void validateFundName(
            UUID organizationId,
            String name,
            UUID currentFundId) {

        String normalizedName = StringNormalizer.normalize(name);

        if (normalizedName == null) {
            throw new BusinessException("Fund name cannot be blank");
        }

        boolean exists = currentFundId == null
                ? repository.existsByOrganizationIdAndNameIgnoreCase(
                        organizationId,
                        normalizedName)
                : repository.existsByOrganizationIdAndNameIgnoreCaseAndIdNot(
                        organizationId,
                        normalizedName,
                        currentFundId);

        if (exists) {
            throw new BusinessException("Fund name already exists");
        }
    }
}
