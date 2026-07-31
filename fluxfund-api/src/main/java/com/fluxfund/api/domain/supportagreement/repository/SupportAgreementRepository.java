package com.fluxfund.api.domain.supportagreement.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType;
import com.fluxfund.api.domain.supportagreement.SupportAgreement;

public interface SupportAgreementRepository
        extends JpaRepository<SupportAgreement, UUID>, JpaSpecificationExecutor<SupportAgreement> {

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
              and sa.direction = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection.PAYABLE
              and sa.commitmentType = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType.SUPPORT
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
              and sa.direction = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection.PAYABLE
              and sa.commitmentType = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType.SUPPORT
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
              and sa.direction = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection.PAYABLE
              and sa.commitmentType = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType.SUPPORT
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
              and sa.direction = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection.PAYABLE
              and sa.commitmentType = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType.SUPPORT
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
              and sa.direction = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection.PAYABLE
              and sa.commitmentType = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType.SUPPORT
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
              and sa.direction = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection.PAYABLE
              and sa.commitmentType = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType.SUPPORT
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
              and sa.direction = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection.PAYABLE
              and sa.commitmentType = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType.SUPPORT
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
              and sa.direction = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection.PAYABLE
              and sa.commitmentType = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType.SUPPORT
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
              and sa.direction = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection.PAYABLE
              and sa.commitmentType = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType.SUPPORT
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
              and sa.direction = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection.PAYABLE
              and sa.commitmentType = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType.SUPPORT
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
              and sa.direction = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection.PAYABLE
              and sa.commitmentType = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType.SUPPORT
            """)
    boolean existsActiveAgreementOverlappingPeriod(
            @Param("organizationId") UUID organizationId,
            @Param("beneficiaryId") UUID beneficiaryId,
            @Param("fundId") UUID fundId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludedId") UUID excludedId);

    @Query("""
            select sa
            from SupportAgreement sa
            where sa.organization.id = :organizationId
              and sa.direction = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection.PAYABLE
              and sa.commitmentType = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType.SUPPORT

            order by sa.startDate desc
            """)
    Page<SupportAgreement> findAllSupportByOrganizationId(
            @Param("organizationId") UUID organizationId,
            Pageable pageable);

    @Query("""
            select sa
            from SupportAgreement sa
            where sa.id = :id
              and sa.organization.id = :organizationId
              and sa.direction = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection.PAYABLE
              and sa.commitmentType = com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType.SUPPORT
            """)
    Optional<SupportAgreement> findSupportByIdAndOrganizationId(
            @Param("id") UUID id,
            @Param("organizationId") UUID organizationId);

    @Query("""
            select case
                when count(commitment) > 0
                then true
                else false
            end

            from SupportAgreement commitment

            where commitment.organization.id =
                :organizationId

              and commitment.direction =
                :direction

              and commitment.commitmentType =
                :commitmentType

              and commitment.recurrence =
                :recurrence

              and commitment.beneficiary.id =
                :partyId

              and (
                    (
                        :designatedRecipientId is null
                        and commitment.designatedRecipient is null
                    )
                    or commitment.designatedRecipient.id = :designatedRecipientId
                  )

              and commitment.fund.id = :fundId
              and commitment.active = true

              and (
                    :excludedId is null
                    or commitment.id <> :excludedId
                  )

              and (
                    :endDate is null
                    or commitment.startDate <= :endDate
                  )

              and (
                    commitment.endDate is null
                    or commitment.endDate >= :startDate
                  )
            """)
    boolean existsActiveFinancialCommitmentOverlap(
            @Param("organizationId") UUID organizationId,
            @Param("direction") FinancialCommitmentDirection direction,
            @Param("commitmentType") FinancialCommitmentType commitmentType,
            @Param("recurrence") FinancialCommitmentRecurrence recurrence,
            @Param("partyId") UUID partyId,
            @Param("designatedRecipientId") UUID designatedRecipientId,
            @Param("fundId") UUID fundId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludedId") UUID excludedId);

    @Query("""
            select distinct commitment

            from SupportAgreement commitment

            join fetch commitment.beneficiary party

            left join fetch
                commitment.designatedRecipient
                designatedRecipient

            join fetch commitment.fund

            where commitment.organization.id =
                :organizationId

              and commitment.active = true

              and commitment.direction =
                :direction

              and commitment.beneficiary.id =
                :partyId

              and (
                    (
                        :designatedRecipientId is null
                        and commitment.designatedRecipient is null
                    )

                    or (
                        :designatedRecipientId is not null
                        and commitment.designatedRecipient.id =
                            :designatedRecipientId
                    )
                  )

              and commitment.startDate <=
                :monthEnd

              and (
                    commitment.endDate is null
                    or commitment.endDate >=
                        :monthStart
                  )
            """)
    List<SupportAgreement> findApplicableForAllocation(
            @Param("organizationId") UUID organizationId,
            @Param("direction") FinancialCommitmentDirection direction,
            @Param("partyId") UUID partyId,
            @Param("designatedRecipientId") UUID designatedRecipientId,
            @Param("monthStart") LocalDate monthStart,
            @Param("monthEnd") LocalDate monthEnd);
}