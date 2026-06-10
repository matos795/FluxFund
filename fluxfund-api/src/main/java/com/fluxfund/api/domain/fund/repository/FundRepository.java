package com.fluxfund.api.domain.fund.repository;

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

import com.fluxfund.api.domain.dashboard.dto.FundOverviewProjection;
import com.fluxfund.api.domain.fund.Fund;

public interface FundRepository extends JpaRepository<Fund, UUID> {

        Page<Fund> findAllByOrganizationIdAndActiveTrue(
                        UUID organizationId,
                        Pageable pageable);

        boolean existsByOrganizationIdAndNameIgnoreCase(
                        UUID organizationId,
                        String name);

        boolean existsByOrganizationIdAndNameIgnoreCaseAndIdNot(
                        UUID organizationId,
                        String name,
                        UUID id);

        Optional<Fund> findByIdAndOrganizationIdAndActiveTrue(UUID fundId, UUID organizationId);

        @Query("""
                                select coalesce(sum(f.initialBalance), 0)
                                from Fund f
                                where f.organization.id = :organizationId
                                and f.active = true
                        """)
        BigDecimal sumInitialBalanceByOrganizationId(
                        @Param("organizationId") UUID organizationId);

        List<Fund> findByOrganizationIdAndActiveTrueOrderByNameAsc(UUID organizationId);

        @Query(value = """
                        select
                            f.id as fundId,
                            f.name as fundName,
                            f.initial_balance as initialBalance,

                            coalesce((
                                select sum(a.amount)
                                from transaction_allocation a
                                where a.fund_id = f.id
                                  and a.organization_id = :organizationId
                            ), 0) as currentMovement,

                            coalesce((
                                select sum(abs(a.amount))
                                from transaction_allocation a
                                join financial_transaction t on t.id = a.financial_transaction_id
                                where a.fund_id = f.id
                                  and a.organization_id = :organizationId
                                  and t.status = 'SETTLED'
                                  and t.type = 'INCOME'
                                  and t.settlement_date between :startDate and :endDate
                            ), 0) as incomeAllocated,

                            coalesce((
                                select sum(abs(a.amount))
                                from transaction_allocation a
                                join financial_transaction t on t.id = a.financial_transaction_id
                                where a.fund_id = f.id
                                  and a.organization_id = :organizationId
                                  and t.status = 'SETTLED'
                                  and t.type = 'EXPENSE'
                                  and t.settlement_date between :startDate and :endDate
                            ), 0) as expenseAllocated

                        from fund f
                        where f.organization_id = :organizationId
                          and f.active = true
                        order by abs(
                            f.initial_balance +
                            coalesce((
                                select sum(a.amount)
                                from transaction_allocation a
                                where a.fund_id = f.id
                                  and a.organization_id = :organizationId
                            ), 0)
                        ) desc
                        limit :limit
                        """, nativeQuery = true)
        List<FundOverviewProjection> findFundsOverview(
                        @Param("organizationId") UUID organizationId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        @Param("limit") int limit);
}
