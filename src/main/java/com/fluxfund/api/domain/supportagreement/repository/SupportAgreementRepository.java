package com.fluxfund.api.domain.supportagreement.repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.fluxfund.api.domain.supportagreement.SupportAgreement;

public interface SupportAgreementRepository extends JpaRepository<SupportAgreement, UUID> {

        Page<SupportAgreement> findAllByOrganizationIdAndActiveTrue(
                        UUID organizationId,
                        Pageable pageable);

        Page<SupportAgreement> findAllByOrganizationId(
                        UUID organizationId,
                        Pageable pageable);

        Optional<SupportAgreement> findByIdAndOrganizationId(
                        UUID id,
                        UUID organizationId);

        boolean existsByOrganizationIdAndBeneficiaryIdAndFundIdAndActiveTrue(
                        UUID organizationId,
                        UUID beneficiaryId,
                        UUID fundId);

        Page<SupportAgreement> findAllByOrganizationIdAndActiveFalse(
                        UUID organizationId,
                        Pageable pageable);

        @Query("""
                        select sa
                        from SupportAgreement sa
                        where sa.organization.id = :organizationId
                          and sa.active = true
                          and sa.startDate <= :endDate
                          and (sa.endDate is null or sa.endDate >= :startDate)
                        """)
        Page<SupportAgreement> findActiveInPeriod(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate,
                        Pageable pageable);
}