package com.fluxfund.api.domain.organizationsettings.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.organizationsettings.OrganizationSettings;

public interface OrganizationSettingsRepository extends JpaRepository<OrganizationSettings, UUID> {

    Optional<OrganizationSettings> findByOrganizationId(UUID organizationId);
}