package com.fluxfund.api.domain.report.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityAccountBreakdownResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountItemResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountProjection;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountReportResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportItemResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportResponse;
import com.fluxfund.api.domain.report.dto.category.CategoryResultReportResponse;
import com.fluxfund.api.domain.report.dto.fund.FundReportItemResponse;
import com.fluxfund.api.domain.report.dto.fund.FundReportResponse;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
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

        public CategoryResultReportResponse getCategoryResultReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

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

        public FundReportResponse getFundReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

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

                                        BigDecimal currentBalance = projection.initialBalance()
                                                        .add(projection.historicalAllocationBalance());

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

                var projections = transactionAllocationRepository.findAccountabilityReport(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                var items = projections.stream()
                                .map(projection -> {
                                        BigDecimal pendingAmount = projection.allocatedAmount()
                                                        .subtract(projection.transferredAmount());

                                        return new AccountabilityReportItemResponse(
                                                        projection.beneficiaryId(),
                                                        projection.beneficiaryName(),
                                                        projection.fundId(),
                                                        projection.fundName(),
                                                        projection.allocatedAmount(),
                                                        projection.transferredAmount(),
                                                        pendingAmount,
                                                        projection.allocationCount());
                                })
                                .toList();

                BigDecimal allocatedTotal = items.stream()
                                .map(AccountabilityReportItemResponse::allocatedAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal transferredTotal = items.stream()
                                .map(AccountabilityReportItemResponse::transferredAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal pendingTotal = allocatedTotal.subtract(transferredTotal);

                long beneficiariesWithPendingBalance = items.stream()
                                .filter(item -> item.pendingAmount().compareTo(BigDecimal.ZERO) > 0)
                                .map(AccountabilityReportItemResponse::beneficiaryId)
                                .distinct()
                                .count();

                return new AccountabilityReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                allocatedTotal,
                                transferredTotal,
                                pendingTotal,
                                beneficiariesWithPendingBalance,
                                items);
        }

        public AccountabilityByAccountReportResponse getAccountabilityReportByAccount(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

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

                var projections = transactionAllocationRepository.findAccountabilityReportByAccount(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                Map<String, List<AccountabilityByAccountProjection>> grouped = new LinkedHashMap<>();

                for (AccountabilityByAccountProjection projection : projections) {
                        String key = projection.beneficiaryId() + ":" + projection.fundId();

                        grouped.computeIfAbsent(key, ignored -> new ArrayList<>())
                                        .add(projection);
                }

                List<AccountabilityByAccountItemResponse> items = grouped.values()
                                .stream()
                                .map(group -> {
                                        AccountabilityByAccountProjection first = group.get(0);

                                        List<AccountabilityAccountBreakdownResponse> accounts = group.stream()
                                                        .map(accountProjection -> {
                                                                BigDecimal accountPendingAmount = accountProjection
                                                                                .allocatedAmount()
                                                                                .subtract(accountProjection
                                                                                                .transferredAmount());

                                                                return new AccountabilityAccountBreakdownResponse(
                                                                                accountProjection.accountId(),
                                                                                accountProjection.accountName(),
                                                                                accountProjection.bankName(),
                                                                                accountProjection.allocatedAmount(),
                                                                                accountProjection.transferredAmount(),
                                                                                accountPendingAmount,
                                                                                accountProjection.allocationCount());
                                                        })
                                                        .toList();

                                        BigDecimal allocatedAmount = accounts.stream()
                                                        .map(AccountabilityAccountBreakdownResponse::allocatedAmount)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                                        BigDecimal transferredAmount = accounts.stream()
                                                        .map(AccountabilityAccountBreakdownResponse::transferredAmount)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                                        BigDecimal pendingAmount = allocatedAmount.subtract(transferredAmount);

                                        long allocationCount = accounts.stream()
                                                        .mapToLong(AccountabilityAccountBreakdownResponse::allocationCount)
                                                        .sum();

                                        return new AccountabilityByAccountItemResponse(
                                                        first.beneficiaryId(),
                                                        first.beneficiaryName(),
                                                        first.fundId(),
                                                        first.fundName(),
                                                        allocatedAmount,
                                                        transferredAmount,
                                                        pendingAmount,
                                                        allocationCount,
                                                        accounts);
                                })
                                .toList();

                BigDecimal allocatedTotal = items.stream()
                                .map(AccountabilityByAccountItemResponse::allocatedAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal transferredTotal = items.stream()
                                .map(AccountabilityByAccountItemResponse::transferredAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal pendingTotal = allocatedTotal.subtract(transferredTotal);

                long beneficiariesWithPendingBalance = items.stream()
                                .filter(item -> item.pendingAmount().compareTo(BigDecimal.ZERO) > 0)
                                .map(AccountabilityByAccountItemResponse::beneficiaryId)
                                .distinct()
                                .count();

                return new AccountabilityByAccountReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                allocatedTotal,
                                transferredTotal,
                                pendingTotal,
                                beneficiariesWithPendingBalance,
                                items);
        }

        private void validateOrganizationExists(UUID organizationId) {
                if (!organizationRepository.existsById(organizationId)) {
                        throw new ResourceNotFoundException("Organization not found");
                }
        }
}