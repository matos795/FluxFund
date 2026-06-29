package com.fluxfund.api.domain.organization.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.organization.Organization;

public interface OrganizationRepository extends JpaRepository<Organization, UUID>{

    Optional<Organization> findByIdAndActiveTrue(UUID organizationId);

}
