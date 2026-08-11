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

    Page<Account> findAllByOrganizationIdAndActiveTrue(UUID organizationId, Pageable pageable);

    Optional<Account> findByIdAndOrganizationIdAndActiveTrue(UUID accountId, UUID organizationId);

    Optional<Account> findByIdAndOrganizationId(UUID accountId, UUID organizationId);

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
                      a.initial_balance_date as initialBalanceDate,

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
                            and t.type = 'TRANSFER'
                            and t.transfer_direction = 'IN'
                            and t.settlement_date < :startDate
                            then abs(coalesce(t.settled_amount, 0))

                            when t.status = 'SETTLED'
                            and t.type = 'TRANSFER'
                            and t.transfer_direction = 'OUT'
                            and t.settlement_date < :startDate
                            then -abs(coalesce(t.settled_amount, 0))

                            else 0
                        end
                    ), 0) as transferNetBefore,

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
                            and t.transfer_direction = 'IN'
                            and t.settlement_date between :startDate and :endDate
                            then abs(coalesce(t.settled_amount, 0))

                            when t.status = 'SETTLED'
                            and t.type = 'TRANSFER'
                            and t.transfer_direction = 'OUT'
                            and t.settlement_date between :startDate and :endDate
                            then -abs(coalesce(t.settled_amount, 0))

                            else 0
                        end
                    ), 0) as transferNetAmount,

                    coalesce(sum(
                        case
                            when t.status = 'SETTLED'
                            and t.type = 'TRANSFER'
                            and t.transfer_direction = 'IN'
                            and t.settlement_date between :startDate and :endDate
                            then abs(coalesce(t.settled_amount, 0))

                            else 0
                        end
                    ), 0) as transferInAmount,

                    coalesce(sum(
                        case
                            when t.status = 'SETTLED'
                            and t.type = 'TRANSFER'
                            and t.transfer_direction = 'OUT'
                            and t.settlement_date between :startDate and :endDate
                            then abs(coalesce(t.settled_amount, 0))

                            else 0
                        end
                    ), 0) as transferOutAmount,

                      coalesce(sum(
                case
                    when t.status = 'SETTLED'
                     and t.type = 'INCOME'
                     and t.settlement_date <= current_date
                    then abs(coalesce(t.settled_amount, 0))
                    else 0
                end
            ), 0) as incomeUntilToday,

            coalesce(sum(
                case
                    when t.status = 'SETTLED'
                     and t.type = 'EXPENSE'
                     and t.settlement_date <= current_date
                    then abs(coalesce(t.settled_amount, 0))
                    else 0
                end
            ), 0) as expenseUntilToday,

            coalesce(sum(
                case
                    when t.status = 'SETTLED'
                    and t.type = 'TRANSFER'
                    and t.transfer_direction = 'IN'
                    and t.settlement_date <= current_date
                    then abs(coalesce(t.settled_amount, 0))

                    when t.status = 'SETTLED'
                    and t.type = 'TRANSFER'
                    and t.transfer_direction = 'OUT'
                    and t.settlement_date <= current_date
                    then -abs(coalesce(t.settled_amount, 0))

                    else 0
                end
            ), 0) as transferNetUntilToday,

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
                    and t.credit_card_statement_id is null
                    and t.source <> 'CREDIT_CARD'
                    and (
                            a.initial_balance_date is null
                            or t.settlement_date >= a.initial_balance_date
                    )
                  where a.organization_id = :organizationId
                    and a.active = true
                    and a.type <> 'CREDIT_CARD'
                  group by
                      a.id,
                      a.name,
                      a.type,
                      a.bank_name,
                      a.initial_balance,
                      a.initial_balance_date
                  order by a.name asc
                  """, nativeQuery = true)
    List<AccountCashFlowProjection> findAccountCashFlowReport(
            @Param("organizationId") UUID organizationId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    List<Account> findAllByIdInAndOrganizationIdAndActiveTrue(
            List<UUID> accountIds,
            UUID organizationId);

    @Query("""
            select coalesce(sum(account.initialBalance), 0)
            from Account account
            where account.organization.id = :organizationId
              and account.active = true
              and account.type <>
                  com.fluxfund.api.domain.account.AccountType.CREDIT_CARD
              and (
                    account.initialBalanceDate is null
                    or account.initialBalanceDate <= :asOfDate
              )
            """)
    BigDecimal sumTrackedRealAccountInitialBalance(
            @Param("organizationId") UUID organizationId,
            @Param("asOfDate") LocalDate asOfDate);

    
}