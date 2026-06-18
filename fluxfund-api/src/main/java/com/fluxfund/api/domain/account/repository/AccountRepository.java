package com.fluxfund.api.domain.account.repository;

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

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.report.projection.AccountCashFlowProjection;

public interface AccountRepository extends JpaRepository<Account, UUID> {

  Page<Account> findAllByOrganizationIdAndActiveTrue(
      UUID organizationId,
      Pageable pageable);

  Optional<Account> findByIdAndOrganizationIdAndActiveTrue(UUID accountId, UUID organizationId);

  @Query("""
      select coalesce(sum(a.initialBalance), 0)
      from Account a
      where a.organization.id = :organizationId
        and a.active = true
      """)
  BigDecimal sumInitialBalanceByOrganizationId(
      @Param("organizationId") UUID organizationId);

  List<Account> findByOrganizationIdAndActiveTrueOrderByNameAsc(UUID organizationId);

  @Query(value = """
      select
          a.id as accountId,
          a.name as accountName,
          a.type as accountType,
          a.bank_name as bankName,
          coalesce(a.initial_balance, 0) as initialBalance,

          coalesce(sum(
              case
                  when t.status = 'SETTLED'
                   and t.type = 'INCOME'
                   and t.settlement_date < :startDate
                  then abs(coalesce(t.settled_amount, 0))
                  else 0
              end
          ), 0) as incomeBefore,

          coalesce(sum(
              case
                  when t.status = 'SETTLED'
                   and t.type = 'EXPENSE'
                   and t.settlement_date < :startDate
                  then abs(coalesce(t.settled_amount, 0))
                  else 0
              end
          ), 0) as expenseBefore,

          coalesce(sum(
              case
                  when t.status = 'SETTLED'
                   and t.type = 'INCOME'
                   and t.settlement_date between :startDate and :endDate
                  then abs(coalesce(t.settled_amount, 0))
                  else 0
              end
          ), 0) as incomeAmount,

          coalesce(sum(
              case
                  when t.status = 'SETTLED'
                   and t.type = 'EXPENSE'
                   and t.settlement_date between :startDate and :endDate
                  then abs(coalesce(t.settled_amount, 0))
                  else 0
              end
          ), 0) as expenseAmount,

          coalesce(sum(
              case
                  when t.status = 'SETTLED'
                   and t.type = 'TRANSFER'
                   and t.settlement_date between :startDate and :endDate
                  then abs(coalesce(t.settled_amount, 0))
                  else 0
              end
          ), 0) as transferAmount,

          cast(coalesce(sum(
              case
                  when t.status = 'SETTLED'
                   and t.settlement_date between :startDate and :endDate
                  then 1
                  else 0
              end
          ), 0) as bigint) as transactionCount

      from account a
      left join financial_transaction t
        on t.account_id = a.id
       and t.organization_id = :organizationId
      where a.organization_id = :organizationId
        and a.active = true
        and a.type <> 'CREDIT_CARD'
      group by
          a.id,
          a.name,
          a.type,
          a.bank_name,
          a.initial_balance
      order by a.name asc
      """, nativeQuery = true)
  List<AccountCashFlowProjection> findAccountCashFlowReport(
      @Param("organizationId") UUID organizationId,
      @Param("startDate") LocalDate startDate,
      @Param("endDate") LocalDate endDate);
}