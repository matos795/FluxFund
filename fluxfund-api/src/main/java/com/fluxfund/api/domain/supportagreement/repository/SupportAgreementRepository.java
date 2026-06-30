package com.fluxfund.api.domain.supportagreement.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("""
            select sa
            from SupportAgreement sa
            where sa.organization.id = :organizationId
              and sa.beneficiary.id = :beneficiaryId
              and sa.fund.id = :fundId
              and sa.active = true
              and sa.startDate <= :candidateEndDate
              and (sa.endDate is null or sa.endDate >= :candidateStartDate)
            """)
    List<SupportAgreement> findActiveOverlappingAgreements(
            @Param("organizationId") UUID organizationId,
            @Param("beneficiaryId") UUID beneficiaryId,
            @Param("fundId") UUID fundId,
            @Param("candidateStartDate") LocalDate candidateStartDate,
            @Param("candidateEndDate") LocalDate candidateEndDate);

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

    @Query("""
            select sa
            from SupportAgreement sa
            join fetch sa.beneficiary
            join fetch sa.fund
            where sa.organization.id = :organizationId
              and sa.active = true
              and sa.startDate <= :endDate
              and (sa.endDate is null or sa.endDate >= :startDate)
            """)
    List<SupportAgreement> findActiveInPeriodForReport(
            @Param("organizationId") UUID organizationId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            select sa
            from SupportAgreement sa
            join fetch sa.beneficiary
            join fetch sa.fund
            where sa.organization.id = :organizationId
              and sa.beneficiary.id = :beneficiaryId
              and sa.active = true
              and sa.startDate <= :referenceDate
              and (sa.endDate is null or sa.endDate >= :referenceDate)
            order by sa.fund.name asc
            """)
    List<SupportAgreement> findActiveSuggestionsByBeneficiary(
            @Param("organizationId") UUID organizationId,
            @Param("beneficiaryId") UUID beneficiaryId,
            @Param("referenceDate") LocalDate referenceDate);

    @Query("""
            select sa
            from SupportAgreement sa
            join fetch sa.beneficiary
            join fetch sa.fund
            where sa.organization.id = :organizationId
            and sa.active = true
              and sa.startDate <= :endDate
              and (sa.endDate is null or sa.endDate >= :startDate)
            """)
    List<SupportAgreement> findApplicableInPeriodForReport(
            @Param("organizationId") UUID organizationId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            select sa
            from SupportAgreement sa
            join fetch sa.beneficiary
            join fetch sa.fund
            where sa.organization.id = :organizationId
            and sa.active = true
              and sa.startDate < :periodStartDate
              and (sa.endDate is null or sa.endDate >= :historyStartDate)
            """)
    List<SupportAgreement> findStartedBeforeForReport(
            @Param("organizationId") UUID organizationId,
            @Param("historyStartDate") LocalDate historyStartDate,
            @Param("periodStartDate") LocalDate periodStartDate);
}