package com.fluxfund.api.domain.financialtransaction.repository;

import java.math.BigDecimal;
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

import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.report.dto.category.CategoryResultItemResponse;

public interface FinancialTransactionRepository
        extends JpaRepository<FinancialTransaction, UUID>,
        JpaSpecificationExecutor<FinancialTransaction> {

    Page<FinancialTransaction> findAllByOrganizationId(
            UUID organizationId,
            Pageable pageable);

    Optional<FinancialTransaction> findByIdAndOrganizationId(
            UUID id,
            UUID organizationId);

    boolean existsByOrganizationIdAndAccountIdAndExternalId(
            UUID organizationId,
            UUID accountId,
            String externalId);

    @Query("""
            select coalesce(sum(abs(t.settledAmount)), 0)
            from FinancialTransaction t
            where t.organization.id = :organizationId
              and t.status = :status
              and t.type = :type
              and t.settlementDate between :startDate and :endDate
            """)
    BigDecimal sumSettledAmountByTypeAndPeriod(
            @Param("organizationId") UUID organizationId,
            @Param("status") FinancialTransactionStatus status,
            @Param("type") FinancialTransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            select coalesce(sum(abs(t.settledAmount)), 0)
            from FinancialTransaction t
            where t.organization.id = :organizationId
              and t.status = :status
              and t.type = :type
            """)
    BigDecimal sumSettledAmountByType(
            @Param("organizationId") UUID organizationId,
            @Param("status") FinancialTransactionStatus status,
            @Param("type") FinancialTransactionType type);

    long countByOrganizationIdAndStatusNotAndSettlementDateBetween(
            UUID organizationId,
            FinancialTransactionStatus status,
            LocalDate startDate,
            LocalDate endDate);

    @Query("""
            select count(t)
            from FinancialTransaction t
            where t.organization.id = :organizationId
              and t.status <> :canceledStatus
              and t.category is null
            """)
    long countUnclassifiedByOrganizationId(
            @Param("organizationId") UUID organizationId,
            @Param("canceledStatus") FinancialTransactionStatus canceledStatus);

    @Query("""
            select count(t)
            from FinancialTransaction t
            where t.organization.id = :organizationId
              and t.status = :settledStatus
              and t.type <> :transferType
              and t.category is not null
              and abs(t.settledAmount) > (
                  select coalesce(sum(abs(a.amount)), 0)
                  from TransactionAllocation a
                  where a.financialTransaction = t
              )
            """)
    long countUnallocatedByOrganizationId(
            @Param("organizationId") UUID organizationId,
            @Param("settledStatus") FinancialTransactionStatus settledStatus,
            @Param("transferType") FinancialTransactionType transferType);

    @Query("""
            select new com.fluxfund.api.domain.report.dto.category.CategoryResultItemResponse(
                c.id,
                c.name,
                parent.id,
                parent.name,
                t.type,
                coalesce(sum(abs(t.settledAmount)), 0),
                count(t)
            )
            from FinancialTransaction t
            join t.category c
            left join c.parent parent
            where t.organization.id = :organizationId
              and t.status = com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED
              and t.type <> com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.TRANSFER
              and t.settlementDate between :startDate and :endDate
            group by c.id, c.name, parent.id, parent.name, t.type
            order by t.type asc, parent.name asc, c.name asc
            """)
    List<CategoryResultItemResponse> findCategoryResultReport(
            @Param("organizationId") UUID organizationId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            select distinct t
            from FinancialTransaction t
            join fetch t.account acc
            left join fetch t.category c
            left join fetch t.allocations allocation
            left join fetch allocation.fund fund
            left join fetch allocation.beneficiary beneficiary
            where t.organization.id = :organizationId
              and t.status = com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED
              and t.type in (
                  com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.INCOME,
                  com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.EXPENSE
              )
              and t.settlementDate between :startDate and :endDate
            order by t.settlementDate asc, t.createdAt asc
            """)
    List<FinancialTransaction> findSettledIncomeAndExpenseForExport(
            @Param("organizationId") UUID organizationId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
