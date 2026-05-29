package com.fluxfund.api.security;

import java.util.EnumSet;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.organizationuser.OrganizationRole;
import com.fluxfund.api.domain.organizationuser.OrganizationUser;
import com.fluxfund.api.domain.organizationuser.OrganizationUserRepository;
import com.fluxfund.api.shared.exception.ForbiddenException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrganizationAccessService {

    private final CurrentUserService currentUserService;
    private final OrganizationUserRepository organizationUserRepository;

    public void requireReadAccess(UUID organizationId) {
        requireMembership(organizationId);
    }

    public void requireFinanceWriteAccess(UUID organizationId) {
        OrganizationUser membership = requireMembership(organizationId);

        if (!EnumSet.of(
                OrganizationRole.OWNER,
                OrganizationRole.ADMIN,
                OrganizationRole.FINANCE
        ).contains(membership.getRole())) {
            throw new ForbiddenException(
                    "You do not have permission to modify financial data in this organization"
            );
        }
    }

    public void requireAdminAccess(UUID organizationId) {
        OrganizationUser membership = requireMembership(organizationId);

        if (!EnumSet.of(
                OrganizationRole.OWNER,
                OrganizationRole.ADMIN
        ).contains(membership.getRole())) {
            throw new ForbiddenException(
                    "You do not have administrative permission in this organization"
            );
        }
    }

    private OrganizationUser requireMembership(UUID organizationId) {
        UUID userId = currentUserService.requireUserId();

        return organizationUserRepository
                .findByUser_IdAndOrganization_IdAndActiveTrueAndOrganization_ActiveTrue(
                        userId,
                        organizationId
                )
                .orElseThrow(() -> new ForbiddenException(
                        "You do not have access to this organization"
                ));
    }
}