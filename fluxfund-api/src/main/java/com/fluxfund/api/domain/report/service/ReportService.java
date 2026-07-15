package com.fluxfund.api.domain.report.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.domain.dashboard.dto.DashboardTransactionActionItemProjection;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.TransferDirection;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.fundtransfer.repository.FundTransferRepository;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.organizationsettings.OrganizationSettings;
import com.fluxfund.api.domain.organizationsettings.repository.OrganizationSettingsRepository;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityAccountBreakdownResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountItemResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountProjection;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountReportResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityOpeningBalanceProjection;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportItemResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportProjection;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportResponse;
import com.fluxfund.api.domain.report.dto.accountcashflow.AccountCashFlowItemResponse;
import com.fluxfund.api.domain.report.dto.accountcashflow.AccountCashFlowReportResponse;
import com.fluxfund.api.domain.report.dto.accountmovement.AccountMovementReportItemResponse;
import com.fluxfund.api.domain.report.dto.accountmovement.AccountMovementReportResponse;
import com.fluxfund.api.domain.report.dto.category.CategoryResultItemResponse;
import com.fluxfund.api.domain.report.dto.category.CategoryResultReportResponse;
import com.fluxfund.api.domain.report.dto.creditcardstatement.CreditCardStatementCategorySummaryResponse;
import com.fluxfund.api.domain.report.dto.creditcardstatement.CreditCardStatementReportItemResponse;
import com.fluxfund.api.domain.report.dto.creditcardstatement.CreditCardStatementReportResponse;
import com.fluxfund.api.domain.report.dto.expense.SettledExpenseReportItemResponse;
import com.fluxfund.api.domain.report.dto.expense.SettledExpenseReportResponse;
import com.fluxfund.api.domain.report.dto.fund.FundMovementAllocationProjection;
import com.fluxfund.api.domain.report.dto.fund.FundMovementReportItemResponse;
import com.fluxfund.api.domain.report.dto.fund.FundMovementReportResponse;
import com.fluxfund.api.domain.report.dto.fund.FundReportItemResponse;
import com.fluxfund.api.domain.report.dto.fund.FundReportProjection;
import com.fluxfund.api.domain.report.dto.fund.FundReportResponse;
import com.fluxfund.api.domain.report.dto.fund.FundTransferPeriodProjection;
import com.fluxfund.api.domain.report.dto.income.SettledIncomeReportItemResponse;
import com.fluxfund.api.domain.report.dto.income.SettledIncomeReportResponse;
import com.fluxfund.api.domain.report.dto.pending.PendingCreditCardStatementResponse;
import com.fluxfund.api.domain.report.dto.pending.PendingFundResponse;
import com.fluxfund.api.domain.report.dto.pending.PendingItemsReportResponse;
import com.fluxfund.api.domain.report.dto.pending.PendingTransactionItemResponse;
import com.fluxfund.api.domain.report.projection.AccountCashFlowProjection;
import com.fluxfund.api.domain.report.projection.PendingCreditCardStatementProjection;
import com.fluxfund.api.domain.report.projection.PendingDocumentTransactionProjection;
import com.fluxfund.api.domain.supportagreement.SupportAgreement;
import com.fluxfund.api.domain.supportagreement.repository.SupportAgreementRepository;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

        private final OrganizationRepository organizationRepository;
        private final FinancialTransactionRepository financialTransactionRepository;
        private final TransactionAllocationRepository transactionAllocationRepository;
        private final SupportAgreementRepository supportAgreementRepository;
        private final OrganizationSettingsRepository organizationSettingsRepository;
        private final OrganizationAccessService organizationAccessService;
        private final FundTransferRepository fundTransferRepository;
        private final FundRepository fundRepository;
        private final CreditCardStatementRepository creditCardStatementRepository;
        private final AccountRepository accountRepository;

        public CategoryResultReportResponse getCategoryResultReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {
                organizationAccessService.requireReadAccess(organizationId);

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException("End date cannot be before start date");
                }

                var items = financialTransactionRepository.findCategoryResultReport(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                BigDecimal incomeTotal = items.stream()
                                .filter(item -> item.type() == FinancialTransactionType.INCOME)
                                .map(item -> item.total())
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal expenseTotal = items.stream()
                                .filter(item -> item.type() == FinancialTransactionType.EXPENSE)
                                .map(item -> item.total())
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal netTotal = incomeTotal.subtract(expenseTotal);

                return new CategoryResultReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                incomeTotal,
                                expenseTotal,
                                netTotal,
                                items);
        }

        public SettledExpenseReportResponse getSettledExpenseReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

                organizationAccessService.requireReadAccess(organizationId);

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException(
                                        "End date cannot be before start date");
                }

                List<SettledExpenseReportItemResponse> items = financialTransactionRepository.findSettledExpenseReport(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                List<CategoryResultItemResponse> categoryItems = financialTransactionRepository
                                .findCategoryResultReport(
                                                organizationId,
                                                resolvedStartDate,
                                                resolvedEndDate)
                                .stream()
                                .filter(item -> item.type() == FinancialTransactionType.EXPENSE)
                                .toList();

                BigDecimal totalPaidAmount = items.stream()
                                .map(SettledExpenseReportItemResponse::amount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                return new SettledExpenseReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                totalPaidAmount,
                                items.size(),
                                categoryItems,
                                items);
        }

        public SettledIncomeReportResponse getSettledIncomeReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

                organizationAccessService.requireReadAccess(organizationId);

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException(
                                        "End date cannot be before start date");
                }

                List<SettledIncomeReportItemResponse> items = financialTransactionRepository.findSettledIncomeReport(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                List<CategoryResultItemResponse> categoryItems = financialTransactionRepository
                                .findCategoryResultReport(
                                                organizationId,
                                                resolvedStartDate,
                                                resolvedEndDate)
                                .stream()
                                .filter(item -> item.type() == FinancialTransactionType.INCOME)
                                .toList();

                BigDecimal totalReceivedAmount = items.stream()
                                .map(SettledIncomeReportItemResponse::amount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                return new SettledIncomeReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                totalReceivedAmount,
                                items.size(),
                                categoryItems,
                                items);
        }

        public FundReportResponse getFundReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {
                organizationAccessService.requireReadAccess(organizationId);

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException("End date cannot be before start date");
                }

                var projections = transactionAllocationRepository.findFundReport(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                var items = projections.stream()
                                .map(projection -> {
                                        BigDecimal periodBalance = projection.incomeAllocated()
                                                        .subtract(projection.expenseAllocated());

                                        BigDecimal transferBalance = fundTransferRepository.sumNetAmountByFundId(
                                                        organizationId,
                                                        projection.fundId());

                                        BigDecimal currentBalance = projection.initialBalance()
                                                        .add(projection.historicalAllocationBalance())
                                                        .add(transferBalance);

                                        return new FundReportItemResponse(
                                                        projection.fundId(),
                                                        projection.fundName(),
                                                        projection.initialBalance(),
                                                        projection.incomeAllocated(),
                                                        projection.expenseAllocated(),
                                                        periodBalance,
                                                        currentBalance,
                                                        projection.allocationCount());
                                })
                                .toList();

                BigDecimal fundsTotalBalance = items.stream()
                                .map(FundReportItemResponse::currentBalance)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal incomeAllocatedTotal = items.stream()
                                .map(FundReportItemResponse::incomeAllocated)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal expenseAllocatedTotal = items.stream()
                                .map(FundReportItemResponse::expenseAllocated)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                long negativeFundsCount = items.stream()
                                .filter(item -> item.currentBalance().compareTo(BigDecimal.ZERO) < 0)
                                .count();

                return new FundReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                fundsTotalBalance,
                                incomeAllocatedTotal,
                                expenseAllocatedTotal,
                                negativeFundsCount,
                                items);
        }

        public FundMovementReportResponse getFundMovementReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

                organizationAccessService.requireReadAccess(organizationId);

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException(
                                        "End date cannot be before start date");
                }

                List<Fund> funds = fundRepository
                                .findByOrganizationIdOrderByNameAsc(organizationId);

                Map<UUID, FundMovementAllocationProjection> allocationsByFundId = transactionAllocationRepository
                                .findFundMovementAllocationsForPeriod(
                                                organizationId,
                                                resolvedStartDate,
                                                resolvedEndDate)
                                .stream()
                                .collect(Collectors.toMap(
                                                FundMovementAllocationProjection::fundId,
                                                projection -> projection));

                Map<UUID, BigDecimal> incomingTransfersByFundId = fundTransferRepository
                                .sumIncomingTransfersByFundForPeriod(
                                                organizationId,
                                                resolvedStartDate,
                                                resolvedEndDate)
                                .stream()
                                .collect(Collectors.toMap(
                                                FundTransferPeriodProjection::fundId,
                                                FundTransferPeriodProjection::totalAmount));

                Map<UUID, BigDecimal> outgoingTransfersByFundId = fundTransferRepository
                                .sumOutgoingTransfersByFundForPeriod(
                                                organizationId,
                                                resolvedStartDate,
                                                resolvedEndDate)
                                .stream()
                                .collect(Collectors.toMap(
                                                FundTransferPeriodProjection::fundId,
                                                FundTransferPeriodProjection::totalAmount));

                List<FundMovementReportItemResponse> items = funds.stream()
                                .map(fund -> {
                                        FundMovementAllocationProjection allocationProjection = allocationsByFundId
                                                        .get(fund.getId());

                                        BigDecimal incomeAllocatedAmount = allocationProjection != null
                                                        ? allocationProjection.incomeAllocatedAmount()
                                                        : BigDecimal.ZERO;

                                        BigDecimal expenseAllocatedAmount = allocationProjection != null
                                                        ? allocationProjection.expenseAllocatedAmount()
                                                        : BigDecimal.ZERO;

                                        long allocationCount = allocationProjection != null
                                                        && allocationProjection.allocationCount() != null
                                                                        ? allocationProjection.allocationCount()
                                                                        : 0L;

                                        BigDecimal incomingTransferAmount = incomingTransfersByFundId.getOrDefault(
                                                        fund.getId(),
                                                        BigDecimal.ZERO);

                                        BigDecimal outgoingTransferAmount = outgoingTransfersByFundId.getOrDefault(
                                                        fund.getId(),
                                                        BigDecimal.ZERO);

                                        BigDecimal netTransferAmount = incomingTransferAmount.subtract(
                                                        outgoingTransferAmount);

                                        BigDecimal netMovementAmount = incomeAllocatedAmount
                                                        .subtract(expenseAllocatedAmount)
                                                        .add(netTransferAmount);

                                        return new FundMovementReportItemResponse(
                                                        fund.getId(),
                                                        fund.getName(),
                                                        incomeAllocatedAmount,
                                                        expenseAllocatedAmount,
                                                        incomingTransferAmount,
                                                        outgoingTransferAmount,
                                                        netTransferAmount,
                                                        netMovementAmount,
                                                        allocationCount);
                                })
                                .filter(this::hasFundMovement)
                                .toList();

                BigDecimal incomeAllocatedTotal = items.stream()
                                .map(FundMovementReportItemResponse::incomeAllocatedAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal expenseAllocatedTotal = items.stream()
                                .map(FundMovementReportItemResponse::expenseAllocatedAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal incomingTransferTotal = items.stream()
                                .map(FundMovementReportItemResponse::incomingTransferAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal outgoingTransferTotal = items.stream()
                                .map(FundMovementReportItemResponse::outgoingTransferAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal netMovementTotal = items.stream()
                                .map(FundMovementReportItemResponse::netMovementAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                return new FundMovementReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                incomeAllocatedTotal,
                                expenseAllocatedTotal,
                                incomingTransferTotal,
                                outgoingTransferTotal,
                                netMovementTotal,
                                items);
        }

        public AccountMovementReportResponse getAccountMovementReport(
                        UUID organizationId,
                        UUID accountId,
                        LocalDate startDate,
                        LocalDate endDate) {

                organizationAccessService.requireReadAccess(organizationId);

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException(
                                        "End date cannot be before start date");
                }

                Account account = accountRepository
                                .findByIdAndOrganizationId(accountId, organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Account not found"));

                if (account.getType() == AccountType.CREDIT_CARD) {
                        throw new BusinessException(
                                        "Use the credit card statement report for credit card accounts");
                }

                validateAccountMovementReportStartDate(
                                account,
                                resolvedStartDate);

                BigDecimal initialBalance = account.getInitialBalance() != null
                                ? account.getInitialBalance()
                                : BigDecimal.ZERO;

                BigDecimal movementBeforePeriod = financialTransactionRepository
                                .sumSignedSettledAccountMovementBeforeDate(
                                                organizationId,
                                                accountId,
                                                resolvedStartDate);

                BigDecimal openingBalance = initialBalance.add(
                                movementBeforePeriod);

                List<FinancialTransaction> transactions = financialTransactionRepository
                                .findSettledAccountMovementReportTransactions(
                                                organizationId,
                                                accountId,
                                                resolvedStartDate,
                                                resolvedEndDate);

                BigDecimal incomeTotal = BigDecimal.ZERO;
                BigDecimal expenseTotal = BigDecimal.ZERO;
                BigDecimal transferInTotal = BigDecimal.ZERO;
                BigDecimal transferOutTotal = BigDecimal.ZERO;
                BigDecimal runningBalance = openingBalance;

                List<AccountMovementReportItemResponse> items = new ArrayList<>();

                for (FinancialTransaction transaction : transactions) {
                        BigDecimal amount = getAbsoluteSettledAmount(transaction);

                        BigDecimal signedAmount = resolveSignedAccountMovement(
                                        transaction,
                                        amount);

                        runningBalance = runningBalance.add(signedAmount);

                        if (transaction.getType() == FinancialTransactionType.INCOME) {
                                incomeTotal = incomeTotal.add(amount);
                        }

                        if (transaction.getType() == FinancialTransactionType.EXPENSE) {
                                expenseTotal = expenseTotal.add(amount);
                        }

                        if (transaction.getType() == FinancialTransactionType.TRANSFER) {
                                if (transaction.getTransferDirection() == TransferDirection.IN) {
                                        transferInTotal = transferInTotal.add(amount);
                                }

                                if (transaction.getTransferDirection() == TransferDirection.OUT) {
                                        transferOutTotal = transferOutTotal.add(amount);
                                }
                        }

                        String categoryName = transaction.getType() == FinancialTransactionType.TRANSFER
                                        ? "Transferência"
                                        : transaction.getCategory() != null
                                                        ? transaction.getCategory().getName()
                                                        : "Sem categoria";

                        String counterpartyAccountName = transaction.getTransferCounterpartyAccount() != null
                                        ? transaction.getTransferCounterpartyAccount().getName()
                                        : null;

                        items.add(new AccountMovementReportItemResponse(
                                        transaction.getId(),
                                        transaction.getSettlementDate(),
                                        transaction.getType(),
                                        transaction.getTransferDirection(),
                                        resolveTransactionDescription(transaction),
                                        categoryName,
                                        counterpartyAccountName,
                                        amount,
                                        signedAmount,
                                        runningBalance));
                }

                BigDecimal closingBalance = runningBalance;

                BigDecimal netMovement = closingBalance.subtract(
                                openingBalance);

                return new AccountMovementReportResponse(
                                account.getId(),
                                account.getName(),
                                account.getType(),
                                account.getBankName(),
                                resolvedStartDate,
                                resolvedEndDate,
                                openingBalance,
                                incomeTotal,
                                expenseTotal,
                                transferInTotal,
                                transferOutTotal,
                                netMovement,
                                closingBalance,
                                items.size(),
                                items);
        }

        public CreditCardStatementReportResponse getCreditCardStatementReport(
                        UUID organizationId,
                        UUID statementId) {

                organizationAccessService.requireReadAccess(organizationId);

                validateOrganizationExists(organizationId);

                CreditCardStatement statement = creditCardStatementRepository
                                .findForReport(organizationId, statementId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Credit card statement not found"));

                if (statement.getStatus() == CreditCardStatementStatus.CANCELED) {
                        throw new BusinessException(
                                        "Canceled credit card statements cannot be exported");
                }

                List<FinancialTransaction> transactions = financialTransactionRepository
                                .findCreditCardStatementItems(
                                                organizationId,
                                                statementId);

                BigDecimal totalAmount = BigDecimal.ZERO;
                long unclassifiedItemCount = 0;

                List<CreditCardStatementReportItemResponse> items = new ArrayList<>();

                Map<String, BigDecimal> categoryTotals = new LinkedHashMap<>();

                Map<String, Long> categoryItemCounts = new LinkedHashMap<>();

                for (FinancialTransaction transaction : transactions) {
                        BigDecimal amount = resolveCreditCardStatementItemAmount(
                                        transaction);

                        String categoryName = resolveCreditCardStatementCategoryName(
                                        transaction);

                        boolean classified = transaction.getCategory() != null;

                        if (!classified) {
                                unclassifiedItemCount++;
                        }

                        totalAmount = totalAmount.add(amount);

                        categoryTotals.merge(
                                        categoryName,
                                        amount,
                                        BigDecimal::add);

                        categoryItemCounts.merge(
                                        categoryName,
                                        1L,
                                        Long::sum);

                        items.add(new CreditCardStatementReportItemResponse(
                                        transaction.getId(),
                                        transaction.getPurchaseDate(),
                                        resolveTransactionDescription(transaction),
                                        categoryName,
                                        transaction.getInstallmentNumber(),
                                        transaction.getInstallmentCount(),
                                        amount,
                                        classified));
                }

                List<CreditCardStatementCategorySummaryResponse> categoryItems = categoryTotals.entrySet()
                                .stream()
                                .sorted((left, right) -> {
                                        int amountComparison = right.getValue()
                                                        .compareTo(left.getValue());

                                        if (amountComparison != 0) {
                                                return amountComparison;
                                        }

                                        return left.getKey()
                                                        .compareToIgnoreCase(right.getKey());
                                })
                                .map(entry -> new CreditCardStatementCategorySummaryResponse(
                                                entry.getKey(),
                                                entry.getValue(),
                                                categoryItemCounts.get(
                                                                entry.getKey())))
                                .toList();

                BigDecimal paidAmount = statement.getStatus() == CreditCardStatementStatus.PAID
                                ? totalAmount
                                : BigDecimal.ZERO;

                BigDecimal outstandingAmount = totalAmount.subtract(paidAmount);

                return new CreditCardStatementReportResponse(
                                statement.getId(),
                                statement.getName(),

                                statement.getCreditCardAccount().getName(),
                                statement.getCreditCardAccount().getBankName(),

                                statement.getPaymentAccount() != null
                                                ? statement.getPaymentAccount().getName()
                                                : null,

                                statement.getClosingDate(),
                                statement.getDueDate(),
                                statement.getPaymentDate(),

                                statement.getStatus(),

                                totalAmount,
                                paidAmount,
                                outstandingAmount,

                                items.size(),
                                unclassifiedItemCount,

                                categoryItems,
                                items);
        }

        public AccountabilityReportResponse getAccountabilityReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

                organizationAccessService.requireReadAccess(organizationId);

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException(
                                        "End date cannot be before start date");
                }

                LocalDate historyStartDate = resolveAccountabilityHistoryStartDate(
                                organizationId,
                                resolvedStartDate);

                List<SupportAgreement> periodSupportAgreements = findSupportAgreementsForReport(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                List<SupportAgreement> historicalSupportAgreements = supportAgreementRepository
                                .findStartedBeforeForReport(
                                                organizationId,
                                                historyStartDate,
                                                resolvedStartDate);

                List<AccountabilityOpeningBalanceProjection> openingProjections = transactionAllocationRepository
                                .findAccountabilityOpeningBalance(
                                                organizationId,
                                                historyStartDate,
                                                resolvedStartDate);

                Map<String, BigDecimal> openingPendingByBeneficiaryAndFund = buildOpeningPendingAmountMap(
                                openingProjections,
                                historicalSupportAgreements,
                                historyStartDate,
                                resolvedStartDate);

                Map<String, BigDecimal> commitmentByBeneficiaryAndFund = buildCommitmentAmountMap(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                List<AccountabilityReportProjection> projections = transactionAllocationRepository
                                .findAccountabilityReport(
                                                organizationId,
                                                resolvedStartDate,
                                                resolvedEndDate);

                Map<String, AccountabilityReportProjection> projectionByKey = projections.stream()
                                .collect(Collectors.toMap(
                                                projection -> buildBeneficiaryFundKey(
                                                                projection.beneficiaryId(),
                                                                projection.fundId()),
                                                projection -> projection,
                                                (first, ignored) -> first,
                                                LinkedHashMap::new));

                Map<String, AccountabilityRowContext> contextByKey = new LinkedHashMap<>();

                for (AccountabilityReportProjection projection : projections) {
                        addAccountabilityContext(
                                        contextByKey,
                                        projection.beneficiaryId(),
                                        projection.beneficiaryName(),
                                        projection.fundId(),
                                        projection.fundName());
                }

                for (SupportAgreement agreement : periodSupportAgreements) {
                        addAccountabilityContext(
                                        contextByKey,
                                        agreement.getBeneficiary().getId(),
                                        agreement.getBeneficiary().getName(),
                                        agreement.getFund().getId(),
                                        agreement.getFund().getName());
                }

                for (SupportAgreement agreement : historicalSupportAgreements) {
                        addAccountabilityContext(
                                        contextByKey,
                                        agreement.getBeneficiary().getId(),
                                        agreement.getBeneficiary().getName(),
                                        agreement.getFund().getId(),
                                        agreement.getFund().getName());
                }

                for (AccountabilityOpeningBalanceProjection projection : openingProjections) {
                        addAccountabilityContext(
                                        contextByKey,
                                        projection.beneficiaryId(),
                                        projection.beneficiaryName(),
                                        projection.fundId(),
                                        projection.fundName());
                }

                List<AccountabilityReportItemResponse> items = contextByKey.entrySet()
                                .stream()
                                .map(entry -> {
                                        String key = entry.getKey();
                                        AccountabilityRowContext context = entry.getValue();

                                        AccountabilityReportProjection projection = projectionByKey.get(key);

                                        BigDecimal openingPendingAmount = openingPendingByBeneficiaryAndFund
                                                        .getOrDefault(
                                                                        key,
                                                                        BigDecimal.ZERO);

                                        BigDecimal allocatedAmount = projection != null
                                                        ? projection.allocatedAmount()
                                                        : BigDecimal.ZERO;

                                        BigDecimal transferredAmount = projection != null
                                                        ? projection.transferredAmount()
                                                        : BigDecimal.ZERO;

                                        BigDecimal commitmentAmount = commitmentByBeneficiaryAndFund
                                                        .getOrDefault(
                                                                        key,
                                                                        BigDecimal.ZERO);

                                        BigDecimal payableAmount = commitmentAmount
                                                        .add(allocatedAmount);

                                        BigDecimal pendingAmount = openingPendingAmount
                                                        .add(payableAmount)
                                                        .subtract(transferredAmount);

                                        long allocationCount = projection != null
                                                        ? projection.allocationCount()
                                                        : 0;

                                        return new AccountabilityReportItemResponse(
                                                        context.beneficiaryId(),
                                                        context.beneficiaryName(),
                                                        context.fundId(),
                                                        context.fundName(),
                                                        openingPendingAmount,
                                                        allocatedAmount,
                                                        transferredAmount,
                                                        commitmentAmount,
                                                        payableAmount,
                                                        pendingAmount,
                                                        allocationCount);
                                })
                                .sorted(
                                                Comparator.comparing(
                                                                AccountabilityReportItemResponse::beneficiaryName)
                                                                .thenComparing(
                                                                                AccountabilityReportItemResponse::fundName))
                                .toList();

                BigDecimal openingPendingTotal = items.stream()
                                .map(AccountabilityReportItemResponse::openingPendingAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal allocatedTotal = items.stream()
                                .map(AccountabilityReportItemResponse::allocatedAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal transferredTotal = items.stream()
                                .map(AccountabilityReportItemResponse::transferredAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal commitmentTotal = items.stream()
                                .map(AccountabilityReportItemResponse::commitmentAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal payableTotal = items.stream()
                                .map(AccountabilityReportItemResponse::payableAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal pendingTotal = items.stream()
                                .map(AccountabilityReportItemResponse::pendingAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                long beneficiariesWithPendingBalance = items.stream()
                                .filter(item -> item.pendingAmount().compareTo(BigDecimal.ZERO) > 0)
                                .map(AccountabilityReportItemResponse::beneficiaryId)
                                .distinct()
                                .count();

                return new AccountabilityReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                openingPendingTotal,
                                allocatedTotal,
                                transferredTotal,
                                commitmentTotal,
                                payableTotal,
                                pendingTotal,
                                beneficiariesWithPendingBalance,
                                items);
        }

        public AccountabilityByAccountReportResponse getAccountabilityReportByAccount(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

                organizationAccessService.requireReadAccess(organizationId);

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException(
                                        "End date cannot be before start date");
                }

                LocalDate historyStartDate = resolveAccountabilityHistoryStartDate(
                                organizationId,
                                resolvedStartDate);

                List<SupportAgreement> periodSupportAgreements = findSupportAgreementsForReport(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                List<SupportAgreement> historicalSupportAgreements = supportAgreementRepository
                                .findStartedBeforeForReport(
                                                organizationId,
                                                historyStartDate,
                                                resolvedStartDate);

                List<AccountabilityOpeningBalanceProjection> openingProjections = transactionAllocationRepository
                                .findAccountabilityOpeningBalance(
                                                organizationId,
                                                historyStartDate,
                                                resolvedStartDate);

                Map<String, BigDecimal> openingPendingByBeneficiaryAndFund = buildOpeningPendingAmountMap(
                                openingProjections,
                                historicalSupportAgreements,
                                historyStartDate,
                                resolvedStartDate);

                Map<String, BigDecimal> commitmentByBeneficiaryAndFund = buildCommitmentAmountMap(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                List<AccountabilityByAccountProjection> projections = transactionAllocationRepository
                                .findAccountabilityReportByAccount(
                                                organizationId,
                                                resolvedStartDate,
                                                resolvedEndDate);

                Map<String, List<AccountabilityByAccountProjection>> projectionsByBeneficiaryAndFund = new LinkedHashMap<>();

                for (AccountabilityByAccountProjection projection : projections) {
                        String key = buildBeneficiaryFundKey(
                                        projection.beneficiaryId(),
                                        projection.fundId());

                        projectionsByBeneficiaryAndFund
                                        .computeIfAbsent(key, ignored -> new ArrayList<>())
                                        .add(projection);
                }

                Map<String, AccountabilityRowContext> contextByKey = new LinkedHashMap<>();

                for (AccountabilityByAccountProjection projection : projections) {
                        addAccountabilityContext(
                                        contextByKey,
                                        projection.beneficiaryId(),
                                        projection.beneficiaryName(),
                                        projection.fundId(),
                                        projection.fundName());
                }

                for (SupportAgreement agreement : periodSupportAgreements) {
                        addAccountabilityContext(
                                        contextByKey,
                                        agreement.getBeneficiary().getId(),
                                        agreement.getBeneficiary().getName(),
                                        agreement.getFund().getId(),
                                        agreement.getFund().getName());
                }

                for (SupportAgreement agreement : historicalSupportAgreements) {
                        addAccountabilityContext(
                                        contextByKey,
                                        agreement.getBeneficiary().getId(),
                                        agreement.getBeneficiary().getName(),
                                        agreement.getFund().getId(),
                                        agreement.getFund().getName());
                }

                for (AccountabilityOpeningBalanceProjection projection : openingProjections) {

                        addAccountabilityContext(
                                        contextByKey,
                                        projection.beneficiaryId(),
                                        projection.beneficiaryName(),
                                        projection.fundId(),
                                        projection.fundName());
                }

                List<AccountabilityByAccountItemResponse> items = contextByKey.entrySet()
                                .stream()
                                .map(entry -> {
                                        String key = entry.getKey();
                                        AccountabilityRowContext context = entry.getValue();

                                        List<AccountabilityByAccountProjection> accountProjections = projectionsByBeneficiaryAndFund
                                                        .getOrDefault(
                                                                        key,
                                                                        List.of());

                                        List<AccountabilityAccountBreakdownResponse> accounts = accountProjections
                                                        .stream()
                                                        .map(accountProjection -> {
                                                                BigDecimal netMovementAmount = accountProjection
                                                                                .allocatedAmount()
                                                                                .subtract(
                                                                                                accountProjection
                                                                                                                .transferredAmount());

                                                                return new AccountabilityAccountBreakdownResponse(
                                                                                accountProjection.accountId(),
                                                                                accountProjection.accountName(),
                                                                                accountProjection.bankName(),
                                                                                accountProjection.allocatedAmount(),
                                                                                accountProjection.transferredAmount(),
                                                                                netMovementAmount,
                                                                                accountProjection.allocationCount());
                                                        })
                                                        .toList();

                                        BigDecimal openingPendingAmount = openingPendingByBeneficiaryAndFund
                                                        .getOrDefault(
                                                                        key,
                                                                        BigDecimal.ZERO);

                                        BigDecimal allocatedAmount = accounts.stream()
                                                        .map(AccountabilityAccountBreakdownResponse::allocatedAmount)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                                        BigDecimal transferredAmount = accounts.stream()
                                                        .map(AccountabilityAccountBreakdownResponse::transferredAmount)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                                        BigDecimal commitmentAmount = commitmentByBeneficiaryAndFund
                                                        .getOrDefault(
                                                                        key,
                                                                        BigDecimal.ZERO);

                                        BigDecimal payableAmount = commitmentAmount
                                                        .add(allocatedAmount);

                                        BigDecimal pendingAmount = openingPendingAmount
                                                        .add(payableAmount)
                                                        .subtract(transferredAmount);

                                        long allocationCount = accounts.stream()
                                                        .mapToLong(
                                                                        account -> account.allocationCount() != null
                                                                                        ? account.allocationCount()
                                                                                        : 0L)
                                                        .sum();

                                        return new AccountabilityByAccountItemResponse(
                                                        context.beneficiaryId(),
                                                        context.beneficiaryName(),
                                                        context.fundId(),
                                                        context.fundName(),
                                                        openingPendingAmount,
                                                        allocatedAmount,
                                                        transferredAmount,
                                                        commitmentAmount,
                                                        payableAmount,
                                                        pendingAmount,
                                                        allocationCount,
                                                        accounts);
                                })
                                .sorted(
                                                Comparator.comparing(
                                                                AccountabilityByAccountItemResponse::beneficiaryName)
                                                                .thenComparing(
                                                                                AccountabilityByAccountItemResponse::fundName))
                                .toList();

                BigDecimal openingPendingTotal = items.stream()
                                .map(AccountabilityByAccountItemResponse::openingPendingAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal allocatedTotal = items.stream()
                                .map(AccountabilityByAccountItemResponse::allocatedAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal transferredTotal = items.stream()
                                .map(AccountabilityByAccountItemResponse::transferredAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal commitmentTotal = items.stream()
                                .map(AccountabilityByAccountItemResponse::commitmentAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal payableTotal = items.stream()
                                .map(AccountabilityByAccountItemResponse::payableAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal pendingTotal = items.stream()
                                .map(AccountabilityByAccountItemResponse::pendingAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                long beneficiariesWithPendingBalance = items.stream()
                                .filter(item -> item.pendingAmount().compareTo(BigDecimal.ZERO) > 0)
                                .map(AccountabilityByAccountItemResponse::beneficiaryId)
                                .distinct()
                                .count();

                return new AccountabilityByAccountReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                openingPendingTotal,
                                allocatedTotal,
                                transferredTotal,
                                commitmentTotal,
                                payableTotal,
                                pendingTotal,
                                beneficiariesWithPendingBalance,
                                items);
        }

        public PendingItemsReportResponse getPendingItemsReport(
                        UUID organizationId,
                        Integer limit) {

                organizationAccessService.requireReadAccess(organizationId);

                validateOrganizationExists(organizationId);

                int resolvedLimit = limit != null
                                ? Math.max(5, Math.min(limit, 50))
                                : 10;

                long unclassifiedCount = financialTransactionRepository
                                .countUnclassifiedByOrganizationId(
                                                organizationId,
                                                FinancialTransactionStatus.CANCELED,
                                                FinancialTransactionType.TRANSFER);

                long unallocatedCount = financialTransactionRepository
                                .countUnallocatedByOrganizationId(
                                                organizationId,
                                                FinancialTransactionStatus.SETTLED,
                                                FinancialTransactionType.TRANSFER);

                long missingDocumentsCount = financialTransactionRepository
                                .countPendingDocumentItems(organizationId);

                long pendingCreditCardStatementsCount = creditCardStatementRepository
                                .countPendingCreditCardStatements(organizationId);

                long negativeFundsCount = fundRepository
                                .countNegativeFunds(organizationId);

                List<PendingTransactionItemResponse> unclassifiedTransactions = financialTransactionRepository
                                .findUnclassifiedActionItems(organizationId, resolvedLimit)
                                .stream()
                                .map(item -> toPendingTransactionItemResponse(
                                                item,
                                                "Transação sem categoria"))
                                .toList();

                List<PendingTransactionItemResponse> unallocatedTransactions = financialTransactionRepository
                                .findUnallocatedActionItems(organizationId, resolvedLimit)
                                .stream()
                                .map(item -> toPendingTransactionItemResponse(
                                                item,
                                                "Transação liquidada com alocação pendente"))
                                .toList();

                List<PendingTransactionItemResponse> missingDocumentTransactions = financialTransactionRepository
                                .findPendingDocumentItems(organizationId, resolvedLimit)
                                .stream()
                                .map(this::toPendingTransactionItemResponse)
                                .toList();

                List<PendingCreditCardStatementResponse> pendingCreditCardStatements = creditCardStatementRepository
                                .findPendingCreditCardStatementItems(
                                                organizationId,
                                                resolvedLimit)
                                .stream()
                                .map(this::toPendingCreditCardStatementResponse)
                                .toList();

                List<PendingFundResponse> negativeFunds = fundRepository
                                .findNegativeFundActionItems(
                                                organizationId,
                                                resolvedLimit)
                                .stream()
                                .map(item -> new PendingFundResponse(
                                                item.getFundId(),
                                                item.getFundName(),
                                                item.getCurrentBalance(),
                                                "Fundo com saldo negativo"))
                                .toList();

                return new PendingItemsReportResponse(
                                unclassifiedCount,
                                unallocatedCount,
                                missingDocumentsCount,
                                pendingCreditCardStatementsCount,
                                negativeFundsCount,
                                unclassifiedTransactions,
                                unallocatedTransactions,
                                missingDocumentTransactions,
                                pendingCreditCardStatements,
                                negativeFunds);
        }

        public AccountCashFlowReportResponse getAccountCashFlowReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

                organizationAccessService.requireReadAccess(organizationId);

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException("End date cannot be before start date");
                }

                List<AccountCashFlowProjection> projections = accountRepository
                                .findAccountCashFlowReport(
                                                organizationId,
                                                resolvedStartDate,
                                                resolvedEndDate);

                List<AccountCashFlowItemResponse> items = projections
                                .stream()
                                .map(this::toAccountCashFlowItemResponse)
                                .toList();

                BigDecimal openingBalanceTotal = items.stream()
                                .map(AccountCashFlowItemResponse::openingBalance)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal incomeTotal = items.stream()
                                .map(AccountCashFlowItemResponse::incomeAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal expenseTotal = items.stream()
                                .map(AccountCashFlowItemResponse::expenseAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal transferTotal = projections.stream()
                                .map(projection -> projection.getTransferOutAmount() != null
                                                ? projection.getTransferOutAmount()
                                                : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal netTotal = incomeTotal.subtract(expenseTotal);

                BigDecimal closingBalanceTotal = items.stream()
                                .map(AccountCashFlowItemResponse::closingBalance)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal currentBalanceTotal = items.stream()
                                .map(AccountCashFlowItemResponse::currentBalance)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                long transactionCount = items.stream()
                                .mapToLong(AccountCashFlowItemResponse::transactionCount)
                                .sum();

                return new AccountCashFlowReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                openingBalanceTotal,
                                incomeTotal,
                                expenseTotal,
                                transferTotal,
                                netTotal,
                                closingBalanceTotal,
                                currentBalanceTotal,
                                transactionCount,
                                items);
        }

        private void validateAccountMovementReportStartDate(
                        Account account,
                        LocalDate startDate) {

                if (account.getInitialBalanceDate() != null
                                && startDate.isBefore(account.getInitialBalanceDate())) {
                        throw new BusinessException(
                                        "The selected period starts before the account initial balance date");
                }
        }

        private BigDecimal getAbsoluteSettledAmount(
                        FinancialTransaction transaction) {

                if (transaction.getSettledAmount() == null) {
                        return BigDecimal.ZERO;
                }

                return transaction.getSettledAmount().abs();
        }

        private BigDecimal resolveSignedAccountMovement(
                        FinancialTransaction transaction,
                        BigDecimal amount) {

                return switch (transaction.getType()) {
                        case INCOME -> amount;

                        case EXPENSE -> amount.negate();

                        case TRANSFER -> {
                                if (transaction.getTransferDirection() == TransferDirection.IN) {
                                        yield amount;
                                }

                                if (transaction.getTransferDirection() == TransferDirection.OUT) {
                                        yield amount.negate();
                                }

                                yield BigDecimal.ZERO;
                        }
                };
        }

        private String resolveTransactionDescription(
                        FinancialTransaction transaction) {

                if (transaction.getDescription() != null
                                && !transaction.getDescription().isBlank()) {
                        return transaction.getDescription();
                }

                if (transaction.getRawDescription() != null
                                && !transaction.getRawDescription().isBlank()) {
                        return transaction.getRawDescription();
                }

                return "Sem descrição";
        }

        private BigDecimal resolveCreditCardStatementItemAmount(
                        FinancialTransaction transaction) {

                BigDecimal amount = transaction.getExpectedAmount();

                if (amount == null) {
                        amount = transaction.getSettledAmount();
                }

                return amount != null
                                ? amount.abs()
                                : BigDecimal.ZERO;
        }

        private String resolveCreditCardStatementCategoryName(
                        FinancialTransaction transaction) {

                if (transaction.getCategory() == null
                                || transaction.getCategory().getName() == null
                                || transaction.getCategory().getName().isBlank()) {
                        return "Sem categoria";
                }

                return transaction.getCategory().getName();
        }

        private void validateOrganizationExists(UUID organizationId) {
                if (!organizationRepository.existsById(organizationId)) {
                        throw new ResourceNotFoundException("Organization not found");
                }
        }

        private boolean hasFundMovement(
                        FundMovementReportItemResponse item) {

                return item.incomeAllocatedAmount().compareTo(BigDecimal.ZERO) != 0
                                || item.expenseAllocatedAmount().compareTo(BigDecimal.ZERO) != 0
                                || item.incomingTransferAmount().compareTo(BigDecimal.ZERO) != 0
                                || item.outgoingTransferAmount().compareTo(BigDecimal.ZERO) != 0;
        }

        private BigDecimal calculateCommitmentAmountForPeriod(
                        SupportAgreement agreement,
                        LocalDate startDate,
                        LocalDate endDate) {
                LocalDate effectiveStartDate = agreement.getStartDate().isAfter(startDate)
                                ? agreement.getStartDate()
                                : startDate;

                LocalDate effectiveEndDate = agreement.getEndDate() != null
                                && agreement.getEndDate().isBefore(endDate)
                                                ? agreement.getEndDate()
                                                : endDate;

                if (effectiveEndDate.isBefore(effectiveStartDate)) {
                        return BigDecimal.ZERO;
                }

                long months = ChronoUnit.MONTHS.between(
                                effectiveStartDate.withDayOfMonth(1),
                                effectiveEndDate.withDayOfMonth(1)) + 1;

                return agreement.getAmount().multiply(BigDecimal.valueOf(months));
        }

        private Map<String, BigDecimal> buildCommitmentAmountMap(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {
                List<SupportAgreement> agreements = supportAgreementRepository.findActiveInPeriodForReport(
                                organizationId,
                                startDate,
                                endDate);

                Map<String, BigDecimal> commitmentByBeneficiaryAndFund = new HashMap<>();

                for (SupportAgreement agreement : agreements) {
                        String key = buildBeneficiaryFundKey(
                                        agreement.getBeneficiary().getId(),
                                        agreement.getFund().getId());

                        BigDecimal commitmentAmount = calculateCommitmentAmountForPeriod(
                                        agreement,
                                        startDate,
                                        endDate);

                        commitmentByBeneficiaryAndFund.merge(
                                        key,
                                        commitmentAmount,
                                        BigDecimal::add);
                }

                return commitmentByBeneficiaryAndFund;
        }

        private LocalDate resolveAccountabilityHistoryStartDate(
                        UUID organizationId,
                        LocalDate reportStartDate) {

                return organizationSettingsRepository
                                .findByOrganizationId(organizationId)
                                .map(OrganizationSettings::getAccountabilityHistoryStartDate)
                                .filter(historyStartDate -> historyStartDate.isBefore(reportStartDate))
                                .orElse(reportStartDate);
        }

        private Map<String, BigDecimal> buildOpeningPendingAmountMap(
                        List<AccountabilityOpeningBalanceProjection> openingProjections,
                        List<SupportAgreement> historicalSupportAgreements,
                        LocalDate historyStartDate,
                        LocalDate periodStartDate) {

                Map<String, BigDecimal> openingPendingByBeneficiaryAndFund = new HashMap<>();

                for (AccountabilityOpeningBalanceProjection projection : openingProjections) {

                        String key = buildBeneficiaryFundKey(
                                        projection.beneficiaryId(),
                                        projection.fundId());

                        openingPendingByBeneficiaryAndFund.merge(
                                        key,
                                        projection.netAllocationBalance(),
                                        BigDecimal::add);
                }

                Map<String, BigDecimal> historicalCommitmentByBeneficiaryAndFund = buildHistoricalCommitmentAmountMap(
                                historicalSupportAgreements,
                                historyStartDate,
                                periodStartDate);

                for (Map.Entry<String, BigDecimal> entry : historicalCommitmentByBeneficiaryAndFund.entrySet()) {

                        openingPendingByBeneficiaryAndFund.merge(
                                        entry.getKey(),
                                        entry.getValue(),
                                        BigDecimal::add);
                }

                return openingPendingByBeneficiaryAndFund;
        }

        private Map<String, BigDecimal> buildHistoricalCommitmentAmountMap(
                        List<SupportAgreement> agreements,
                        LocalDate historyStartDate,
                        LocalDate periodStartDate) {

                Map<String, BigDecimal> commitmentByBeneficiaryAndFund = new HashMap<>();

                LocalDate historicalEndDate = periodStartDate.minusDays(1);

                for (SupportAgreement agreement : agreements) {
                        LocalDate effectiveHistoricalStartDate = agreement.getStartDate().isAfter(historyStartDate)
                                        ? agreement.getStartDate()
                                        : historyStartDate;

                        if (!effectiveHistoricalStartDate.isBefore(periodStartDate)) {
                                continue;
                        }

                        BigDecimal historicalCommitmentAmount = calculateCommitmentAmountForPeriod(
                                        agreement,
                                        effectiveHistoricalStartDate,
                                        historicalEndDate);

                        if (historicalCommitmentAmount.compareTo(BigDecimal.ZERO) <= 0) {
                                continue;
                        }

                        String key = buildBeneficiaryFundKey(
                                        agreement.getBeneficiary().getId(),
                                        agreement.getFund().getId());

                        commitmentByBeneficiaryAndFund.merge(
                                        key,
                                        historicalCommitmentAmount,
                                        BigDecimal::add);
                }

                return commitmentByBeneficiaryAndFund;
        }

        private void addAccountabilityContext(
                        Map<String, AccountabilityRowContext> contextByKey,
                        UUID beneficiaryId,
                        String beneficiaryName,
                        UUID fundId,
                        String fundName) {

                String key = buildBeneficiaryFundKey(beneficiaryId, fundId);

                contextByKey.putIfAbsent(
                                key,
                                new AccountabilityRowContext(
                                                beneficiaryId,
                                                beneficiaryName,
                                                fundId,
                                                fundName));
        }

        private String buildBeneficiaryFundKey(UUID beneficiaryId, UUID fundId) {
                return beneficiaryId + ":" + fundId;
        }

        private List<SupportAgreement> findSupportAgreementsForReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

                return supportAgreementRepository.findApplicableInPeriodForReport(
                                organizationId,
                                startDate,
                                endDate);
        }

        private PendingTransactionItemResponse toPendingTransactionItemResponse(
                        DashboardTransactionActionItemProjection item,
                        String reason) {

                return new PendingTransactionItemResponse(
                                item.getTransactionId(),
                                item.getSettlementDate(),
                                item.getDescription(),
                                item.getRawDescription(),
                                item.getAccountName(),
                                item.getCategoryName(),
                                item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO,
                                reason);
        }

        private PendingTransactionItemResponse toPendingTransactionItemResponse(
                        PendingDocumentTransactionProjection item) {

                return new PendingTransactionItemResponse(
                                item.getTransactionId(),
                                item.getSettlementDate(),
                                item.getDescription(),
                                item.getRawDescription(),
                                item.getAccountName(),
                                item.getCategoryName(),
                                item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO,
                                item.getReason());
        }

        private PendingCreditCardStatementResponse toPendingCreditCardStatementResponse(
                        PendingCreditCardStatementProjection item) {

                return new PendingCreditCardStatementResponse(
                                item.getId(),
                                item.getName(),
                                item.getAccountName(),
                                item.getStatus(),
                                item.getDueDate(),
                                item.getTotalAmount() != null
                                                ? item.getTotalAmount()
                                                : BigDecimal.ZERO,
                                item.getPendingItemsCount() != null
                                                ? item.getPendingItemsCount()
                                                : 0,
                                item.getReason());
        }

        private AccountCashFlowItemResponse toAccountCashFlowItemResponse(
                        AccountCashFlowProjection projection) {

                BigDecimal initialBalance = projection.getInitialBalance() != null
                                ? projection.getInitialBalance()
                                : BigDecimal.ZERO;

                BigDecimal incomeBefore = projection.getIncomeBefore() != null
                                ? projection.getIncomeBefore()
                                : BigDecimal.ZERO;

                BigDecimal expenseBefore = projection.getExpenseBefore() != null
                                ? projection.getExpenseBefore()
                                : BigDecimal.ZERO;

                BigDecimal transferBefore = projection.getTransferBefore() != null
                                ? projection.getTransferBefore()
                                : BigDecimal.ZERO;

                BigDecimal incomeAmount = projection.getIncomeAmount() != null
                                ? projection.getIncomeAmount()
                                : BigDecimal.ZERO;

                BigDecimal expenseAmount = projection.getExpenseAmount() != null
                                ? projection.getExpenseAmount()
                                : BigDecimal.ZERO;

                BigDecimal transferAmount = projection.getTransferAmount() != null
                                ? projection.getTransferAmount()
                                : BigDecimal.ZERO;

                BigDecimal incomeUntilToday = projection.getIncomeUntilToday() != null
                                ? projection.getIncomeUntilToday()
                                : BigDecimal.ZERO;

                BigDecimal expenseUntilToday = projection.getExpenseUntilToday() != null
                                ? projection.getExpenseUntilToday()
                                : BigDecimal.ZERO;

                BigDecimal transferUntilToday = projection.getTransferUntilToday() != null
                                ? projection.getTransferUntilToday()
                                : BigDecimal.ZERO;

                BigDecimal openingBalance = initialBalance
                                .add(incomeBefore)
                                .subtract(expenseBefore)
                                .add(transferBefore);

                BigDecimal netAmount = incomeAmount
                                .subtract(expenseAmount);

                BigDecimal closingBalance = openingBalance
                                .add(netAmount)
                                .add(transferAmount);

                BigDecimal currentBalance = initialBalance
                                .add(incomeUntilToday)
                                .subtract(expenseUntilToday)
                                .add(transferUntilToday);

                long transactionCount = projection.getTransactionCount() != null
                                ? projection.getTransactionCount()
                                : 0;

                return new AccountCashFlowItemResponse(
                                projection.getAccountId(),
                                projection.getAccountName(),
                                AccountType.valueOf(projection.getAccountType()),
                                projection.getBankName(),
                                openingBalance,
                                incomeAmount,
                                expenseAmount,
                                transferAmount,
                                netAmount,
                                closingBalance,
                                currentBalance,
                                transactionCount);
        }

        private record AccountabilityRowContext(
                        UUID beneficiaryId,
                        String beneficiaryName,
                        UUID fundId,
                        String fundName) {
        }
}