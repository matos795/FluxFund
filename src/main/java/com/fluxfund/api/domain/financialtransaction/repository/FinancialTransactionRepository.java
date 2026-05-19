package com.fluxfund.api.domain.financialtransaction.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
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
}
