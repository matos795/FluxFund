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

import com.fluxfund.api.domain.dashboard.dto.DashboardTransactionActionItemProjection;
import com.fluxfund.api.domain.dashboard.dto.ExpenseByCategoryProjection;
import com.fluxfund.api.domain.dashboard.dto.MonthlyCashFlowProjection;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.report.dto.category.CategoryResultItemResponse;
import com.fluxfund.api.domain.report.dto.expense.SettledExpenseReportItemResponse;
import com.fluxfund.api.domain.report.dto.income.SettledIncomeReportItemResponse;
import com.fluxfund.api.domain.report.projection.PendingDocumentTransactionProjection;

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
                          and coalesce(
                        t.purchaseDate,
                        t.settlementDate
                ) between :startDate and :endDate
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

        @Query("""
        select count(transaction)
        from FinancialTransaction transaction

        where transaction.organization.id =
            :organizationId

          and transaction.status <>
            :canceledStatus

          and coalesce(
                transaction.purchaseDate,
                transaction.settlementDate
              )
              between :startDate and :endDate
        """)
        long countByOrganizationIdAndReportDateBetween(
                @Param("organizationId") UUID organizationId,
                @Param("canceledStatus") FinancialTransactionStatus canceledStatus,
                @Param("startDate") LocalDate startDate,
                @Param("endDate") LocalDate endDate);

        @Query("""
                        select count(t)
                        from FinancialTransaction t
                        where t.organization.id = :organizationId
                          and t.status <> :canceledStatus
                          and t.type <> :transferType
                          and t.category is null
                        """)
        long countUnclassifiedByOrganizationId(
                        @Param("organizationId") UUID organizationId,
                        @Param("canceledStatus") FinancialTransactionStatus canceledStatus,
                        @Param("transferType") FinancialTransactionType transferType);

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
                            category.id,
                            coalesce(category.name, 'Sem categoria'),
                            parent.id,
                            parent.name,
                            transaction.type,
                            coalesce(sum(abs(transaction.settledAmount)), 0),
                            count(transaction)
                        )
                        from FinancialTransaction transaction

                        left join transaction.category category
                        left join category.parent parent

                        where transaction.organization.id = :organizationId

                          and transaction.status =
                              com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED

                          and transaction.type <>
                              com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.TRANSFER

                          and coalesce(
                                transaction.purchaseDate,
                                transaction.settlementDate
                        ) between :startDate and :endDate

                        group by
                            category.id,
                            category.name,
                            parent.id,
                            parent.name,
                            transaction.type

                        order by
                            transaction.type asc,
                            parent.name asc,
                            category.name asc
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
                        left join fetch allocation.sourceParty sourceParty
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

        @Query("""
                        select new com.fluxfund.api.domain.report.dto.expense.SettledExpenseReportItemResponse(
                            t.settlementDate,
                            coalesce(t.description, t.rawDescription),
                            coalesce(c.name, 'Sem categoria'),
                            acc.name,
                            abs(t.settledAmount)
                        )
                        from FinancialTransaction t
                        join t.account acc
                        left join t.category c
                        where t.organization.id = :organizationId
                          and t.status = com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED
                          and t.type = com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.EXPENSE
                          and t.settlementDate between :startDate and :endDate
                        order by t.settlementDate asc, t.createdAt asc
                        """)
        List<SettledExpenseReportItemResponse> findSettledExpenseReport(
                        @Param("organizationId") UUID organizationId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        @Query("""
                        select new com.fluxfund.api.domain.report.dto.income.SettledIncomeReportItemResponse(
                            t.settlementDate,
                            coalesce(t.description, t.rawDescription),
                            coalesce(c.name, 'Sem categoria'),
                            acc.name,
                            abs(t.settledAmount)
                        )
                        from FinancialTransaction t
                        join t.account acc
                        left join t.category c
                        where t.organization.id = :organizationId
                          and t.status = com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED
                          and t.type = com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.INCOME
                          and t.settlementDate between :startDate and :endDate
                        order by t.settlementDate asc, t.createdAt asc
                        """)
        List<SettledIncomeReportItemResponse> findSettledIncomeReport(
                        @Param("organizationId") UUID organizationId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        @Query("""
                                    select coalesce(sum(
                                        case
                                            when t.type =
                                                com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.INCOME
                                            then abs(t.settledAmount)

                                            when t.type =
                                                com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.EXPENSE
                                            then -abs(t.settledAmount)

                                            when t.type =
                                                com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.TRANSFER
                                                and t.transferDirection =
                                                    com.fluxfund.api.domain.financialtransaction.TransferDirection.IN
                                            then abs(t.settledAmount)

                                            when t.type =
                                                com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.TRANSFER
                                                and t.transferDirection =
                                                    com.fluxfund.api.domain.financialtransaction.TransferDirection.OUT
                                            then -abs(t.settledAmount)

                                            else 0
                                        end
                                    ), 0)
                                    from FinancialTransaction t
                                    where t.organization.id = :organizationId
                                      and t.account.id = :accountId
                                      and t.status =
                                          com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED
                                      and t.settlementDate < :startDate
                                      and (
                            t.account.initialBalanceDate is null
                            or t.settlementDate >= t.account.initialBalanceDate
                        )
                                    """)
        BigDecimal sumSignedSettledAccountMovementBeforeDate(
                        @Param("organizationId") UUID organizationId,
                        @Param("accountId") UUID accountId,
                        @Param("startDate") LocalDate startDate);

        @Query("""
                        select t
                        from FinancialTransaction t
                        join fetch t.account account
                        left join fetch t.category category
                        left join fetch t.transferCounterpartyAccount counterpartyAccount
                        where t.organization.id = :organizationId
                          and t.account.id = :accountId
                          and t.status =
                              com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED
                          and t.settlementDate between :startDate and :endDate
                        order by t.settlementDate asc, t.createdAt asc, t.id asc
                        """)
        List<FinancialTransaction> findSettledAccountMovementReportTransactions(
                        @Param("organizationId") UUID organizationId,
                        @Param("accountId") UUID accountId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        @Query(value = """
        select
            to_char(
                date_trunc(
                    'month',
                    coalesce(
                        t.purchase_date,
                        t.settlement_date
                    )
                ),
                'YYYY-MM'
            ) as month,

            coalesce(sum(
                case
                    when t.type = 'INCOME'
                    then abs(t.settled_amount)
                    else 0
                end
            ), 0) as income,

            coalesce(sum(
                case
                    when t.type = 'EXPENSE'
                    then abs(t.settled_amount)
                    else 0
                end
            ), 0) as expense

        from financial_transaction t

        where t.organization_id = :organizationId
          and t.status = 'SETTLED'
          and t.type in ('INCOME', 'EXPENSE')

          and coalesce(
                t.purchase_date,
                t.settlement_date
              ) between :startDate and :endDate

        group by date_trunc(
            'month',
            coalesce(
                t.purchase_date,
                t.settlement_date
            )
        )

        order by date_trunc(
            'month',
            coalesce(
                t.purchase_date,
                t.settlement_date
            )
        )
        """, nativeQuery = true)
List<MonthlyCashFlowProjection> findMonthlyCashFlow(
        @Param("organizationId") UUID organizationId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

        @Query(value = """
                        select
                            c.id as categoryId,
                            c.name as categoryName,
                            coalesce(sum(abs(t.settled_amount)), 0) as amount
                        from financial_transaction t
                        join category c on c.id = t.category_id
                        where t.organization_id = :organizationId
                          and t.status = 'SETTLED'
                          and t.type = 'EXPENSE'
                          and t.category_id is not null
                          and coalesce(
                                t.purchase_date,
                                t.settlement_date
                                ) between :startDate and :endDate
                        group by c.id, c.name
                        order by amount desc
                        limit :limit
                        """, nativeQuery = true)
        List<ExpenseByCategoryProjection> findExpensesByCategory(
                        @Param("organizationId") UUID organizationId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        @Param("limit") int limit);

        @Query(value = """
                        select count(*)
                        from financial_transaction t
                        join category c
                          on c.id = t.category_id
                         and c.organization_id = :organizationId
                        left join organization_settings os
                          on os.organization_id = t.organization_id
                        where t.organization_id = :organizationId
                          and t.status = 'SETTLED'
                          and t.type = 'EXPENSE'
                          and t.settlement_date between :startDate and :endDate
                          and (
                              t.fiscal_document_policy = 'REQUIRED'
                              or (
                                  coalesce(t.fiscal_document_policy, 'CATEGORY') = 'CATEGORY'
                                  and c.requires_fiscal_document = true
                                  and coalesce(os.require_fiscal_document_for_expenses, true) = true
                              )
                          )
                          and not exists (
                              select 1
                              from attachment a
                              where a.financial_transaction_id = t.id
                                and a.organization_id = :organizationId
                                and a.type in ('INVOICE', 'RECEIPT', 'CONTRACT')
                          )
                        """, nativeQuery = true)
        long countSettledExpensesWithoutFiscalDocument(
                        @Param("organizationId") UUID organizationId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        @Query(value = """
                            select
                                t.id as transactionId,
                                t.settlement_date as settlementDate,
                                t.description as description,
                                t.raw_description as rawDescription,
                                a.name as accountName,
                                null as categoryName,
                                abs(t.settled_amount) as amount
                            from financial_transaction t
                            join account a on a.id = t.account_id
                            where t.organization_id = :organizationId
                        and t.status != 'CANCELED'
                        and t.type != 'TRANSFER'
                        and t.category_id is null
                            order by coalesce(t.settlement_date, t.due_date) desc, t.created_at desc
                            limit :limit
                            """, nativeQuery = true)
        List<DashboardTransactionActionItemProjection> findUnclassifiedActionItems(
                        @Param("organizationId") UUID organizationId,
                        @Param("limit") int limit);

        @Query(value = """
                        select
                            t.id as transactionId,
                            t.settlement_date as settlementDate,
                            t.description as description,
                            t.raw_description as rawDescription,
                            a.name as accountName,
                            c.name as categoryName,
                            abs(t.settled_amount) as amount
                        from financial_transaction t
                        join account a on a.id = t.account_id
                        join category c on c.id = t.category_id
                        where t.organization_id = :organizationId
                          and t.status = 'SETTLED'
                          and t.category_id is not null
                          and t.type != 'TRANSFER'
                          and abs(t.settled_amount) > coalesce((
                              select sum(abs(ta.amount))
                              from transaction_allocation ta
                              where ta.financial_transaction_id = t.id
                                and ta.organization_id = :organizationId
                          ), 0)
                        order by t.settlement_date desc, t.created_at desc
                        limit :limit
                        """, nativeQuery = true)
        List<DashboardTransactionActionItemProjection> findUnallocatedActionItems(
                        @Param("organizationId") UUID organizationId,
                        @Param("limit") int limit);

        @Query(value = """
                        select
                            t.id as transactionId,
                            t.settlement_date as settlementDate,
                            t.description as description,
                            t.raw_description as rawDescription,
                            a.name as accountName,
                            c.name as categoryName,
                            abs(t.settled_amount) as amount
                        from financial_transaction t
                        join account a
                          on a.id = t.account_id
                        join category c
                          on c.id = t.category_id
                         and c.organization_id = :organizationId
                        left join organization_settings os
                          on os.organization_id = t.organization_id
                        where t.organization_id = :organizationId
                          and t.status = 'SETTLED'
                          and t.type = 'EXPENSE'
                          and t.settlement_date between :startDate and :endDate
                          and (
                              t.fiscal_document_policy = 'REQUIRED'
                              or (
                                  coalesce(t.fiscal_document_policy, 'CATEGORY') = 'CATEGORY'
                                  and c.requires_fiscal_document = true
                                  and coalesce(os.require_fiscal_document_for_expenses, true) = true
                              )
                          )
                          and not exists (
                              select 1
                              from attachment att
                              where att.financial_transaction_id = t.id
                                and att.organization_id = :organizationId
                                and att.type in ('INVOICE', 'RECEIPT', 'CONTRACT')
                          )
                        order by t.settlement_date desc, t.created_at desc
                        limit :limit
                        """, nativeQuery = true)
        List<DashboardTransactionActionItemProjection> findExpensesWithoutFiscalDocumentActionItems(
                        @Param("organizationId") UUID organizationId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        @Param("limit") int limit);

        List<FinancialTransaction> findAllByCreditCardStatementIdAndOrganizationId(
                        UUID creditCardStatementId,
                        UUID organizationId);

        @Query("""
                        select coalesce(sum(abs(ft.expectedAmount)), 0)
                        from FinancialTransaction ft
                        where ft.organization.id = :organizationId
                          and ft.creditCardStatement.id = :statementId
                          and ft.status <> com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.CANCELED
                        """)
        BigDecimal sumCreditCardStatementTotal(
                        @Param("organizationId") UUID organizationId,
                        @Param("statementId") UUID statementId);

        @Query("""
                        select count(ft)
                        from FinancialTransaction ft
                        where ft.organization.id = :organizationId
                          and ft.creditCardStatement.id = :statementId
                          and ft.status <> com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.CANCELED
                        """)
        long countCreditCardStatementItems(
                        @Param("organizationId") UUID organizationId,
                        @Param("statementId") UUID statementId);

        boolean existsByOrganizationIdAndCreditCardStatementIdAndExternalId(
                        UUID organizationId,
                        UUID creditCardStatementId,
                        String externalId);

        @Query("""
                        select ft
                        from FinancialTransaction ft
                        left join fetch ft.account
                        left join fetch ft.category
                        where ft.organization.id = :organizationId
                          and ft.creditCardStatement.id = :statementId
                          and ft.status <> com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.CANCELED
                        order by
                          coalesce(ft.purchaseDate, ft.dueDate) asc,
                          ft.createdAt asc,
                          ft.id asc
                        """)
        List<FinancialTransaction> findCreditCardStatementItems(
                        @Param("organizationId") UUID organizationId,
                        @Param("statementId") UUID statementId);

        @Query("""
                            select coalesce(sum(
                                case
                                    when t.type = com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.INCOME
                                        then abs(t.settledAmount)
                                    when t.type = com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.EXPENSE
                                        then -abs(t.settledAmount)
                                    when t.type = com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.TRANSFER
                                         and t.transferDirection = com.fluxfund.api.domain.financialtransaction.TransferDirection.IN
                                        then abs(t.settledAmount)
                                    when t.type = com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.TRANSFER
                                         and t.transferDirection = com.fluxfund.api.domain.financialtransaction.TransferDirection.OUT
                                        then -abs(t.settledAmount)
                                    else 0
                                end
                            ), 0)
                            from FinancialTransaction t
                            where t.organization.id = :organizationId
                              and t.account.id = :accountId
                              and t.status = com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED
                        """)
        BigDecimal sumAccountMovementBalance(
                        @Param("organizationId") UUID organizationId,
                        @Param("accountId") UUID accountId);

        @Query("""
                        select ft
                        from FinancialTransaction ft
                        where ft.organization.id = :organizationId
                          and ft.transferGroupId = :transferGroupId
                        """)
        List<FinancialTransaction> findAllByOrganizationIdAndTransferGroupId(
                        @Param("organizationId") UUID organizationId,
                        @Param("transferGroupId") UUID transferGroupId);

        @Query(value = """
                        select count(*)
                        from financial_transaction t
                        where t.organization_id = :organizationId
                          and t.status = 'SETTLED'
                          and t.type = 'EXPENSE'
                          and t.settlement_date between :startDate and :endDate
                          and t.fiscal_document_policy = 'MISSING'
                          and not exists (
                              select 1
                              from attachment a
                              where a.financial_transaction_id = t.id
                                and a.organization_id = :organizationId
                                and a.type in ('INVOICE', 'RECEIPT', 'CONTRACT')
                          )
                        """, nativeQuery = true)
        long countSettledExpensesWithMissingFiscalDocument(
                        @Param("organizationId") UUID organizationId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        @Query(value = """
                        select
                            t.id as transactionId,
                            t.settlement_date as settlementDate,
                            t.description as description,
                            t.raw_description as rawDescription,
                            a.name as accountName,
                            c.name as categoryName,
                            abs(t.settled_amount) as amount
                        from financial_transaction t
                        join account a
                          on a.id = t.account_id
                        left join category c
                          on c.id = t.category_id
                         and c.organization_id = :organizationId
                        where t.organization_id = :organizationId
                          and t.status = 'SETTLED'
                          and t.type = 'EXPENSE'
                          and t.settlement_date between :startDate and :endDate
                          and t.fiscal_document_policy = 'MISSING'
                          and not exists (
                              select 1
                              from attachment att
                              where att.financial_transaction_id = t.id
                                and att.organization_id = :organizationId
                                and att.type in ('INVOICE', 'RECEIPT', 'CONTRACT')
                          )
                        order by t.settlement_date desc, t.created_at desc
                        limit :limit
                        """, nativeQuery = true)
        List<DashboardTransactionActionItemProjection> findMissingFiscalDocumentActionItems(
                        @Param("organizationId") UUID organizationId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        @Param("limit") int limit);

        @Query(value = """
                        select
                            t.id as transactionId,
                            t.settlement_date as settlementDate,
                            t.description as description,
                            t.raw_description as rawDescription,
                            a.name as accountName,
                            c.name as categoryName,
                            abs(coalesce(t.settled_amount, t.expected_amount, 0)) as amount,
                            case
                                when t.type = 'EXPENSE'
                                 and t.fiscal_document_policy = 'MISSING'
                                 and not exists (
                                    select 1
                                    from attachment att
                                    where att.financial_transaction_id = t.id
                                      and att.organization_id = :organizationId
                                      and att.type <> 'PROOF_OF_PAYMENT'
                                 )
                                then 'Documento fiscal marcado como ausente'

                                when t.type = 'EXPENSE'
                                 and (
                                    t.fiscal_document_policy = 'REQUIRED'
                                    or (
                                        coalesce(t.fiscal_document_policy, 'CATEGORY') = 'CATEGORY'
                                        and coalesce(c.requires_fiscal_document, true) = true
                                        and coalesce(os.require_fiscal_document_for_expenses, true) = true
                                    )
                                 )
                                 and not exists (
                                    select 1
                                    from attachment att
                                    where att.financial_transaction_id = t.id
                                      and att.organization_id = :organizationId
                                      and att.type <> 'PROOF_OF_PAYMENT'
                                 )
                                then 'Documento fiscal obrigatório ausente'

                                when coalesce(c.requires_payment_proof, false) = true
                                and not (
                                    t.source = 'CREDIT_CARD'
                                    and t.credit_card_statement_id is not null
                                )
                                 and not exists (
                                    select 1
                                    from attachment att
                                    where att.financial_transaction_id = t.id
                                      and att.organization_id = :organizationId
                                      and att.type = 'PROOF_OF_PAYMENT'
                                 )
                                then 'Comprovante de pagamento obrigatório ausente'

                                when t.type = 'INCOME'
                                 and coalesce(os.require_proof_for_incomes, false) = true
                                 and not exists (
                                    select 1
                                    from attachment att
                                    where att.financial_transaction_id = t.id
                                      and att.organization_id = :organizationId
                                 )
                                then 'Comprovante de receita obrigatório ausente'

                                else 'Documento obrigatório ausente'
                            end as reason
                        from financial_transaction t
                        join account a on a.id = t.account_id
                        left join category c
                          on c.id = t.category_id
                         and c.organization_id = :organizationId
                        left join organization_settings os
                          on os.organization_id = t.organization_id
                        where t.organization_id = :organizationId
                          and t.status = 'SETTLED'
                          and t.type in ('INCOME', 'EXPENSE')
                          and t.category_id is not null
                          and (
                                (
                                    t.type = 'EXPENSE'
                                    and t.fiscal_document_policy = 'MISSING'
                                    and not exists (
                                        select 1
                                        from attachment att
                                        where att.financial_transaction_id = t.id
                                          and att.organization_id = :organizationId
                                          and att.type <> 'PROOF_OF_PAYMENT'
                                    )
                                )
                                or
                                (
                                    t.type = 'EXPENSE'
                                    and (
                                        t.fiscal_document_policy = 'REQUIRED'
                                        or (
                                            coalesce(t.fiscal_document_policy, 'CATEGORY') = 'CATEGORY'
                                            and coalesce(c.requires_fiscal_document, true) = true
                                            and coalesce(os.require_fiscal_document_for_expenses, true) = true
                                        )
                                    )
                                    and not exists (
                                        select 1
                                        from attachment att
                                        where att.financial_transaction_id = t.id
                                          and att.organization_id = :organizationId
                                          and att.type <> 'PROOF_OF_PAYMENT'
                                    )
                                )
                                or
                                (
                                    coalesce(c.requires_payment_proof, false) = true
                                    and not (
                                        t.source = 'CREDIT_CARD'
                                        and t.credit_card_statement_id is not null
                                    )
                                    and not exists (
                                        select 1
                                        from attachment att
                                        where att.financial_transaction_id = t.id
                                          and att.organization_id = :organizationId
                                          and att.type = 'PROOF_OF_PAYMENT'
                                    )
                                )
                                or
                                (
                                    t.type = 'INCOME'
                                    and coalesce(os.require_proof_for_incomes, false) = true
                                    and not exists (
                                        select 1
                                        from attachment att
                                        where att.financial_transaction_id = t.id
                                          and att.organization_id = :organizationId
                                    )
                                )
                          )
                        order by t.settlement_date desc nulls last, t.created_at desc
                        limit :limit
                        """, nativeQuery = true)
        List<PendingDocumentTransactionProjection> findPendingDocumentItems(
                        @Param("organizationId") UUID organizationId,
                        @Param("limit") int limit);

        @Query(value = """
                        select count(*)
                        from financial_transaction t
                        left join category c
                          on c.id = t.category_id
                         and c.organization_id = :organizationId
                        left join organization_settings os
                          on os.organization_id = t.organization_id
                        where t.organization_id = :organizationId
                          and t.status = 'SETTLED'
                          and t.type in ('INCOME', 'EXPENSE')
                          and t.category_id is not null
                          and (
                                (
                                    t.type = 'EXPENSE'
                                    and t.fiscal_document_policy = 'MISSING'
                                    and not exists (
                                        select 1
                                        from attachment att
                                        where att.financial_transaction_id = t.id
                                          and att.organization_id = :organizationId
                                          and att.type <> 'PROOF_OF_PAYMENT'
                                    )
                                )
                                or
                                (
                                    t.type = 'EXPENSE'
                                    and (
                                        t.fiscal_document_policy = 'REQUIRED'
                                        or (
                                            coalesce(t.fiscal_document_policy, 'CATEGORY') = 'CATEGORY'
                                            and coalesce(c.requires_fiscal_document, true) = true
                                            and coalesce(os.require_fiscal_document_for_expenses, true) = true
                                        )
                                    )
                                    and not exists (
                                        select 1
                                        from attachment att
                                        where att.financial_transaction_id = t.id
                                          and att.organization_id = :organizationId
                                          and att.type <> 'PROOF_OF_PAYMENT'
                                    )
                                )
                                or
                                (
                                    coalesce(c.requires_payment_proof, false) = true
                                    and not (
                                        t.source = 'CREDIT_CARD'
                                        and t.credit_card_statement_id is not null
                                    )
                                    and not exists (
                                        select 1
                                        from attachment att
                                        where att.financial_transaction_id = t.id
                                          and att.organization_id = :organizationId
                                          and att.type = 'PROOF_OF_PAYMENT'
                                    )
                                )
                                or
                                (
                                    t.type = 'INCOME'
                                    and coalesce(os.require_proof_for_incomes, false) = true
                                    and not exists (
                                        select 1
                                        from attachment att
                                        where att.financial_transaction_id = t.id
                                          and att.organization_id = :organizationId
                                    )
                                )
                          )
                        """, nativeQuery = true)
        long countPendingDocumentItems(
                        @Param("organizationId") UUID organizationId);

        @Query("""
        select t
        from FinancialTransaction t
        where t.organization.id = :organizationId
          and t.id <> :transactionId
          and t.type = :type
          and t.status <>
              com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED
          and t.type <>
              com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.TRANSFER
          and t.category is not null
          and t.rawDescription is not null
          and lower(trim(t.rawDescription)) =
              lower(trim(:rawDescription))
        order by
            t.settlementDate desc,
            t.createdAt desc
        """)
List<FinancialTransaction>
        findClassificationSuggestionCandidates(
                @Param("organizationId") UUID organizationId,
                @Param("transactionId") UUID transactionId,
                @Param("type") FinancialTransactionType type,
                @Param("rawDescription") String rawDescription,
                Pageable pageable);

        @Query("""
                        select t
                        from FinancialTransaction t
                        join fetch t.account account
                        left join fetch t.category category
                        where t.organization.id = :organizationId
                          and t.account.id in :accountIds
                          and t.status = com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED
                          and t.settlementDate between :periodStartDate and :periodEndDate
                          and t.type in :types
                        order by account.name asc, t.settlementDate asc, t.createdAt asc
                        """)
        List<FinancialTransaction> findSettledForClosingDossier(
                        @Param("organizationId") UUID organizationId,
                        @Param("accountIds") List<UUID> accountIds,
                        @Param("periodStartDate") LocalDate periodStartDate,
                        @Param("periodEndDate") LocalDate periodEndDate,
                        @Param("types") List<FinancialTransactionType> types);

        @Query("""
                        select item
                        from FinancialTransaction item
                        join fetch item.creditCardStatement statement
                        left join fetch item.account
                        left join fetch item.category
                        where item.organization.id = :organizationId
                          and statement.id in :statementIds
                          and item.status <> :canceledStatus
                        order by statement.name asc, item.dueDate asc, item.createdAt asc
                        """)
        List<FinancialTransaction> findCreditCardStatementItemsForClosingDossier(
                        @Param("organizationId") UUID organizationId,
                        @Param("statementIds") List<UUID> statementIds,
                        @Param("canceledStatus") FinancialTransactionStatus canceledStatus);

        Optional<FinancialTransaction> findByOrganizationIdAndCreditCardStatementIdAndExternalId(
                        UUID organizationId,
                        UUID creditCardStatementId,
                        String externalId);

        Optional<FinancialTransaction> findByOrganizationIdAndAccountIdAndExternalId(
                        UUID organizationId,
                        UUID accountId,
                        String externalId);

        @Query("""
                        select coalesce(sum(
                            case
                                when transaction.type =
                                    com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.INCOME
                                then abs(transaction.settledAmount)

                                when transaction.type =
                                    com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.EXPENSE
                                then -abs(transaction.settledAmount)

                                when transaction.type =
                                    com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.TRANSFER
                                    and transaction.transferDirection =
                                        com.fluxfund.api.domain.financialtransaction.TransferDirection.IN
                                then abs(transaction.settledAmount)

                                when transaction.type =
                                    com.fluxfund.api.domain.financialtransaction.FinancialTransactionType.TRANSFER
                                    and transaction.transferDirection =
                                        com.fluxfund.api.domain.financialtransaction.TransferDirection.OUT
                                then -abs(transaction.settledAmount)

                                else 0
                            end
                        ), 0)
                        from FinancialTransaction transaction
                        where transaction.organization.id = :organizationId
                          and transaction.account.active = true
                          and transaction.account.type <>
                              com.fluxfund.api.domain.account.AccountType.CREDIT_CARD
                          and transaction.status =
                              com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED
                          and transaction.settlementDate <= :asOfDate
                          and (
                                transaction.account.initialBalanceDate is null
                                or transaction.settlementDate >=
                                    transaction.account.initialBalanceDate
                          )
                        """)
        BigDecimal sumSignedSettledRealAccountMovementUntilDate(
                        @Param("organizationId") UUID organizationId,
                        @Param("asOfDate") LocalDate asOfDate);

                        @Query("""
        select candidate
        from FinancialTransaction candidate

        join fetch candidate.account account

        where candidate.organization.id =
            :organizationId

          and candidate.id <> :transactionId

          and account.id <> :accountId

          and account.type <>
            com.fluxfund.api.domain.account.AccountType.CREDIT_CARD

          and candidate.status =
            com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED

          and candidate.type = :oppositeType

          and candidate.category is null

          and candidate.allocations is empty

          and candidate.transferGroupId is null

          and candidate.settlementDate
            between :startDate and :endDate

          and abs(
                coalesce(
                    candidate.settledAmount,
                    candidate.expectedAmount
                )
              ) = :amount
        """)
List<FinancialTransaction> findTransferMatchCandidates(
        @Param("organizationId") UUID organizationId,
        @Param("transactionId") UUID transactionId,
        @Param("accountId") UUID accountId,
        @Param("oppositeType") FinancialTransactionType oppositeType,
        @Param("amount") BigDecimal amount,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

        @Query("""
        select candidate
        from FinancialTransaction candidate

        join fetch candidate.account account

        where candidate.organization.id =
            :organizationId

          and account.id <> :accountId

          and account.type <>
            com.fluxfund.api.domain.account.AccountType.CREDIT_CARD

          and candidate.status =
            com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus.SETTLED

          and candidate.type = :oppositeType

          and candidate.category is null

          and candidate.allocations is empty

          and candidate.transferGroupId is null

          and candidate.settlementDate
            between :startDate and :endDate

          and abs(
                coalesce(
                    candidate.settledAmount,
                    candidate.expectedAmount
                )
              ) = :amount
        """)
List<FinancialTransaction>
        findDraftTransferMatchCandidates(
                @Param("organizationId") UUID organizationId,
                @Param("accountId") UUID accountId,
                @Param("oppositeType") FinancialTransactionType oppositeType,
                @Param("amount") BigDecimal amount,
                @Param("startDate") LocalDate startDate,
                @Param("endDate") LocalDate endDate);
}
