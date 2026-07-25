package com.fluxfund.api.domain.organizationuser.invitation;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.organizationuser.OrganizationRole;
import com.fluxfund.api.domain.organizationuser.OrganizationUser;
import com.fluxfund.api.domain.organizationuser.OrganizationUserId;
import com.fluxfund.api.domain.organizationuser.OrganizationUserRepository;
import com.fluxfund.api.domain.organizationuser.invitation.dto.AcceptOrganizationUserInvitationRequest;
import com.fluxfund.api.domain.organizationuser.invitation.dto.AcceptOrganizationUserInvitationResponse;
import com.fluxfund.api.domain.organizationuser.invitation.dto.CreateOrganizationUserInvitationRequest;
import com.fluxfund.api.domain.organizationuser.invitation.dto.CreateOrganizationUserInvitationResponse;
import com.fluxfund.api.domain.organizationuser.invitation.dto.OrganizationUserInvitationDetailsResponse;
import com.fluxfund.api.domain.organizationuser.invitation.dto.OrganizationUserInvitationResponse;
import com.fluxfund.api.domain.user.AppUser;
import com.fluxfund.api.domain.user.AppUserRepository;
import com.fluxfund.api.security.CurrentUserService;
import com.fluxfund.api.security.InvitationTokenService;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.mail.ApplicationMailService;
import com.fluxfund.api.shared.util.EmailNormalizer;
import com.fluxfund.api.shared.util.StringNormalizer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationUserInvitationService {

        private final OrganizationUserInvitationRepository invitationRepository;

        private final OrganizationRepository organizationRepository;

        private final OrganizationUserRepository organizationUserRepository;

        private final AppUserRepository appUserRepository;

        private final PasswordEncoder passwordEncoder;

        private final OrganizationAccessService organizationAccessService;

        private final CurrentUserService currentUserService;

        private final InvitationTokenService tokenService;

        private final ApplicationMailService applicationMailService;

        private final AuditLogService auditLogService;

        @Value("${app.security.invitation-expiration:P7D}")
        private Duration invitationExpiration;

        @Value("${app.frontend.base-url:http://localhost:5173}")
        private String frontendBaseUrl;

        @Transactional(readOnly = true)
        public List<OrganizationUserInvitationResponse> findAll(UUID organizationId) {

                organizationAccessService
                                .requireAdminAccess(organizationId);

                return invitationRepository
                                .findAllByOrganization_IdOrderByCreatedAtDesc(
                                                organizationId)
                                .stream()
                                .map(
                                                OrganizationUserInvitationMapper::toResponse)
                                .toList();
        }

        public CreateOrganizationUserInvitationResponse create(
                        UUID organizationId,
                        CreateOrganizationUserInvitationRequest request) {

                organizationAccessService
                                .requireAdminAccess(organizationId);

                if (request.role() == OrganizationRole.OWNER) {
                        throw new BusinessException(
                                        "Owner invitations are not allowed");
                }

                Organization organization = organizationRepository
                                .findByIdAndActiveTrue(
                                                organizationId)
                                .orElseThrow(
                                                () -> new ResourceNotFoundException(
                                                                "Organization not found"));

                String normalizedEmail = EmailNormalizer.normalize(
                                request.email());

                String normalizedName = StringNormalizer.normalize(
                                request.name());

                AppUser existingUser = appUserRepository
                                .findByEmailIgnoreCase(
                                                normalizedEmail)
                                .orElse(null);

                if (existingUser != null) {

                        OrganizationUser membership = organizationUserRepository
                                        .findByOrganization_IdAndUser_Id(
                                                        organizationId,
                                                        existingUser.getId())
                                        .orElse(null);

                        if (membership != null
                                        && membership.isActive()) {

                                throw new BusinessException(
                                                "User already has access to this organization");
                        }
                }

                OffsetDateTime now = OffsetDateTime.now();

                OrganizationUserInvitation pendingInvitation = invitationRepository
                                .findFirstByOrganization_IdAndEmailIgnoreCaseAndAcceptedAtIsNullAndCanceledAtIsNullOrderByCreatedAtDesc(
                                                organizationId,
                                                normalizedEmail)
                                .orElse(null);

                if (pendingInvitation != null) {

                        if (pendingInvitation.getExpiresAt()
                                        .isAfter(now)) {

                                throw new BusinessException(
                                                "There is already a pending invitation for this email");
                        }

                        pendingInvitation.setCanceledAt(now);

                        invitationRepository.saveAndFlush(
                                        pendingInvitation);

                        auditLogService.record(
                                        organizationId,
                                        AuditEntityType.ORGANIZATION_USER_INVITATION,
                                        pendingInvitation.getId(),
                                        AuditAction.CANCEL,

                                        "Expired organization invitation "
                                                        + "automatically canceled before "
                                                        + "replacement for "
                                                        + pendingInvitation.getEmail());
                }

                UUID currentUserId = currentUserService.requireUserId();

                AppUser invitedBy = appUserRepository
                                .findByIdAndActiveTrue(
                                                currentUserId)
                                .orElseThrow(
                                                () -> new ResourceNotFoundException(
                                                                "Current user not found"));

                var generatedToken = tokenService.generate();

                OrganizationUserInvitation invitation = new OrganizationUserInvitation();

                invitation.setOrganization(organization);
                invitation.setInvitedByUser(invitedBy);
                invitation.setName(normalizedName);
                invitation.setEmail(normalizedEmail);
                invitation.setRole(request.role());
                invitation.setTokenHash(
                                generatedToken.tokenHash());
                invitation.setExpiresAt(
                                now.plus(invitationExpiration));

                OrganizationUserInvitation savedInvitation = invitationRepository.save(invitation);

                auditLogService.record(
                                organizationId,
                                AuditEntityType.ORGANIZATION_USER_INVITATION,
                                savedInvitation.getId(),
                                AuditAction.CREATE,

                                "Organization invitation created for "
                                                + savedInvitation.getEmail()
                                                + " with role "
                                                + savedInvitation.getRole());

                return buildInvitationResponse(
                                savedInvitation,
                                generatedToken.rawToken());
        }

        @Transactional(readOnly = true)
        public OrganizationUserInvitationDetailsResponse findDetails(String rawToken) {

                OrganizationUserInvitation invitation = requireUsableInvitation(rawToken);

                boolean requiresPassword = appUserRepository
                                .findByEmailIgnoreCase(
                                                invitation.getEmail())
                                .isEmpty();

                return new OrganizationUserInvitationDetailsResponse(
                                invitation.getOrganization().getName(),
                                invitation.getName(),
                                invitation.getEmail(),
                                invitation.getRole(),
                                invitation.getExpiresAt(),
                                requiresPassword);
        }

        public AcceptOrganizationUserInvitationResponse accept(
                        String rawToken,
                        AcceptOrganizationUserInvitationRequest request) {

                OrganizationUserInvitation invitation = requireUsableInvitation(rawToken);

                AppUser user = appUserRepository
                                .findByEmailIgnoreCase(
                                                invitation.getEmail())
                                .orElse(null);

                if (user == null) {

                        validateNewUserPassword(
                                        request.password());

                        String name = request.name() != null
                                        && !request.name().isBlank()

                                                        ? StringNormalizer.normalize(
                                                                        request.name())

                                                        : invitation.getName();

                        user = new AppUser();
                        user.setName(name);
                        user.setEmail(
                                        invitation.getEmail());
                        user.setPasswordHash(
                                        passwordEncoder.encode(
                                                        request.password()));
                        user.setActive(true);

                        user = appUserRepository.save(user);

                } else if (!user.isActive()) {

                        user.setActive(true);

                        /*
                         * Tokens emitidos antes da desativação
                         * não podem voltar a funcionar.
                         */
                        user.revokeSessions();

                        user = appUserRepository.save(user);
                }

                OrganizationUser membership = organizationUserRepository
                                .findByOrganization_IdAndUser_Id(
                                                invitation
                                                                .getOrganization()
                                                                .getId(),
                                                user.getId())
                                .orElse(null);

                if (membership != null && membership.isActive()) {
                        throw new BusinessException("User already has active access to this organization");
                }

                if (membership == null) {

                        membership = new OrganizationUser();

                        membership.setId(
                                        new OrganizationUserId(
                                                        invitation
                                                                        .getOrganization()
                                                                        .getId(),
                                                        user.getId()));

                        membership.setOrganization(
                                        invitation.getOrganization());

                        membership.setUser(user);

                }

                membership.setRole(
                                invitation.getRole());

                membership.setActive(true);

                organizationUserRepository.save(membership);

                invitation.setAcceptedAt(
                                OffsetDateTime.now());

                invitationRepository.save(invitation);

                auditLogService.recordAs(
                                invitation
                                                .getOrganization()
                                                .getId(),

                                user.getId(),

                                AuditEntityType.ORGANIZATION_USER_INVITATION,

                                invitation.getId(),

                                AuditAction.ACCEPT_INVITATION,

                                "Organization invitation accepted by "
                                                + user.getEmail()
                                                + " with role "
                                                + invitation.getRole());

                return new AcceptOrganizationUserInvitationResponse(
                                invitation.getOrganization().getId(),
                                invitation.getOrganization().getName(),
                                user.getEmail(),
                                "Invitation accepted successfully");
        }

        public void cancel(
                        UUID organizationId,
                        UUID invitationId) {

                organizationAccessService
                                .requireAdminAccess(organizationId);

                OrganizationUserInvitation invitation = invitationRepository
                                .findById(invitationId)
                                .orElseThrow(
                                                () -> new ResourceNotFoundException(
                                                                "Invitation not found"));

                if (!invitation.getOrganization()
                                .getId()
                                .equals(organizationId)) {

                        throw new ResourceNotFoundException(
                                        "Invitation not found");
                }

                if (invitation.getAcceptedAt() != null) {
                        throw new BusinessException(
                                        "Accepted invitations cannot be canceled");
                }

                if (invitation.getCanceledAt() == null) {
                        invitation.setCanceledAt(
                                        OffsetDateTime.now());

                        invitationRepository.save(invitation);

                        auditLogService.record(
                                        organizationId,
                                        AuditEntityType.ORGANIZATION_USER_INVITATION,
                                        invitation.getId(),
                                        AuditAction.CANCEL,

                                        "Organization invitation canceled for "
                                                        + invitation.getEmail());
                }
        }

        public CreateOrganizationUserInvitationResponse regenerateLink(
                        UUID organizationId,
                        UUID invitationId) {

                organizationAccessService
                                .requireAdminAccess(organizationId);

                OrganizationUserInvitation invitation = invitationRepository
                                .findById(invitationId)
                                .orElseThrow(
                                                () -> new ResourceNotFoundException(
                                                                "Invitation not found"));

                if (!invitation.getOrganization()
                                .getId()
                                .equals(organizationId)) {

                        throw new ResourceNotFoundException(
                                        "Invitation not found");
                }

                if (invitation.getAcceptedAt() != null) {
                        throw new BusinessException(
                                        "Accepted invitations cannot generate a new link");
                }

                if (invitation.getCanceledAt() != null) {
                        throw new BusinessException(
                                        "Canceled invitations cannot generate a new link");
                }

                var generatedToken = tokenService.generate();

                invitation.setTokenHash(
                                generatedToken.tokenHash());

                invitation.setExpiresAt(
                                OffsetDateTime.now()
                                                .plus(invitationExpiration));

                OrganizationUserInvitation savedInvitation = invitationRepository.save(invitation);

                auditLogService.record(
                                organizationId,
                                AuditEntityType.ORGANIZATION_USER_INVITATION,
                                savedInvitation.getId(),
                                AuditAction.REGENERATE_INVITATION,

                                "Organization invitation regenerated for "
                                                + savedInvitation.getEmail());

                return buildInvitationResponse(
                                savedInvitation,
                                generatedToken.rawToken());
        }

        private OrganizationUserInvitation requireUsableInvitation(
                        String rawToken) {

                String tokenHash = tokenService.hash(rawToken);

                OrganizationUserInvitation invitation = invitationRepository
                                .findByTokenHash(tokenHash)
                                .orElseThrow(
                                                () -> new ResourceNotFoundException(
                                                                "Invitation not found"));

                if (invitation.getAcceptedAt() != null) {
                        throw new BusinessException(
                                        "Invitation has already been accepted");
                }

                if (invitation.getCanceledAt() != null) {
                        throw new BusinessException(
                                        "Invitation has been canceled");
                }

                if (invitation.getExpiresAt()
                                .isBefore(OffsetDateTime.now())) {

                        throw new BusinessException(
                                        "Invitation has expired");
                }

                return invitation;
        }

        private void validateNewUserPassword(
                        String password) {

                if (password == null
                                || password.length() < 8) {

                        throw new BusinessException(
                                        "Password must contain at least 8 characters");
                }
        }

        private CreateOrganizationUserInvitationResponse buildInvitationResponse(

                        OrganizationUserInvitation invitation,
                        String rawToken) {

                String baseUrl = frontendBaseUrl.replaceAll("/+$", "");

                String invitationUrl = baseUrl
                                + "/accept-invitation?token="
                                + rawToken;

                boolean emailSent = applicationMailService.sendOrganizationInvitation(
                                invitation.getName(),
                                invitation.getEmail(),
                                invitation.getOrganization().getName(),
                                invitation.getRole(),
                                invitationUrl,
                                invitation.getExpiresAt());

                return new CreateOrganizationUserInvitationResponse(
                                OrganizationUserInvitationMapper.toResponse(invitation),
                                invitationUrl,
                                emailSent);
        }
}