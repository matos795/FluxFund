package com.fluxfund.api.domain.organization.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.Iterator;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.dto.CreateOrganizationRequest;
import com.fluxfund.api.domain.organization.dto.OrganizationLogoFile;
import com.fluxfund.api.domain.organization.dto.OrganizationResponse;
import com.fluxfund.api.domain.organization.dto.UpdateOrganizationProfileRequest;
import com.fluxfund.api.domain.organization.mapper.OrganizationMapper;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.storage.LocalFileStorageService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationAccessService organizationAccessService;
    private final LocalFileStorageService storageService;
    private final AuditLogService auditLogService;

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

    private static final long MAX_LOGO_SIZE_BYTES = 2L * 1024 * 1024;
    private static final int MAX_LOGO_DIMENSION = 4096;
    private static final long MAX_LOGO_PIXELS = 12_000_000L;

    public OrganizationResponse uploadCurrentLogo(
            UUID organizationId,
            MultipartFile file) {

        organizationAccessService.requireAdminAccess(organizationId);

        Organization organization = findActiveOrganization(organizationId);

        ValidatedLogo validatedLogo = validateLogo(file);

        String storageKey = "organizations/%s/profile/logo/%s.%s"
                .formatted(
                        organizationId,
                        UUID.randomUUID(),
                        validatedLogo.extension());

        try (InputStream inputStream = file.getInputStream()) {
            storageService.save(storageKey, inputStream);
        } catch (IOException exception) {
            throw new BusinessException("Could not process organization logo");
        }

        String previousStorageKey = organization.getLogoStorageKey();

        try {
            organization.setLogoOriginalFilename(
                    sanitizeFilename(file.getOriginalFilename()));
            organization.setLogoContentType(validatedLogo.contentType());
            organization.setLogoSizeBytes(file.getSize());
            organization.setLogoStorageKey(storageKey);
            organization.setLogoUploadedAt(OffsetDateTime.now());

            organizationRepository.saveAndFlush(organization);

            auditLogService.record(
                    organizationId,
                    AuditEntityType.ORGANIZATION,
                    organizationId,
                    AuditAction.UPLOAD_ORGANIZATION_LOGO,
                    "Organization logo uploaded");

        } catch (RuntimeException exception) {
            deleteQuietly(storageKey);
            throw exception;
        }

        if (previousStorageKey != null
                && !previousStorageKey.equals(storageKey)) {
            deleteQuietly(previousStorageKey);
        }

        return OrganizationMapper.toResponse(organization);
    }

    @Transactional(readOnly = true)
    public OrganizationLogoFile downloadCurrentLogo(UUID organizationId) {
        organizationAccessService.requireReadAccess(organizationId);

        Organization organization = findActiveOrganization(organizationId);

        if (organization.getLogoStorageKey() == null) {
            throw new ResourceNotFoundException("Organization logo not found");
        }

        return new OrganizationLogoFile(
                organization.getLogoOriginalFilename(),
                organization.getLogoContentType(),
                storageService.read(organization.getLogoStorageKey()));
    }

    public void deleteCurrentLogo(UUID organizationId) {
        organizationAccessService.requireAdminAccess(organizationId);

        Organization organization = findActiveOrganization(organizationId);

        if (organization.getLogoStorageKey() == null) {
            throw new ResourceNotFoundException("Organization logo not found");
        }

        String storageKey = organization.getLogoStorageKey();

        clearLogoMetadata(organization);

        organizationRepository.saveAndFlush(organization);

        auditLogService.record(
                organizationId,
                AuditEntityType.ORGANIZATION,
                organizationId,
                AuditAction.DELETE_ORGANIZATION_LOGO,
                "Organization logo deleted");

        deleteQuietly(storageKey);
    }

    private Organization findActiveOrganization(UUID organizationId) {
        return organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
    }

    private ValidatedLogo validateLogo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Organization logo is required");
        }

        if (file.getSize() > MAX_LOGO_SIZE_BYTES) {
            throw new BusinessException(
                    "Organization logo must have at most 2MB");
        }

        String filename = file.getOriginalFilename();

        if (filename == null || filename.isBlank()) {
            throw new BusinessException("Invalid organization logo filename");
        }

        String extension = getExtension(filename);

        if (!extension.equals("png")
                && !extension.equals("jpg")
                && !extension.equals("jpeg")) {
            throw new BusinessException(
                    "Organization logo must be a PNG or JPG image");
        }

        try (
                InputStream inputStream = file.getInputStream();
                ImageInputStream imageInput = ImageIO.createImageInputStream(inputStream)) {
            if (imageInput == null) {
                throw new BusinessException("Invalid organization logo");
            }

            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInput);

            if (!readers.hasNext()) {
                throw new BusinessException(
                        "File content is not a valid image");
            }

            ImageReader reader = readers.next();

            try {
                reader.setInput(imageInput, true, true);

                String format = reader.getFormatName()
                        .toLowerCase(Locale.ROOT);

                String canonicalExtension;
                String contentType;

                if ("png".equals(format)) {
                    canonicalExtension = "png";
                    contentType = "image/png";
                } else if ("jpeg".equals(format)
                        || "jpg".equals(format)) {
                    canonicalExtension = "jpg";
                    contentType = "image/jpeg";
                } else {
                    throw new BusinessException(
                            "Organization logo must be a PNG or JPG image");
                }

                boolean extensionMatches = ("png".equals(canonicalExtension)
                        && "png".equals(extension))
                        || ("jpg".equals(canonicalExtension)
                                && ("jpg".equals(extension)
                                        || "jpeg".equals(extension)));

                if (!extensionMatches) {
                    throw new BusinessException(
                            "Image content does not match its extension");
                }

                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                if (width <= 0 || height <= 0) {
                    throw new BusinessException("Invalid image dimensions");
                }

                if (width > MAX_LOGO_DIMENSION
                        || height > MAX_LOGO_DIMENSION
                        || (long) width * height > MAX_LOGO_PIXELS) {
                    throw new BusinessException(
                            "Organization logo dimensions are too large");
                }

                return new ValidatedLogo(
                        canonicalExtension,
                        contentType);

            } finally {
                reader.dispose();
            }

        } catch (IOException exception) {
            throw new BusinessException(
                    "Could not validate organization logo");
        }
    }

    private void clearLogoMetadata(Organization organization) {
        organization.setLogoOriginalFilename(null);
        organization.setLogoContentType(null);
        organization.setLogoSizeBytes(null);
        organization.setLogoStorageKey(null);
        organization.setLogoUploadedAt(null);
    }

    private void deleteQuietly(String storageKey) {
        try {
            storageService.delete(storageKey);
        } catch (RuntimeException exception) {
            // Arquivo antigo pode ser limpo manualmente em caso excepcional.
        }
    }

    private String sanitizeFilename(String filename) {
        String sanitized = filename
                .replace("\\", "_")
                .replace("/", "_")
                .replace("..", "_")
                .replace("\r", "_")
                .replace("\n", "_")
                .trim();

        if (sanitized.isBlank()) {
            return "organization-logo.png";
        }

        return sanitized.length() > 255
                ? sanitized.substring(0, 255)
                : sanitized;
    }

    private String getExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');

        if (lastDotIndex < 0 || lastDotIndex == filename.length() - 1) {
            return "";
        }

        return filename
                .substring(lastDotIndex + 1)
                .toLowerCase(Locale.ROOT);
    }

    private record ValidatedLogo(
            String extension,
            String contentType) {
    }
}
