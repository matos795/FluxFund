package com.fluxfund.api.domain.transactionallocation.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountProjection;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityOpeningBalanceProjection;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportProjection;
import com.fluxfund.api.domain.report.dto.financialcommitment.FinancialCommitmentRealizationProjection;
import com.fluxfund.api.domain.report.dto.fund.FundMovementAllocationProjection;
import com.fluxfund.api.domain.report.dto.fund.FundReportProjection;
import com.fluxfund.api.domain.transactionallocation.TransactionAllocation;

public interface TransactionAllocationRepository extends JpaRepository<TransactionAllocation, UUID> {

    Page<TransactionAllocation> findAllByOrganizationId(
            UUID organizationId,
            Pageable pageable);

    Optional<TransactionAllocation> findByIdAndOrganizationId(UUID id, UUID organizationId);

    @Query("""
                select coalesce(sum(abs(t.amount)), 0)
                from TransactionAllocation t
                where t.financialTransaction.id = :financialTransactionId
            """)
    BigDecimal sumAmountByFinancialTransactionId(UUID financialTransactionId);

    @Query("""
            select coalesce(sum(a.amount), 0)
            from TransactionAllocation a
            where a.fund.id = :fundId
              and a.organization.id = :organizationId
              and a.financialTransaction.status = 'SETTLED'
            """)
    BigDecimal sumAmountByFundId(
            @Param("organizationId") UUID organizationId,
            @Param("fundId") UUID fundId);

    @Query("""
            select coalesce(sum(a.amount), 0)
            from TransactionAllocation a
            where a.fund.id = :fundId
              and a.organization.id = :organizationId
              and a.financialTransaction.status = 'SETTLED'
              and a.financialTransaction.id <> :excludedTransactionId
            """)
    BigDecimal sumAmountByFundIdExcludingTransaction(
            @Param("organizationId") UUID organizationId,
            @Param("fundId") UUID fundId,
            @Param("excludedTransactionId") UUID excludedTransactionId);

    @Query("""
            select coalesce(sum(a.amount), 0)
            from TransactionAllocation a
            where a.organization.id = :organizationId
              and a.fund.active = true
              and a.financialTransaction.status <> :canceledStatus
            """)
    BigDecimal sumActiveFundAllocationsByOrganizationId(
            @Param("organizationId") UUID organizationId,
            @Param("canceledStatus") FinancialTransactionStatus canceledStatus);

    @Query("""
            select new com.fluxfund.api.domain.report.dto.fund.FundReportProjection(
                f.id,
                f.name,
                f.initialBalance,

                coalesce(sum(
                    case
                        when a.amount > 0
                         and ft.settlementDate between :startDate and :endDate
                        then a.amount
                        else 0
                    end
                ), 0),

                coalesce(sum(
                    case
                        when a.amount < 0
                         and ft.settlementDate between :startDate and :endDate
                        then abs(a.amount)
                        else 0
                    end
                ), 0),

                coalesce(sum(a.amount), 0),

                coalesce(sum(
                    case
                        when ft.settlementDate between :startDate and :endDate
                        then 1
                        else 0
                    end
                ), 0)
            )
            from Fund f
            left join TransactionAllocation a
                on a.fund = f
                and a.organization.id = :organizationId
                and a.financialTransaction.status = com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED
            left join a.financialTransaction ft
            where f.organization.id = :organizationId
              and f.active = true
            group by f.id, f.name, f.initialBalance
            order by f.name asc
            """)
    List<FundReportProjection> findFundReport(
            @Param("organizationId") UUID organizationId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            select new com.fluxfund.api.domain.report.dto.accountability.AccountabilityOpeningBalanceProjection(
                b.id,
                b.name,
                f.id,
                f.name,

                coalesce(sum(
                    case
                        when coalesce(
                                a.referenceMonth,
                                ft.settlementDate
                            ) >= :historyStartDate

                        and coalesce(
                                a.referenceMonth,
                                ft.settlementDate
                            ) < :startDate

                        then a.amount

                        else 0
                    end
                ), 0)
            )
            from TransactionAllocation a
            join a.financialTransaction ft
            join a.fund f
            join a.beneficiary b
            where a.organization.id = :organizationId
              and ft.status <> com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.CANCELED
            group by b.id, b.name, f.id, f.name
            order by b.name asc, f.name asc
            """)
    List<AccountabilityOpeningBalanceProjection> findAccountabilityOpeningBalance(
            @Param("organizationId") UUID organizationId,
            @Param("historyStartDate") LocalDate historyStartDate,
            @Param("startDate") LocalDate startDate);

    @Query("""
                        select new com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportProjection(
                            b.id,
                            b.name,
                            f.id,
                            f.name,

                            coalesce(sum(
                                case
                                    when a.amount > 0
                                    then a.amount
                                    else 0
                                end
                            ), 0),

                            coalesce(sum(
                                case
                                    when a.amount < 0
                                    then abs(a.amount)
                                    else 0
                                end
                            ), 0),

                            count(a)
                        )
                        from TransactionAllocation a
                        join a.financialTransaction ft
                        join a.fund f
                        join a.beneficiary b
                        where a.organization.id = :organizationId
              and ft.status <> com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.CANCELED
              and coalesce(
                a.referenceMonth,
                ft.settlementDate
            ) between :startDate and :endDate
            group by b.id, b.name, f.id, f.name
            order by b.name asc, f.name asc
                        """)
    List<AccountabilityReportProjection> findAccountabilityReport(
            @Param("organizationId") UUID organizationId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
                        select new com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountProjection(
                            b.id,
                            b.name,
                            f.id,
                            f.name,
                            acc.id,
                            acc.name,
                            acc.bankName,

                            coalesce(sum(
                                case
                                    when a.amount > 0
                                    then a.amount
                                    else 0
                                end
                            ), 0),

                            coalesce(sum(
                                case
                                    when a.amount < 0
                                    then abs(a.amount)
                                    else 0
                                end
                            ), 0),

                            count(a)
                        )
                        from TransactionAllocation a
                        join a.financialTransaction ft
                        join ft.account acc
                        join a.fund f
                        join a.beneficiary b
                        where a.organization.id = :organizationId
              and ft.status <> com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.CANCELED
              and coalesce(
                    a.referenceMonth,
                    ft.settlementDate
                ) between :startDate and :endDate
            group by b.id, b.name, f.id, f.name, acc.id, acc.name, acc.bankName
            order by b.name asc, f.name asc, acc.name asc
                        """)
    List<AccountabilityByAccountProjection> findAccountabilityReportByAccount(
            @Param("organizationId") UUID organizationId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            select coalesce(sum(a.amount), 0)
            from TransactionAllocation a
            where a.organization.id = :organizationId
              and a.fund.active = true
              and a.financialTransaction.status = com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED
            """)
    BigDecimal sumSettledActiveFundAllocationsByOrganizationId(
            @Param("organizationId") UUID organizationId);

    @Query("""
            select new com.fluxfund.api.domain.report.dto.fund.FundMovementAllocationProjection(
                f.id,

                coalesce(sum(
                    case
                        when a.amount > 0 then a.amount
                        else 0
                    end
                ), 0),

                coalesce(sum(
                    case
                        when a.amount < 0 then abs(a.amount)
                        else 0
                    end
                ), 0),

                count(a)
            )
            from TransactionAllocation a
            join a.financialTransaction ft
            join a.fund f
            where a.organization.id = :organizationId
              and ft.status = com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED
              and ft.settlementDate between :startDate and :endDate
            group by f.id
            """)
    List<FundMovementAllocationProjection> findFundMovementAllocationsForPeriod(
            @Param("organizationId") UUID organizationId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            select coalesce(
                sum(abs(allocation.amount)),
                0
            )

            from TransactionAllocation allocation

            where allocation.organization.id =
                :organizationId

              and allocation.financialCommitment.id =
                :financialCommitmentId

              and allocation.referenceMonth =
                :referenceMonth

              and allocation.financialTransaction.status =
                com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED

              and (
                    :excludedAllocationId is null
                    or allocation.id <>
                        :excludedAllocationId
                  )
            """)
    BigDecimal sumRealizedCommitmentAmount(
            @Param("organizationId") UUID organizationId,
            @Param("financialCommitmentId") UUID financialCommitmentId,
            @Param("referenceMonth") LocalDate referenceMonth,
            @Param("excludedAllocationId") UUID excludedAllocationId);

    @Query("""
            select
                allocation.financialCommitment.id
                    as commitmentId,

                coalesce(
                    sum(
                        abs(
                            allocation.amount
                        )
                    ),
                    0
                ) as realizedAmount,

                count(
                    allocation.id
                ) as allocationCount,

                max(
                    transaction.settlementDate
                ) as lastSettlementDate

            from TransactionAllocation allocation

            join allocation.financialTransaction
                transaction

            where allocation.organization.id =
                :organizationId

              and allocation.financialCommitment
                is not null

              and allocation.referenceMonth =
                :referenceMonth

              and transaction.status =
                com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED

            group by
                allocation.financialCommitment.id
            """)
    List<FinancialCommitmentRealizationProjection> findFinancialCommitmentRealizations(
            @Param("organizationId") UUID organizationId,
            @Param("referenceMonth") LocalDate referenceMonth);

    @Query(value = """
                    select allocation

                    from TransactionAllocation allocation

                    join fetch
                        allocation.financialTransaction
                        financialTransaction

                    join fetch
                        financialTransaction.account
                        account

                    join fetch
                        allocation.fund
                        fund

                    left join fetch
                        allocation.sourceParty
                        sourceParty

                    left join fetch
            allocation.beneficiary
            recipientParty

                    where allocation.organization.id =
                        :organizationId

                      and allocation.financialCommitment
                        is null

                      and allocation.referenceMonth
                        is not null

                      and financialTransaction.status =
                        com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED

                      and financialTransaction.type <>
                        com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.TRANSFER

                      and allocation.referenceMonth
                        between :startMonth
                        and :endMonth

                      and (
                        :transactionType is null
                        or financialTransaction.type =
                            :transactionType
                      )

                      and (
                        (
                          financialTransaction.type =
                            com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.INCOME

                          and sourceParty is not null
                        )

                        or

                        (
                          financialTransaction.type =
                            com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.EXPENSE

                          and recipientParty is not null
                        )
                      )

                    order by
                        allocation.referenceMonth desc,
                        financialTransaction.settlementDate desc,
                        allocation.createdAt desc
                    """,

            countQuery = """
                                    select count(allocation)

                                    from TransactionAllocation allocation

                                    join allocation.financialTransaction
                                        financialTransaction

                                    where allocation.organization.id =
                                        :organizationId

                                      and allocation.financialCommitment
                                        is null

                                      and allocation.referenceMonth
                                        is not null

                                      and financialTransaction.status =
                                        com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED

                                      and financialTransaction.type <>
                                        com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.TRANSFER

                                      and allocation.referenceMonth
                                        between :startMonth
                                        and :endMonth

                                      and (
                                        :transactionType is null
                                        or financialTransaction.type =
                                            :transactionType
                                      )

                                      and (
                                        (
                                          financialTransaction.type =
                                            com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.INCOME

                                          and allocation.sourceParty
                                            is not null
                                        )

                                        or

                                        (
                                          financialTransaction.type =
                                            com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.EXPENSE

                                          and allocation.beneficiary
                    is not null
                                        )
                                      )
                                    """)
    Page<TransactionAllocation> findUnlinkedFinancialCommitmentAllocations(
            @Param("organizationId") UUID organizationId,
            @Param("startMonth") LocalDate startMonth,
            @Param("endMonth") LocalDate endMonth,
            @Param("transactionType") com.fluxfund.api.domain.financialtransaction.FinancialTransactionType transactionType,
            Pageable pageable);

    @Query("""
            select coalesce(
                sum(abs(allocation.amount)),
                0
            )

            from TransactionAllocation allocation

            join allocation.financialTransaction
                transaction

            where allocation.organization.id =
                :organizationId

              and transaction.status =
                com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED

              and transaction.type =
                com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.INCOME

              and allocation.sourceParty.id =
                :partyId
            """)
    BigDecimal sumSettledIncomeFromParty(

            @Param("organizationId") UUID organizationId,

            @Param("partyId") UUID partyId);

    @Query("""
            select coalesce(
                sum(abs(allocation.amount)),
                0
            )

            from TransactionAllocation allocation

            join allocation.financialTransaction
                transaction

            where allocation.organization.id =
                :organizationId

              and transaction.status =
                com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED

              and transaction.type =
                com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.INCOME

              and allocation.beneficiary.id =
                :partyId
            """)
    BigDecimal sumSettledIncomeDestinedToParty(

            @Param("organizationId") UUID organizationId,

            @Param("partyId") UUID partyId);

    @Query("""
            select coalesce(
                sum(abs(allocation.amount)),
                0
            )

            from TransactionAllocation allocation

            join allocation.financialTransaction
                transaction

            where allocation.organization.id =
                :organizationId

              and transaction.status =
                com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED

              and transaction.type =
                com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.EXPENSE

              and allocation.beneficiary.id =
                :partyId
            """)
    BigDecimal sumSettledExpensePaidToParty(

            @Param("organizationId") UUID organizationId,

            @Param("partyId") UUID partyId);

    @Query("""
            select count(
                distinct transaction.id
            )

            from TransactionAllocation allocation

            join allocation.financialTransaction
                transaction

            where allocation.organization.id =
                :organizationId

              and transaction.status =
                com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED

              and transaction.type <>
                com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.TRANSFER

              and (
                    allocation.sourceParty.id =
                        :partyId

                    or allocation.beneficiary.id =
                        :partyId
                  )
            """)
    long countSettledTransactionsByParty(

            @Param("organizationId") UUID organizationId,

            @Param("partyId") UUID partyId);

    @Query("""
            select distinct allocation

            from TransactionAllocation allocation

            join fetch allocation.financialTransaction
                transaction

            join fetch transaction.account
                account

            join fetch allocation.fund
                fund

            left join fetch allocation.sourceParty
                sourceParty

            left join fetch allocation.beneficiary
                recipientParty

            left join fetch allocation.financialCommitment
                commitment

            where allocation.organization.id =
                :organizationId

              and transaction.status =
                com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED

              and transaction.type <>
                com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.TRANSFER

              and (
                    sourceParty.id =
                        :partyId

                    or recipientParty.id =
                        :partyId
                  )

            order by
                transaction.settlementDate desc,
                allocation.createdAt desc
            """)
    List<TransactionAllocation> findRecentSettledByFinancialParty(
            @Param("organizationId") UUID organizationId,
            @Param("partyId") UUID partyId,
            Pageable pageable);
}