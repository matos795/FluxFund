package com.fluxfund.api.domain.platform.organization.onboarding;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface
        PlatformOrganizationOnboardingRepository

        extends JpaRepository<
                PlatformOrganizationOnboarding,
                UUID> {

    Optional<PlatformOrganizationOnboarding>
            findByOrganization_Id(
                    UUID organizationId);
}