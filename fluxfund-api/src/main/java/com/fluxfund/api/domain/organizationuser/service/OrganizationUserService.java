package com.fluxfund.api.domain.organizationuser.service;

import java.util.List;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.organizationuser.OrganizationRole;
import com.fluxfund.api.domain.organizationuser.OrganizationUser;
import com.fluxfund.api.domain.organizationuser.OrganizationUserId;
import com.fluxfund.api.domain.organizationuser.OrganizationUserRepository;
import com.fluxfund.api.domain.organizationuser.dto.CreateOrganizationUserRequest;
import com.fluxfund.api.domain.organizationuser.dto.OrganizationUserResponse;
import com.fluxfund.api.domain.organizationuser.dto.UpdateOrganizationUserRoleRequest;
import com.fluxfund.api.domain.organizationuser.dto.UpdateOrganizationUserStatusRequest;
import com.fluxfund.api.domain.organizationuser.mapper.OrganizationUserMapper;
import com.fluxfund.api.domain.user.AppUser;
import com.fluxfund.api.domain.user.AppUserRepository;
import com.fluxfund.api.security.CurrentUserService;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ForbiddenException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.util.EmailNormalizer;
import com.fluxfund.api.shared.util.StringNormalizer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationUserService {

    private final OrganizationUserRepository organizationUserRepository;
    private final OrganizationRepository organizationRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrganizationAccessService organizationAccessService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<OrganizationUserResponse> findAll(UUID organizationId) {
        organizationAccessService.requireAdminAccess(organizationId);

        return organizationUserRepository
                .findAllByOrganization_IdOrderByUser_NameAsc(organizationId)
                .stream()
                .map(OrganizationUserMapper::toResponse)
                .toList();
    }

    public OrganizationUserResponse create(
            UUID organizationId,
            CreateOrganizationUserRequest request) {

        organizationAccessService.requireAdminAccess(organizationId);

        if (request.role() == OrganizationRole.OWNER) {
            throw new ForbiddenException("Only an existing owner can create another owner");
        }

        Organization organization = organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        String normalizedEmail = EmailNormalizer.normalize(request.email());

        AppUser user = appUserRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElseGet(() -> {
                    AppUser newUser = new AppUser();
                    newUser.setName(StringNormalizer.normalize(request.name()));
                    newUser.setEmail(normalizedEmail);
                    newUser.setPasswordHash(passwordEncoder.encode(request.temporaryPassword()));
                    newUser.setActive(true);
                    return appUserRepository.save(newUser);
                });

        if (!user.isActive()) {
            user.setActive(true);
        }

        if (user.getName() == null || user.getName().isBlank()) {
            user.setName(StringNormalizer.normalize(request.name()));
        }

        OrganizationUser organizationUser = organizationUserRepository
                .findByOrganization_IdAndUser_Id(organizationId, user.getId())
                .orElse(null);

        if (organizationUser != null) {
            if (organizationUser.isActive()) {
                throw new BusinessException("User already has access to this organization");
            }

            organizationUser.setRole(request.role());
            organizationUser.setActive(true);

            return OrganizationUserMapper.toResponse(
                    organizationUserRepository.save(organizationUser));
        }

        OrganizationUser newOrganizationUser = new OrganizationUser();
        newOrganizationUser.setId(new OrganizationUserId(
                organizationId,
                user.getId()));
        newOrganizationUser.setOrganization(organization);
        newOrganizationUser.setUser(user);
        newOrganizationUser.setRole(request.role());
        newOrganizationUser.setActive(true);

        return OrganizationUserMapper.toResponse(
                organizationUserRepository.save(newOrganizationUser));
    }

    public OrganizationUserResponse updateRole(
            UUID organizationId,
            UUID userId,
            UpdateOrganizationUserRoleRequest request) {

        organizationAccessService.requireAdminAccess(organizationId);

        OrganizationUser organizationUser = findMembershipOrThrow(
                organizationId,
                userId);

        preventSelfRoleChange(userId);

        boolean targetIsOwner = organizationUser.getRole() == OrganizationRole.OWNER;
        boolean nextRoleIsOwner = request.role() == OrganizationRole.OWNER;

        if (targetIsOwner || nextRoleIsOwner) {
            organizationAccessService.requireOwnerAccess(organizationId);
        }

        if (targetIsOwner && !nextRoleIsOwner) {
            preventRemovingLastOwner(organizationId, userId);
        }

        organizationUser.setRole(request.role());

        return OrganizationUserMapper.toResponse(
                organizationUserRepository.save(organizationUser));
    }

    public OrganizationUserResponse updateStatus(
            UUID organizationId,
            UUID userId,
            UpdateOrganizationUserStatusRequest request) {

        organizationAccessService.requireAdminAccess(organizationId);

        OrganizationUser organizationUser = findMembershipOrThrow(
                organizationId,
                userId);

        preventSelfStatusChange(userId);

        if (organizationUser.getRole() == OrganizationRole.OWNER) {
            organizationAccessService.requireOwnerAccess(organizationId);
        }

        if (!request.active()
                && organizationUser.getRole() == OrganizationRole.OWNER) {
            preventRemovingLastOwner(organizationId, userId);
        }

        organizationUser.setActive(request.active());

        return OrganizationUserMapper.toResponse(
                organizationUserRepository.save(organizationUser));
    }

    private OrganizationUser findMembershipOrThrow(
            UUID organizationId,
            UUID userId) {

        return organizationUserRepository
                .findByOrganization_IdAndUser_Id(organizationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Organization user not found"));
    }

    private void preventSelfRoleChange(UUID targetUserId) {
        UUID currentUserId = currentUserService.requireUserId();

        if (currentUserId.equals(targetUserId)) {
            throw new BusinessException("You cannot change your own role");
        }
    }

    private void preventSelfStatusChange(UUID targetUserId) {
        UUID currentUserId = currentUserService.requireUserId();

        if (currentUserId.equals(targetUserId)) {
            throw new BusinessException("You cannot deactivate your own access");
        }
    }

    private void preventRemovingLastOwner(UUID organizationId, UUID targetUserId) {
        long activeOwners = organizationUserRepository
                .findAllByOrganization_IdOrderByUser_NameAsc(organizationId)
                .stream()
                .filter(OrganizationUser::isActive)
                .filter(item -> item.getRole() == OrganizationRole.OWNER)
                .count();

        OrganizationUser targetMembership = findMembershipOrThrow(
                organizationId,
                targetUserId);

        boolean targetIsActiveOwner = targetMembership.isActive()
                && targetMembership.getRole() == OrganizationRole.OWNER;

        if (targetIsActiveOwner && activeOwners <= 1) {
            throw new BusinessException("Organization must have at least one active owner");
        }
    }
}