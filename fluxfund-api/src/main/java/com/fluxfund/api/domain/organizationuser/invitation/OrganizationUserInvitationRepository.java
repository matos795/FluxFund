package com.fluxfund.api.domain.organizationuser.invitation;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationUserInvitationRepository
        extends JpaRepository<
                OrganizationUserInvitation,
                UUID> {

    List<OrganizationUserInvitation> findAllByOrganization_IdOrderByCreatedAtDesc(UUID organizationId);

    Optional<OrganizationUserInvitation>
            findFirstByOrganization_IdAndEmailIgnoreCaseAndAcceptedAtIsNullAndCanceledAtIsNullOrderByCreatedAtDesc(
                    UUID organizationId, String email);

    Optional<OrganizationUserInvitation> findByTokenHash(String tokenHash);
}