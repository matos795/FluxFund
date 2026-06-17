package com.fluxfund.api.domain.organizationuser;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationUserRepository extends JpaRepository<OrganizationUser, OrganizationUserId> {

    Optional<OrganizationUser> findByUser_IdAndOrganization_IdAndActiveTrueAndOrganization_ActiveTrue(
            UUID userId,
            UUID organizationId
    );

    List<OrganizationUser> findAllByUser_IdAndActiveTrueAndOrganization_ActiveTrue(
            UUID userId
    );

    Optional<OrganizationUser> findByOrganization_IdAndUser_Id(
            UUID organizationId,
            UUID userId
    );

    List<OrganizationUser> findAllByOrganization_IdOrderByUser_NameAsc(
            UUID organizationId
    );
}