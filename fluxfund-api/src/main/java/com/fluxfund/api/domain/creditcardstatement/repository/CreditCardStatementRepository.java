package com.fluxfund.api.domain.creditcardstatement.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.report.projection.PendingCreditCardStatementProjection;

public interface CreditCardStatementRepository extends JpaRepository<CreditCardStatement, UUID> {

  Page<CreditCardStatement> findAllByOrganizationIdAndCreditCardAccountIdAndStatus(
      UUID organizationId,
      UUID creditCardAccountId,
      CreditCardStatementStatus status,
      Pageable pageable);

  Page<CreditCardStatement> findAllByOrganizationIdAndCreditCardAccountId(
      UUID organizationId,
      UUID creditCardAccountId,
      Pageable pageable);

  Page<CreditCardStatement> findAllByOrganizationIdAndStatus(
      UUID organizationId,
      CreditCardStatementStatus status,
      Pageable pageable);

  Page<CreditCardStatement> findAllByOrganizationId(
      UUID organizationId,
      Pageable pageable);

  Optional<CreditCardStatement> findByIdAndOrganizationId(
      UUID id,
      UUID organizationId);

  @Query("""
      select statement
      from CreditCardStatement statement
      join fetch statement.creditCardAccount
      left join fetch statement.paymentAccount
      left join fetch statement.paymentTransaction
      where statement.id = :statementId
        and statement.organization.id = :organizationId
      """)
  Optional<CreditCardStatement> findForReport(
      @Param("organizationId") UUID organizationId,
      @Param("statementId") UUID statementId);

  @Query(value = """
      select
          s.id as id,
          s.name as name,
          a.name as accountName,
          s.status as status,
          s.due_date as dueDate,
          (
                coalesce(s.previous_balance_amount, 0)
                +
                coalesce((
                    select sum(
                        abs(
                            coalesce(
                                item.expected_amount,
                                item.settled_amount,
                                0
                            )
                        )
                    )
                    from financial_transaction item
                    where item.credit_card_statement_id = s.id
                    and item.organization_id = :organizationId
                    and item.status <> 'CANCELED'
                ), 0)
            ) as totalAmount,
          (
              select count(*)
              from financial_transaction item
              where item.credit_card_statement_id = s.id
                and item.organization_id = :organizationId
                and item.status <> 'CANCELED'
                and (
                      item.category_id is null
                      or abs(coalesce(item.expected_amount, item.settled_amount, 0)) >
                         coalesce((
                             select sum(abs(ta.amount))
                             from transaction_allocation ta
                             where ta.financial_transaction_id = item.id
                               and ta.organization_id = :organizationId
                         ), 0)
                )
          ) as pendingItemsCount,
          case
              when s.status = 'OPEN' then 'Fatura aberta'
              when s.status = 'CLOSED' then 'Fatura fechada ainda não paga'
              else 'Fatura pendente'
          end as reason
      from credit_card_statement s
      join account a on a.id = s.credit_card_account_id
      where s.organization_id = :organizationId
        and s.status = 'CLOSED'
      order by s.due_date asc nulls last, s.created_at desc
      limit :limit
      """, nativeQuery = true)
  List<PendingCreditCardStatementProjection> findPendingCreditCardStatementItems(
      @Param("organizationId") UUID organizationId,
      @Param("limit") int limit);

  @Query(value = """
      select count(*)
      from credit_card_statement s
      where s.organization_id = :organizationId
  and s.status = 'CLOSED'
      """, nativeQuery = true)
  long countPendingCreditCardStatements(
      @Param("organizationId") UUID organizationId);

      @Query("""
    select distinct statement

    from CreditCardStatement statement

    join fetch statement.creditCardAccount

    left join fetch statement.paymentAccount

    left join fetch statement.paymentTransaction

    where statement.organization.id =
        :organizationId

      and statement.status <>
        :canceledStatementStatus

      and exists (

          select item.id

          from FinancialTransaction item

          where item.creditCardStatement =
              statement

            and item.organization.id =
              :organizationId

            and item.status <>
              :canceledTransactionStatus

            and coalesce(
                  item.purchaseDate,
                  item.settlementDate,
                  item.dueDate
                )
                between :startDate and :endDate
      )

    order by
        statement.dueDate asc,
        statement.name asc
    """)
List<CreditCardStatement>
        findForClosingDossierByItemPeriod(
            @Param("organizationId")
            UUID organizationId,
            @Param("startDate")
            LocalDate startDate,
            @Param("endDate")
            LocalDate endDate,
            @Param("canceledStatementStatus")
            CreditCardStatementStatus
                    canceledStatementStatus,
            @Param("canceledTransactionStatus")
            FinancialTransactionStatus
                    canceledTransactionStatus
        );

  @Query("""
      select distinct statement
      from CreditCardStatement statement
      join fetch statement.creditCardAccount
      join fetch statement.paymentTransaction
      where statement.organization.id = :organizationId
        and statement.status = :status
        and statement.paymentTransaction.id in :paymentTransactionIds
      """)
  List<CreditCardStatement> findPaidForClosingDossier(
      @Param("organizationId") UUID organizationId,
      @Param("status") CreditCardStatementStatus status,
      @Param("paymentTransactionIds") List<UUID> paymentTransactionIds);
}