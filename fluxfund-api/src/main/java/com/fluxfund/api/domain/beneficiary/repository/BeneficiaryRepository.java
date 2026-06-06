package com.fluxfund.api.domain.beneficiary.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.beneficiary.Beneficiary;

public interface BeneficiaryRepository extends JpaRepository<Beneficiary, UUID> {

    Page<Beneficiary> findAllByOrganizationIdAndActiveTrue(
            UUID organizationId,
            Pageable pageable);

    boolean existsByOrganizationIdAndNameIgnoreCase(
            UUID organizationId,
            String name);

    boolean existsByOrganizationIdAndNameIgnoreCaseAndIdNot(
            UUID organizationId,
            String name,
            UUID id);

    boolean existsByOrganizationIdAndDocument(
            UUID organizationId,
            String document);

    boolean existsByOrganizationIdAndDocumentAndIdNot(
            UUID organizationId,
            String document,
            UUID id);

    Optional<Beneficiary> findByIdAndOrganizationIdAndActiveTrue(UUID beneficiaryId, UUID organizationId);

    List<Beneficiary> findByOrganizationIdAndActiveTrueOrderByNameAsc(UUID organizationId);
}
