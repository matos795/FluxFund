package com.fluxfund.api.domain.fund.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.fund.Fund;

public interface FundRepository extends JpaRepository<Fund, UUID> {

    Page<Fund> findAllByOrganizationIdAndActiveTrue(
            UUID organizationId,
            Pageable pageable);

    boolean existsByOrganizationIdAndNameIgnoreCase(
            UUID organizationId,
            String name);

    boolean existsByOrganizationIdAndNameIgnoreCaseAndIdNot(
            UUID organizationId,
            String name,
            UUID id);

    Optional<Fund> findByIdAndOrganizationIdAndActiveTrue(UUID fundId, UUID organizationId);
}
