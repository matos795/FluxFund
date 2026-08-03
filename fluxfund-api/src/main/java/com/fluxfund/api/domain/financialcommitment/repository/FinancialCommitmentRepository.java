package com.fluxfund.api.domain.financialcommitment.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.financialcommitment.FinancialCommitment;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType;

public interface FinancialCommitmentRepository
        extends
        JpaRepository<FinancialCommitment, UUID>,
        JpaSpecificationExecutor<FinancialCommitment> {

    Optional<FinancialCommitment> findByIdAndOrganizationId(
            UUID id,
            UUID organizationId);

    @Query("""
            select case
                when count(commitment) > 0
                then true
                else false
            end

            from FinancialCommitment commitment

            where commitment.organization.id =
                :organizationId

              and commitment.direction =
                :direction

              and commitment.commitmentType =
                :commitmentType

              and commitment.recurrence =
                :recurrence

              and commitment.party.id =
                :partyId

              and (
                    (
                        :designatedRecipientId
                            is null

                        and commitment
                            .designatedRecipient
                            is null
                    )

                    or

                    (
                        :designatedRecipientId
                            is not null

                        and commitment
                            .designatedRecipient
                            .id =
                            :designatedRecipientId
                    )
                  )

              and commitment.fund.id =
                :fundId

              and commitment.active = true

              and (
                    :excludedId is null
                    or commitment.id <>
                        :excludedId
                  )

              and (
                    :endDate is null
                    or commitment.startDate <=
                        :endDate
                  )

              and (
                    commitment.endDate is null
                    or commitment.endDate >=
                        :startDate
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

            from FinancialCommitment commitment

            join fetch commitment.party party

            left join fetch
                commitment.designatedRecipient
                designatedRecipient

            join fetch commitment.fund fund

            where commitment.organization.id =
                :organizationId

              and commitment.active = true

              and commitment.direction =
                :direction

              and commitment.party.id =
                :partyId

              and (
                    (
                        :designatedRecipientId
                            is null

                        and commitment
                            .designatedRecipient
                            is null
                    )

                    or

                    (
                        :designatedRecipientId
                            is not null

                        and commitment
                            .designatedRecipient
                            .id =
                            :designatedRecipientId
                    )
                  )

              and (
                    (
                        commitment.recurrence =
                            com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence.MONTHLY

                        and commitment.startDate <=
                            :monthEnd

                        and (
                            commitment.endDate is null
                            or commitment.endDate >=
                                :monthStart
                        )
                    )

                    or

                    (
                        commitment.recurrence =
                            com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence.ONE_TIME

                        and commitment.startDate
                            between :monthStart
                            and :monthEnd
                    )
                  )
            """)
    List<FinancialCommitment> findApplicableForAllocation(

            @Param("organizationId") UUID organizationId,

            @Param("direction") FinancialCommitmentDirection direction,

            @Param("partyId") UUID partyId,

            @Param("designatedRecipientId") UUID designatedRecipientId,

            @Param("monthStart") LocalDate monthStart,

            @Param("monthEnd") LocalDate monthEnd);

    @Query("""
            select distinct commitment

            from FinancialCommitment commitment

            join fetch commitment.party party

            left join fetch
                commitment.designatedRecipient
                designatedRecipient

            join fetch commitment.fund fund

            where commitment.organization.id =
                :organizationId

              and commitment.active = true

              and commitment.direction =
                :direction

              and (
                    (
                        commitment.recurrence =
                            com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence.MONTHLY

                        and commitment.startDate <=
                            :monthEnd

                        and (
                            commitment.endDate is null
                            or commitment.endDate >=
                                :monthStart
                        )
                    )

                    or

                    (
                        commitment.recurrence =
                            com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence.ONE_TIME

                        and commitment.startDate
                            between :monthStart
                            and :monthEnd
                    )
                  )

              and (
                    :partyId is null
                    or party.id = :partyId
                  )

              and (
                    :designatedRecipientId is null
                    or designatedRecipient.id =
                        :designatedRecipientId
                  )

              and (
                    :fundId is null
                    or fund.id = :fundId
                  )

            order by
                party.name asc,
                fund.name asc,
                commitment.startDate asc
            """)
    List<FinancialCommitment> findApplicableForMonthlyRealization(
            @Param("organizationId") UUID organizationId,
            @Param("direction") FinancialCommitmentDirection direction,
            @Param("monthStart") LocalDate monthStart,
            @Param("monthEnd") LocalDate monthEnd,
            @Param("partyId") UUID partyId,
            @Param("designatedRecipientId") UUID designatedRecipientId,
            @Param("fundId") UUID fundId);
}