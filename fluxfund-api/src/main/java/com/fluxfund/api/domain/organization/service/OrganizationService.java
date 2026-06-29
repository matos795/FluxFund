package com.fluxfund.api.domain.organization.service;

import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.dto.CreateOrganizationRequest;
import com.fluxfund.api.domain.organization.dto.OrganizationResponse;
import com.fluxfund.api.domain.organization.dto.UpdateOrganizationProfileRequest;
import com.fluxfund.api.domain.organization.mapper.OrganizationMapper;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationAccessService organizationAccessService;

    public OrganizationResponse create(CreateOrganizationRequest request) {
        Organization organization = new Organization();
        organization.setName(request.name());

        Organization savedOrganization = organizationRepository.save(organization);

        return OrganizationMapper.toResponse(savedOrganization);
    }

    public Page<OrganizationResponse> findAll(Pageable pageable) {
        Objects.requireNonNull(pageable, "pageable must not be null");
        return organizationRepository.findAll(pageable)
                .map(OrganizationMapper::toResponse);
    }

    public OrganizationResponse findById(UUID id) {
        Objects.requireNonNull(id, "id must not be null");
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        return OrganizationMapper.toResponse(organization);
    }

    public OrganizationResponse update(UUID id, CreateOrganizationRequest request) {
        Objects.requireNonNull(id, "id must not be null");
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        organization.setName(request.name());

        Organization updatedOrganization = organizationRepository.save(organization);

        return OrganizationMapper.toResponse(updatedOrganization);
    }

    public void delete(UUID id) {
        Objects.requireNonNull(id, "id must not be null");
        if (!organizationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Organization not found");
        }

        organizationRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public OrganizationResponse findCurrent(UUID organizationId) {
        organizationAccessService.requireReadAccess(organizationId);

        Organization organization = organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        return OrganizationMapper.toResponse(organization);
    }

    public OrganizationResponse updateCurrent(
            UUID organizationId,
            UpdateOrganizationProfileRequest request) {

        organizationAccessService.requireAdminAccess(organizationId);

        Organization organization = organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        applyOrganizationProfile(organization, request);

        return OrganizationMapper.toResponse(
                organizationRepository.save(organization));
    }

    private void applyOrganizationProfile(
            Organization organization,
            UpdateOrganizationProfileRequest request) {

        organization.setName(request.name().trim());

        if (request.legalName() != null) {
            organization.setLegalName(
                    normalizeOptionalText(request.legalName()));
        }

        if (request.cnpj() != null) {
            organization.setCnpj(normalizeCnpj(request.cnpj()));
        }

        if (request.contactEmail() != null) {
            organization.setContactEmail(
                    normalizeOptionalText(request.contactEmail()));
        }

        if (request.contactPhone() != null) {
            organization.setContactPhone(
                    normalizeOptionalText(request.contactPhone()));
        }

        if (request.addressLine() != null) {
            organization.setAddressLine(
                    normalizeOptionalText(request.addressLine()));
        }

        if (request.addressNumber() != null) {
            organization.setAddressNumber(
                    normalizeOptionalText(request.addressNumber()));
        }

        if (request.addressComplement() != null) {
            organization.setAddressComplement(
                    normalizeOptionalText(request.addressComplement()));
        }

        if (request.neighborhood() != null) {
            organization.setNeighborhood(
                    normalizeOptionalText(request.neighborhood()));
        }

        if (request.city() != null) {
            organization.setCity(
                    normalizeOptionalText(request.city()));
        }

        if (request.state() != null) {
            organization.setState(normalizeState(request.state()));
        }

        if (request.zipCode() != null) {
            organization.setZipCode(normalizeZipCode(request.zipCode()));
        }

        if (request.reviewerName() != null) {
            organization.setReviewerName(
                    normalizeOptionalText(request.reviewerName()));
        }

        if (request.reviewerTitle() != null) {
            organization.setReviewerTitle(
                    normalizeOptionalText(request.reviewerTitle()));
        }

        if (request.approverName() != null) {
            organization.setApproverName(
                    normalizeOptionalText(request.approverName()));
        }

        if (request.approverTitle() != null) {
            organization.setApproverTitle(
                    normalizeOptionalText(request.approverTitle()));
        }
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value
                .replace("\r", " ")
                .replace("\n", " ")
                .trim();

        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeCnpj(String value) {
        String normalized = normalizeOptionalText(value);

        if (normalized == null) {
            return null;
        }

        String digits = normalized.replaceAll("\\D", "");

        if (digits.length() != 14 || !isValidCnpj(digits)) {
            throw new BusinessException("Invalid CNPJ");
        }

        return digits;
    }

    private String normalizeState(String value) {
        String normalized = normalizeOptionalText(value);

        if (normalized == null) {
            return null;
        }

        String state = normalized.toUpperCase(Locale.ROOT);

        if (!state.matches("[A-Z]{2}")) {
            throw new BusinessException(
                    "State must contain exactly two letters");
        }

        return state;
    }

    private String normalizeZipCode(String value) {
        String normalized = normalizeOptionalText(value);

        if (normalized == null) {
            return null;
        }

        String digits = normalized.replaceAll("\\D", "");

        if (digits.length() != 8) {
            throw new BusinessException("Invalid ZIP code");
        }

        return digits;
    }

    private boolean isValidCnpj(String cnpj) {
        if (cnpj.chars().distinct().count() == 1) {
            return false;
        }

        int firstDigit = calculateCnpjDigit(
                cnpj.substring(0, 12),
                new int[] { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 });

        int secondDigit = calculateCnpjDigit(
                cnpj.substring(0, 12) + firstDigit,
                new int[] { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 });

        return cnpj.equals(
                cnpj.substring(0, 12)
                        + firstDigit
                        + secondDigit);
    }

    private int calculateCnpjDigit(
            String value,
            int[] weights) {

        int total = 0;

        for (int index = 0; index < weights.length; index++) {
            total += Character.getNumericValue(value.charAt(index))
                    * weights[index];
        }

        int remainder = total % 11;

        return remainder < 2 ? 0 : 11 - remainder;
    }
}
