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

    @Query("""
            select sa
            from SupportAgreement sa
            where sa.organization.id = :organizationId
              and sa.active = true
              and sa.startDate <= :referenceDate
              and (sa.endDate is null or sa.endDate >= :referenceDate)
            order by sa.startDate desc
            """)
    Page<SupportAgreement> findCurrentActive(
            @Param("organizationId") UUID organizationId,
            @Param("referenceDate") LocalDate referenceDate,
            Pageable pageable);

    @Query("""
            select sa
            from SupportAgreement sa
            where sa.organization.id = :organizationId
              and sa.active = true
              and sa.startDate > :referenceDate
            order by sa.startDate asc
            """)
    Page<SupportAgreement> findScheduled(
            @Param("organizationId") UUID organizationId,
            @Param("referenceDate") LocalDate referenceDate,
            Pageable pageable);

    @Query("""
            select sa
            from SupportAgreement sa
            where sa.organization.id = :organizationId
              and sa.active = true
              and sa.endDate is not null
              and sa.endDate < :referenceDate
            order by sa.endDate desc
            """)
    Page<SupportAgreement> findExpired(
            @Param("organizationId") UUID organizationId,
            @Param("referenceDate") LocalDate referenceDate,
            Pageable pageable);

    @Query("""
            select sa
            from SupportAgreement sa
            where sa.organization.id = :organizationId
              and sa.active = false
            order by sa.updatedAt desc
            """)
    Page<SupportAgreement> findInactive(
            @Param("organizationId") UUID organizationId,
            Pageable pageable);

    @Query("""
            select case when count(sa) > 0 then true else false end
            from SupportAgreement sa
            where sa.organization.id = :organizationId
              and sa.beneficiary.id = :beneficiaryId
              and sa.fund.id = :fundId
              and sa.active = true
              and (:excludedId is null or sa.id <> :excludedId)
              and (:endDate is null or sa.startDate <= :endDate)
              and (sa.endDate is null or sa.endDate >= :startDate)
            """)
    boolean existsActiveAgreementOverlappingPeriod(
            @Param("organizationId") UUID organizationId,
            @Param("beneficiaryId") UUID beneficiaryId,
            @Param("fundId") UUID fundId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludedId") UUID excludedId);

    Page<SupportAgreement> findAllByOrganizationIdOrderByStartDateDesc(
            UUID organizationId,
            Pageable pageable);

    @Query("""
            select agreement

            from SupportAgreement agreement

            join fetch agreement.beneficiary
                beneficiary

            join fetch agreement.fund
                fund

            where agreement.organization.id =
                :organizationId

              and agreement.active = true

              and agreement.startDate <=
                :periodEnd

              and (
                    agreement.endDate is null

                    or agreement.endDate >=
                        :periodStart
                  )

              and (
                    :fundId is null

                    or fund.id =
                        :fundId
                  )

            order by
                agreement.startDate asc,
                beneficiary.name asc
            """)
    List<SupportAgreement> findActiveForForecast(

            @Param("organizationId") UUID organizationId,

            @Param("periodStart") LocalDate periodStart,

            @Param("periodEnd") LocalDate periodEnd,

            @Param("fundId") UUID fundId);

    @Query("""
            select agreement

            from SupportAgreement agreement

            join fetch agreement.beneficiary
                beneficiary

            join fetch agreement.fund
                fund

            where agreement.organization.id =
                :organizationId

              and beneficiary.id =
                :partyId

            order by
                agreement.startDate desc,
                agreement.createdAt desc
            """)
    List<SupportAgreement> findAllByFinancialParty(
            @Param("organizationId") UUID organizationId,
            @Param("partyId") UUID partyId);
}