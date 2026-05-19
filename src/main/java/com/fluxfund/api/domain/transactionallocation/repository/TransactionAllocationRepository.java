package com.fluxfund.api.domain.transactionallocation.repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
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
        BigDecimal sumAmountByFundId(UUID organizationId, UUID fundId);

        @Query("""
        select coalesce(sum(a.amount), 0)
        from TransactionAllocation a
        where a.organization.id = :organizationId
          and a.fund.active = true
          and a.financialTransaction.status <> :canceledStatus
        """)
BigDecimal sumActiveFundAllocationsByOrganizationId(
        @Param("organizationId") UUID organizationId,
        @Param("canceledStatus") FinancialTransactionStatus canceledStatus
);
}
