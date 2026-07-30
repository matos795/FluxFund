package com.fluxfund.api.domain.beneficiary.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.fluxfund.api.domain.beneficiary.Beneficiary;

public interface BeneficiaryRepository extends JpaRepository<Beneficiary, UUID>, JpaSpecificationExecutor<Beneficiary> {

        Page<Beneficiary> findAllByOrganizationIdAndActiveTrue(UUID organizationId, Pageable pageable);

        boolean existsByOrganizationIdAndDocument(UUID organizationId, String document);

        boolean existsByOrganizationIdAndDocumentAndIdNot(UUID organizationId, String document, UUID id);

        Optional<Beneficiary> findByIdAndOrganizationIdAndActiveTrue(UUID beneficiaryId, UUID organizationId);

        /*
         * Usado para localizar contatos inativos
         * durante uma reativação.
         */
        Optional<Beneficiary> findByIdAndOrganizationId(UUID beneficiaryId, UUID organizationId);

        List<Beneficiary> findByOrganizationIdAndActiveTrueOrderByNameAsc(UUID organizationId);
}