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

import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.domain.dashboard.dto.DashboardTransactionActionItemProjection;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
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
import com.fluxfund.api.domain.report.dto.category.CategoryResultItemResponse;
import com.fluxfund.api.domain.report.dto.category.CategoryResultReportResponse;
import com.fluxfund.api.domain.report.dto.expense.SettledExpenseReportItemResponse;
import com.fluxfund.api.domain.report.dto.expense.SettledExpenseReportResponse;
import com.fluxfund.api.domain.report.dto.fund.FundReportItemResponse;
import com.fluxfund.api.domain.report.dto.fund.FundReportResponse;
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

                List<AccountCashFlowItemResponse> items = accountRepository
                                .findAccountCashFlowReport(
                                                organizationId,
                                                resolvedStartDate,
                                                resolvedEndDate)
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

                BigDecimal transferTotal = items.stream()
                                .map(AccountCashFlowItemResponse::transferAmount)
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

        private void validateOrganizationExists(UUID organizationId) {
                if (!organizationRepository.existsById(organizationId)) {
                        throw new ResourceNotFoundException("Organization not found");
                }
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

                BigDecimal openingBalance = initialBalance
                                .add(incomeBefore)
                                .subtract(expenseBefore);

                BigDecimal netAmount = incomeAmount.subtract(expenseAmount);

                BigDecimal currentBalance = initialBalance
                                .add(incomeUntilToday)
                                .subtract(expenseUntilToday);

                BigDecimal closingBalance = openingBalance.add(netAmount);

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