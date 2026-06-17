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
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportProjection;
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
              and (
                    (
                      a.amount > 0
                      and ft.settlementDate between :startDate and :endDate
                    )
                    or
                    (
                      a.amount < 0
                      and coalesce(a.referenceMonth, ft.settlementDate) between :startDate and :endDate
                    )
                  )
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
              and (
                    (
                      a.amount > 0
                      and ft.settlementDate between :startDate and :endDate
                    )
                    or
                    (
                      a.amount < 0
                      and coalesce(a.referenceMonth, ft.settlementDate) between :startDate and :endDate
                    )
                  )
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
}