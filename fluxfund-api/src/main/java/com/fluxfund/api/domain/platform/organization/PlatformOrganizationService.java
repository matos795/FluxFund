package com.fluxfund.api.domain.platform.organization;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.organizationsettings.service.OrganizationSettingsService;
import com.fluxfund.api.domain.organizationuser.OrganizationRole;
import com.fluxfund.api.domain.organizationuser.OrganizationUserRepository;
import com.fluxfund.api.domain.organizationuser.dto.OrganizationUserResponse;
import com.fluxfund.api.domain.organizationuser.invitation.OrganizationUserInvitationMapper;
import com.fluxfund.api.domain.organizationuser.invitation.OrganizationUserInvitationRepository;
import com.fluxfund.api.domain.organizationuser.invitation.OrganizationUserInvitationService;
import com.fluxfund.api.domain.organizationuser.invitation.dto.CreateOrganizationUserInvitationRequest;
import com.fluxfund.api.domain.organizationuser.invitation.dto.CreateOrganizationUserInvitationResponse;
import com.fluxfund.api.domain.organizationuser.invitation.dto.OrganizationUserInvitationResponse;
import com.fluxfund.api.domain.organizationuser.mapper.OrganizationUserMapper;
import com.fluxfund.api.domain.platform.organization.dto.CreatePlatformOrganizationRequest;
import com.fluxfund.api.domain.platform.organization.dto.CreatePlatformOrganizationResponse;
import com.fluxfund.api.domain.platform.organization.dto.PlatformOrganizationDetailsResponse;
import com.fluxfund.api.domain.platform.organization.dto.PlatformOrganizationResponse;
import com.fluxfund.api.domain.platform.organization.dto.UpdatePlatformOrganizationStatusRequest;
import com.fluxfund.api.domain.platform.organization.onboarding.PlatformOrganizationOnboardingService;
import com.fluxfund.api.security.PlatformAccessService;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.util.EmailNormalizer;
import com.fluxfund.api.shared.util.StringNormalizer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PlatformOrganizationService {

    private final OrganizationRepository organizationRepository;

    private final OrganizationUserRepository organizationUserRepository;

    private final OrganizationUserInvitationRepository invitationRepository;

    private final OrganizationUserInvitationService invitationService;

    private final OrganizationSettingsService organizationSettingsService;

    private final PlatformAccessService platformAccessService;

    private final AuditLogService auditLogService;

    private final PlatformOrganizationOnboardingService onboardingService;

    @Transactional(readOnly = true)
    public Page<PlatformOrganizationResponse> findAll(

            String query,
            Pageable pageable) {

        platformAccessService
                .requirePlatformAdmin();

        Page<Organization> organizations;

        if (query == null
                || query.isBlank()) {

            organizations = organizationRepository
                    .findAll(pageable);

        } else {
            organizations = organizationRepository
                    .findAllByNameContainingIgnoreCase(
                            query.trim(),
                            pageable);
        }

        OffsetDateTime now = OffsetDateTime.now();

        return organizations.map(
                organization -> toResponse(
                        organization,
                        now));
    }

    public CreatePlatformOrganizationResponse create(

            CreatePlatformOrganizationRequest request) {

        platformAccessService
                .requirePlatformAdmin();

        String organizationName = StringNormalizer.normalize(
                request.organizationName());

        String ownerName = StringNormalizer.normalize(
                request.ownerName());

        String ownerEmail = EmailNormalizer.normalize(
                request.ownerEmail());

        Organization organization = new Organization();

        organization.setName(
                organizationName);

        /*
         * O e-mail do primeiro proprietário será
         * usado inicialmente como contato.
         * Ele poderá ser alterado nas configurações.
         */
        organization.setContactEmail(
                ownerEmail);

        organization.setActive(true);

        Organization savedOrganization = organizationRepository.save(
                organization);

        /*
         * Garante que a nova organização já possua
         * as configurações padrão.
         */
        organizationSettingsService
                .findOrCreateSettings(
                        savedOrganization.getId());

        onboardingService
                .createForOrganization(
                        savedOrganization);

        auditLogService.record(
                savedOrganization.getId(),

                AuditEntityType.ORGANIZATION,

                savedOrganization.getId(),

                AuditAction.CREATE,

                "Organization created through "
                        + "platform onboarding: "
                        + savedOrganization.getName());

        CreateOrganizationUserInvitationRequest invitationRequest =

                new CreateOrganizationUserInvitationRequest(
                        ownerName,
                        ownerEmail,
                        OrganizationRole.OWNER);

        CreateOrganizationUserInvitationResponse invitationResponse =

                invitationService
                        .createFromPlatform(
                                savedOrganization
                                        .getId(),

                                invitationRequest);

        return new CreatePlatformOrganizationResponse(
                toResponse(
                        savedOrganization,
                        OffsetDateTime.now()),

                invitationResponse);
    }

    @Transactional(readOnly = true)
    public PlatformOrganizationDetailsResponse findById(UUID organizationId) {

        platformAccessService
                .requirePlatformAdmin();

        Organization organization = requireOrganization(
                organizationId);

        List<OrganizationUserResponse> users = organizationUserRepository
                .findAllByOrganization_IdOrderByUser_NameAsc(
                        organizationId)
                .stream()
                .map(
                        OrganizationUserMapper::toResponse)
                .toList();

        List<OrganizationUserInvitationResponse> invitations =

                invitationRepository
                        .findAllByOrganization_IdOrderByCreatedAtDesc(
                                organizationId)
                        .stream()
                        .map(
                                OrganizationUserInvitationMapper::toResponse)
                        .toList();

        return new PlatformOrganizationDetailsResponse(
                toResponse(
                        organization,
                        OffsetDateTime.now()),

                users,
                invitations);
    }

    public PlatformOrganizationResponse updateStatus(
            UUID organizationId,
            UpdatePlatformOrganizationStatusRequest request) {

        platformAccessService
                .requirePlatformAdmin();

        Organization organization = requireOrganization(
                organizationId);

        boolean newStatus = request.active();

        if (organization.isActive() == newStatus) {

            return toResponse(
                    organization,
                    OffsetDateTime.now());
        }

        organization.setActive(
                newStatus);

        Organization savedOrganization = organizationRepository.save(
                organization);

        auditLogService.record(
                organizationId,
                AuditEntityType.ORGANIZATION,
                organizationId,

                newStatus
                        ? AuditAction.ACTIVATE
                        : AuditAction.DEACTIVATE,

                newStatus
                        ? "Organization reactivated through platform backoffice: "
                                + savedOrganization.getName()

                        : "Organization suspended through platform backoffice: "
                                + savedOrganization.getName());

        return toResponse(
                savedOrganization,
                OffsetDateTime.now());
    }

    private Organization requireOrganization(UUID organizationId) {

        /*
         * Não usamos findByIdAndActiveTrue.
         * O backoffice também precisa encontrar
         * organizações suspensas para reativá-las.
         */
        return organizationRepository
                .findById(
                        organizationId)

                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Organization not found"));
    }

    private PlatformOrganizationResponse toResponse(

            Organization organization,
            OffsetDateTime now) {

        long totalUsers = organizationUserRepository
                .countByOrganization_Id(
                        organization.getId());

        long activeUsers = organizationUserRepository
                .countByOrganization_IdAndActiveTrue(
                        organization.getId());

        long pendingInvitations = invitationRepository
                .countByOrganization_IdAndAcceptedAtIsNullAndCanceledAtIsNullAndExpiresAtAfter(
                        organization.getId(),
                        now);

        return new PlatformOrganizationResponse(
                organization.getId(),
                organization.getName(),
                organization.isActive(),
                organization.getCnpj(),
                organization.getContactEmail(),
                totalUsers,
                activeUsers,
                pendingInvitations,
                organization.getCreatedAt());
    }
}